import {
  definitionDe,
  SECTIONS,
  SEUIL_REUSSITE_PCT,
  type Longueur,
  type PartieId,
  type Section,
} from './format'
import type { Examen, Item } from './generation'

/**
 * Correction d'un examen blanc.
 *
 * Le score est un **pourcentage de bonnes réponses**, et rien d'autre. Le
 * barème officiel du HSK 3 attribue 100 points par section et demande 180 sur
 * 300 ; on en retient le seuil de 60 %, pas la note, parce qu'afficher « 174
 * sur 300 » laisserait croire à une équivalence que cet examen n'a pas.
 */

/** Réponse donnée pour chaque item : identifiant du choix, ou `null`. */
export type Reponses = Readonly<Record<string, string | null | undefined>>

export interface ScorePartie {
  readonly id: PartieId
  readonly posees: number
  readonly justes: number
  /** Items que la génération n'a pas pu fabriquer. */
  readonly manquants: number
}

export interface ScoreSection {
  readonly section: Section
  readonly posees: number
  readonly justes: number
  readonly pourcentage: number
}

export interface PointFaible {
  readonly pointId: string
  readonly rates: number
  readonly poses: number
}

export interface Resultat {
  readonly examenId: string
  readonly seed: number
  readonly level: number
  readonly longueur: Longueur
  readonly termineA: string
  readonly parties: readonly ScorePartie[]
  readonly sections: readonly ScoreSection[]
  readonly posees: number
  readonly justes: number
  /** Items laissés sans réponse, comptés comme faux. */
  readonly sansReponse: number
  readonly pourcentage: number
  readonly reussi: boolean
  readonly pointsFaibles: readonly PointFaible[]
  /** Mots à remettre en file de révision. */
  readonly motsRates: readonly string[]
}

function pourcentage(justes: number, posees: number): number {
  if (posees === 0) return 0
  return Math.round((100 * justes) / posees)
}

/**
 * Les mots d'un item raté qui méritent d'être remis en file.
 *
 * Un passage de lecture raté ne désigne aucun mot en particulier : y verser
 * tout son vocabulaire noierait les vraies erreurs sous des dizaines de mots
 * que l'élève connaît peut-être déjà.
 */
function motsEnJeu(item: Item): readonly string[] {
  return item.partie === 'lecture-passage' ? [] : item.lexemeIds
}

export function corriger(
  examen: Examen,
  reponses: Reponses,
  termineA: string,
): Resultat {
  const parties: ScorePartie[] = []
  const parSection = new Map<Section, { posees: number; justes: number }>(
    SECTIONS.map((section) => [section, { posees: 0, justes: 0 }]),
  )
  const pointsPoses = new Map<string, number>()
  const pointsRates = new Map<string, number>()
  const motsRates = new Set<string>()

  let posees = 0
  let justes = 0
  let sansReponse = 0

  for (const partie of examen.parties) {
    const definition = definitionDe(partie.id)
    let bonnes = 0

    for (const item of partie.items) {
      const donnee = reponses[item.id] ?? null
      const juste = donnee === item.bonne
      if (donnee === null) sansReponse += 1
      if (juste) bonnes += 1

      if (item.pointId !== null) {
        pointsPoses.set(item.pointId, (pointsPoses.get(item.pointId) ?? 0) + 1)
        if (!juste) {
          pointsRates.set(item.pointId, (pointsRates.get(item.pointId) ?? 0) + 1)
        }
      }
      if (!juste) {
        for (const lexemeId of motsEnJeu(item)) motsRates.add(lexemeId)
      }
    }

    parties.push({
      id: partie.id,
      posees: partie.items.length,
      justes: bonnes,
      manquants: partie.manquants,
    })

    const section = parSection.get(definition.section)
    if (section !== undefined) {
      section.posees += partie.items.length
      section.justes += bonnes
    }
    posees += partie.items.length
    justes += bonnes
  }

  const sections = SECTIONS.map((section): ScoreSection => {
    const compte = parSection.get(section) ?? { posees: 0, justes: 0 }
    return {
      section,
      posees: compte.posees,
      justes: compte.justes,
      pourcentage: pourcentage(compte.justes, compte.posees),
    }
  })

  const pointsFaibles = [...pointsRates.entries()]
    .map(([pointId, rates]): PointFaible => ({
      pointId,
      rates,
      poses: pointsPoses.get(pointId) ?? rates,
    }))
    .sort((a, b) => b.rates - a.rates || a.pointId.localeCompare(b.pointId))

  const global = pourcentage(justes, posees)

  return {
    examenId: examen.id,
    seed: examen.seed,
    level: examen.level,
    longueur: examen.longueur,
    termineA,
    parties,
    sections,
    posees,
    justes,
    sansReponse,
    pourcentage: global,
    // Un examen sans aucun item n'est pas réussi : il n'a pas eu lieu.
    reussi: posees > 0 && global >= SEUIL_REUSSITE_PCT,
    pointsFaibles,
    motsRates: [...motsRates],
  }
}

export const APPRECIATIONS: readonly { readonly min: number; readonly texte: string }[] = [
  { min: 90, texte: 'Le niveau est acquis sur ce qui a été testé.' },
  { min: 75, texte: 'Solide. Les erreurs restantes sont ciblées.' },
  { min: 60, texte: 'Au-dessus du seuil, mais sans marge.' },
  { min: 40, texte: 'Les bases tiennent, la régularité manque.' },
  { min: 0, texte: 'Trop tôt pour cet examen. Reprends les révisions.' },
]

export function appreciation(pct: number): string {
  return (
    APPRECIATIONS.find((palier) => pct >= palier.min)?.texte ??
    'Résultat impossible à interpréter.'
  )
}
