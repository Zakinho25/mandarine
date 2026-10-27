import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { ContentFile, ContentIndex, Lexeme } from '../../src/data/content.ts'
import type { Dialogue, DialoguesIndex } from '../../src/data/dialogues.ts'
import type { GrammaireIndex, NiveauGrammaire } from '../../src/data/grammaire.ts'
import type { Texte, TextesIndex } from '../../src/data/textes.ts'
import { PARTIES } from '../../src/domain/examen/format.ts'
import {
  genererExamen,
  itemsDe,
  type EchangeSource,
  type MotSource,
  type PassageSource,
  type PhraseSource,
  type Vivier,
} from '../../src/domain/examen/generation.ts'

/**
 * Un examen blanc n'est fabricable que si le contenu fournit assez de
 * matière. Les tests de la génération tournent sur un vivier synthétique, ce
 * qui vérifie l'algorithme ; ceux-ci le font tourner sur le **contenu réel**,
 * ce qui vérifie qu'il y en a assez.
 *
 * C'est la différence entre « l'examen se fabrique » et « l'examen se
 * fabrique avec ce que cette application contient aujourd'hui ».
 */

function read<T>(path: string): T {
  return JSON.parse(readFileSync(`public/content/${path}`, 'utf8')) as T
}

const contentIndex = read<ContentIndex>('index.json')
const lexemes: Lexeme[] = contentIndex.levels.flatMap(
  (level) => read<ContentFile>(level.file).lexemes,
)

const grammaireIndex = read<GrammaireIndex>('grammaire/index.json')
const niveaux = [1, 2, 3].map((level) =>
  read<NiveauGrammaire>(`grammaire/niveau-${String(level)}.json`),
)

const textesIndex = read<TextesIndex>('textes/index.json')
const textes = textesIndex.textes.map((resume) =>
  read<Texte>(`textes/${resume.id}.json`),
)

const dialoguesIndex = read<DialoguesIndex>('dialogues/index.json')
const dialogues = dialoguesIndex.dialogues.map((resume) =>
  read<Dialogue>(`dialogues/${resume.id}.json`),
)

function texte(tokens: readonly { text: string }[]): string {
  return tokens.map((jeton) => jeton.text).join('')
}

/** Assemble le vivier comme le fait l'application, mais depuis le disque. */
const VIVIER: Vivier = {
  mots: lexemes.map(
    (lexeme): MotSource => ({
      id: lexeme.id,
      simplified: lexeme.simplified,
      pinyinNum: lexeme.pinyinNum,
      glossFr: lexeme.glossFr,
      level: lexeme.hsk2025,
    }),
  ),
  phrases: niveaux.flatMap((fichier) =>
    fichier.points.flatMap((point) =>
      point.exemples.map(
        (exemple, index): PhraseSource => ({
          id: `${point.id}#${String(index)}`,
          level: point.level,
          zh: texte(exemple.tokens),
          fr: exemple.fr,
          tokens: exemple.tokens,
          pointId: point.id,
          markers: point.markers,
        }),
      ),
    ),
  ),
  echanges: dialogues.flatMap((dialogue) =>
    dialogue.nodes.flatMap((noeud): EchangeSource[] => {
      const juste = noeud.repliques.find((replique) => replique.qualite === 'juste')
      if (juste === undefined) return []
      const phrase = (
        suffixe: string,
        tokens: readonly { text: string; lexemeId: string | null }[],
        fr: string,
      ): PhraseSource => ({
        id: `${dialogue.id}/${noeud.id}/${suffixe}`,
        level: dialogue.level,
        zh: texte(tokens),
        fr,
        tokens,
        pointId: null,
        markers: [],
      })
      return [
        {
          id: `${dialogue.id}/${noeud.id}`,
          level: dialogue.level,
          amorce: phrase('amorce', noeud.tokens, noeud.fr),
          bonne: phrase('juste', juste.tokens, juste.fr),
          mauvaises: noeud.repliques
            .filter((replique) => replique.qualite !== 'juste')
            .map((replique, index) =>
              phrase(`autre-${String(index)}`, replique.tokens, replique.fr),
            ),
        },
      ]
    }),
  ),
  passages: textes.flatMap((fichier) =>
    fichier.paragraphs.map(
      (paragraphe, index): PassageSource => ({
        id: `${fichier.id}#${String(index)}`,
        level: fichier.level,
        texteId: fichier.id,
        fr: paragraphe.fr,
        tokens: paragraphe.tokens,
      }),
    ),
  ),
  marqueurs: [
    ...new Set(
      niveaux.flatMap((fichier) => fichier.points.flatMap((point) => point.markers)),
    ),
  ],
}

const COMPLET = PARTIES.reduce((somme, partie) => somme + partie.items.complet, 0)

describe('le contenu suffit à fabriquer un examen', () => {
  it('remplit une épreuve complète au niveau 3', () => {
    const examen = genererExamen(VIVIER, {
      level: 3,
      longueur: 'complet',
      seed: 1,
      creeA: '2026-03-01T10:00:00.000Z',
    })
    const manquants = examen.parties.filter((partie) => partie.manquants > 0)
    expect(
      manquants.map((partie) => `${partie.id} : ${String(partie.manquants)}`),
    ).toEqual([])
    expect(itemsDe(examen)).toHaveLength(COMPLET)
  })

  it.each([1, 2, 3])('remplit une épreuve courte au niveau %i', (level) => {
    const examen = genererExamen(VIVIER, {
      level,
      longueur: 'court',
      seed: 7,
      creeA: '2026-03-01T10:00:00.000Z',
    })
    const manquants = examen.parties.filter((partie) => partie.manquants > 0)
    expect(
      manquants.map((partie) => `${partie.id} : ${String(partie.manquants)}`),
    ).toEqual([])
  })

  it('ne propose jamais un mot au-dessus du niveau demandé', () => {
    const parId = new Map(lexemes.map((lexeme) => [lexeme.id, lexeme]))
    const hors: string[] = []

    for (const level of [1, 2]) {
      const examen = genererExamen(VIVIER, {
        level,
        longueur: 'court',
        seed: 3,
        creeA: '2026-03-01T10:00:00.000Z',
      })
      for (const item of itemsDe(examen)) {
        for (const jeton of item.enonce ?? []) {
          if (jeton.lexemeId === null) continue
          const lexeme = parId.get(jeton.lexemeId)
          if (lexeme !== undefined && lexeme.hsk2025 > level) {
            hors.push(`niveau ${String(level)}, ${item.id} : ${jeton.text}`)
          }
        }
        for (const choix of item.choix) {
          const lexeme = parId.get(choix.id)
          if (lexeme !== undefined && lexeme.hsk2025 > level) {
            hors.push(`niveau ${String(level)}, ${item.id} : choix ${choix.zh ?? ''}`)
          }
        }
      }
    }
    expect(hors).toEqual([])
  })

  it('ne pose jamais un item dont deux choix disent la même chose', () => {
    // Avec du contenu réel, deux traductions identiques rendraient un item
    // insoluble. C'est la raison d'être du test d'unicité sur les exemples de
    // grammaire ; ici on vérifie le résultat.
    // Dix examens complets, soit six cents items : assez pour qu'une
    // collision de traduction dans le contenu ressorte, sans faire durer la
    // suite de tests plus que nécessaire.
    const ambigus: string[] = []
    for (let seed = 1; seed <= 10; seed += 1) {
      const examen = genererExamen(VIVIER, {
        level: 3,
        longueur: 'complet',
        seed,
        creeA: '2026-03-01T10:00:00.000Z',
      })
      for (const item of itemsDe(examen)) {
        const textes = item.choix.map((choix) => choix.fr ?? choix.zh ?? '')
        if (new Set(textes).size !== textes.length) {
          ambigus.push(`graine ${String(seed)}, ${item.id} : ${textes.join(' / ')}`)
        }
      }
    }
    expect(ambigus).toEqual([])
  })

  it('couvre des points de grammaire différents d’un examen à l’autre', () => {
    const vus = new Set<string>()
    for (let seed = 1; seed <= 10; seed += 1) {
      const examen = genererExamen(VIVIER, {
        level: 3,
        longueur: 'complet',
        seed,
        creeA: '2026-03-01T10:00:00.000Z',
      })
      for (const item of itemsDe(examen)) {
        if (item.pointId !== null) vus.add(item.pointId)
      }
    }
    // Sur dix examens, l'essentiel du programme doit être passé en revue au
    // moins une fois ; sinon le tirage est trop étroit pour mesurer un
    // niveau.
    expect(vus.size).toBeGreaterThan(grammaireIndex.count / 2)
  })
})
