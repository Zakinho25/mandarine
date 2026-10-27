import { describe, expect, it } from 'vitest'
import {
  ACTIVE_SKILLS,
  cardKey,
  seedsForLexeme,
  SKILLS_PLANIFIEES,
  skillsRevisables,
} from './cards'
import { buildSession, type QueueCard } from './queue'
import { createScheduler, type SrsState } from './scheduler'

const NOW = '2026-03-10T09:00:00.000Z'
const scheduler = createScheduler({ fuzz: false })

function card(
  targetId: string,
  skill: 'zh_fr' | 'fr_zh',
  state: Partial<SrsState> = {},
): QueueCard {
  return {
    key: cardKey('lexeme', targetId, skill),
    targetId,
    skill,
    state: { ...scheduler.create(NOW), ...state },
  }
}

/** Carte due : en révision, échéance passée. */
function dueCard(targetId: string, due: string): QueueCard {
  return card(targetId, 'zh_fr', { state: 2, due, stability: 10, reps: 3 })
}

describe('cartes par compétence', () => {
  it('crée une carte par compétence planifiée', () => {
    // La création ne dépend pas de ce que l’appareil sait faire : une
    // sauvegarde du téléphone doit se relire entière sur l’ordinateur.
    const seeds = seedsForLexeme('爱-ai4')
    expect(seeds).toHaveLength(SKILLS_PLANIFIEES.length)
    expect(seeds.map((seed) => seed.skill)).toEqual([...SKILLS_PLANIFIEES])
  })

  it('écarte les cartes sonores quand aucune voix n’est installée', () => {
    const avec = skillsRevisables(true)
    const sans = skillsRevisables(false)
    expect(avec).toContain('audio_fr')
    expect(sans).not.toContain('audio_fr')
    // Rien d’autre ne bouge : le silence ne retire que ce qui a besoin du son.
    expect(sans).toEqual(['zh_fr', 'fr_zh'])
  })

  it('ne compte pas l’écoute dans la définition de la maîtrise', () => {
    // Sinon le compteur de mots maîtrisés vaudrait autre chose selon
    // l’appareil, ce qui le rendrait ininterprétable.
    expect(ACTIVE_SKILLS).not.toContain('audio_fr')
    expect(ACTIVE_SKILLS.every((skill) => SKILLS_PLANIFIEES.includes(skill))).toBe(
      true,
    )
  })

  it('donne une clé stable et distincte par compétence', () => {
    expect(cardKey('lexeme', '爱-ai4', 'zh_fr')).toBe('lexeme:爱-ai4:zh_fr')
    expect(cardKey('lexeme', '爱-ai4', 'zh_fr')).not.toBe(
      cardKey('lexeme', '爱-ai4', 'fr_zh'),
    )
  })
})

describe('buildSession', () => {
  it('fait passer les révisions dues avant les nouveautés', () => {
    const plan = buildSession(
      [card('neuf', 'zh_fr'), dueCard('ancien', '2026-03-01T00:00:00.000Z')],
      { now: NOW, maxNewWords: 10 },
    )
    expect(plan.cards[0]?.targetId).toBe('ancien')
    expect(plan.dueCount).toBe(1)
    expect(plan.newWordCount).toBe(1)
  })

  it('commence par la révision la plus en retard', () => {
    const plan = buildSession(
      [
        dueCard('recent', '2026-03-09T00:00:00.000Z'),
        dueCard('ancien', '2026-01-01T00:00:00.000Z'),
        dueCard('moyen', '2026-02-01T00:00:00.000Z'),
      ],
      { now: NOW, maxNewWords: 0 },
    )
    expect(plan.cards.map((c) => c.targetId)).toEqual(['ancien', 'moyen', 'recent'])
  })

  it('ignore les cartes dont l’échéance n’est pas arrivée', () => {
    const plan = buildSession([dueCard('futur', '2026-12-01T00:00:00.000Z')], {
      now: NOW,
      maxNewWords: 0,
    })
    expect(plan.cards).toHaveLength(0)
  })

  it('plafonne les MOTS nouveaux, pas les cartes', () => {
    // Trois mots, deux cartes chacun. Avec un plafond de deux mots, on attend
    // quatre cartes : le plafond ne doit pas couper un mot en deux.
    const cards = ['a', 'b', 'c'].flatMap((id) => [
      card(id, 'zh_fr'),
      card(id, 'fr_zh'),
    ])
    const plan = buildSession(cards, { now: NOW, maxNewWords: 2 })

    expect(plan.newWordCount).toBe(2)
    expect(plan.cards).toHaveLength(4)
    expect(new Set(plan.cards.map((c) => c.targetId)).size).toBe(2)
  })

  it('n’introduit aucune nouveauté quand le plafond est à zéro', () => {
    const plan = buildSession([card('a', 'zh_fr')], { now: NOW, maxNewWords: 0 })
    expect(plan.cards).toHaveLength(0)
    expect(plan.newWordCount).toBe(0)
  })

  it('écarte les cartes suspendues', () => {
    const plan = buildSession(
      [{ ...dueCard('suspendu', '2026-01-01T00:00:00.000Z'), suspended: true }],
      { now: NOW, maxNewWords: 10 },
    )
    expect(plan.cards).toHaveLength(0)
  })

  it('n’enchaîne pas deux cartes du même mot', () => {
    // Répondre « bonjour » puis devoir écrire `ni3 hao3` juste après ne teste
    // plus la mémoire : la réponse vient d'être affichée.
    const cards = ['a', 'b', 'c'].flatMap((id) => [
      card(id, 'zh_fr'),
      card(id, 'fr_zh'),
    ])
    const plan = buildSession(cards, { now: NOW, maxNewWords: 10 })

    expect(plan.cards).toHaveLength(6)
    for (let i = 1; i < plan.cards.length; i += 1) {
      expect(plan.cards[i]?.targetId).not.toBe(plan.cards[i - 1]?.targetId)
    }
  })

  it('intercale même lorsqu’un seul mot reste à la fin', () => {
    const plan = buildSession(
      [card('a', 'zh_fr'), card('a', 'fr_zh'), card('b', 'zh_fr')],
      { now: NOW, maxNewWords: 10 },
    )
    // Aucune carte n'est refusée : l'intercalage est un confort, pas une règle.
    expect(plan.cards).toHaveLength(3)
    expect(plan.cards[0]?.targetId).not.toBe(plan.cards[1]?.targetId)
  })

  it('signale les révisions reportées par le plafond de sécurité', () => {
    const cards = Array.from({ length: 5 }, (_, i) =>
      dueCard(`mot${String(i)}`, '2026-03-01T00:00:00.000Z'),
    )
    const plan = buildSession(cards, { now: NOW, maxNewWords: 0, maxCards: 3 })

    expect(plan.cards).toHaveLength(3)
    expect(plan.postponed).toBe(2)
  })
})
