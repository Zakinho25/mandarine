import { ACTIVE_SKILLS, cardKey } from '@/domain/srs/cards'
import { isMastered } from '@/domain/srs/scheduler'
import { allCards, localDay, scheduler, todayStat } from './cards'

/**
 * Chiffres du tableau de bord.
 *
 * Un mot n'est **maîtrisé** que si toutes ses compétences actives le sont :
 * savoir reconnaître 学习 sans savoir le produire n'est pas savoir le mot. La
 * définition est affichée à l'utilisateur — un compteur dont personne ne
 * connaît la règle est un chiffre décoratif.
 */

export interface Progress {
  /** Mots rencontrés au moins une fois. */
  readonly seen: number
  /** Mots dont toutes les compétences actives sont maîtrisées. */
  readonly mastered: number
  readonly minutesToday: number
  readonly reviewsToday: number
  /** Nombre de cartes dues maintenant. */
  readonly dueNow: number
}

export async function computeProgress(now: Date = new Date()): Promise<Progress> {
  const cards = await allCards()
  const stat = await todayStat(now)
  const iso = now.toISOString()

  const byId = new Map(cards.map((card) => [card.id, card]))
  const targets = new Set(cards.map((card) => card.targetId))

  let seen = 0
  let mastered = 0

  for (const targetId of targets) {
    const skills = ACTIVE_SKILLS.map((skill) =>
      byId.get(cardKey('lexeme', targetId, skill)),
    )
    if (skills.some((card) => card !== undefined && card.reps > 0)) seen += 1
    if (
      skills.length > 0 &&
      skills.every((card) => card !== undefined && isMastered(card, iso, scheduler))
    ) {
      mastered += 1
    }
  }

  const dueNow = cards.filter(
    (card) => card.state !== 0 && card.suspendedAt === null && card.due <= iso,
  ).length

  return {
    seen,
    mastered,
    minutesToday: Math.round((stat?.activeMs ?? 0) / 60_000),
    reviewsToday: stat?.reviews ?? 0,
    dueNow,
  }
}

export { localDay }
