/**
 * Structure d'un examen blanc.
 *
 * Elle s'inspire des épreuves officielles sans en reprendre le contenu : les
 * sujets du HSK sont protégés, et les reproduire serait à la fois illégal et
 * inutile puisque nos items sont fabriqués à partir de notre propre matière
 * vérifiée.
 *
 * Deux écarts assumés par rapport à l'épreuve réelle, affichés à
 * l'utilisateur :
 *
 *  - la première partie d'écoute officielle fait choisir une **image** ; sans
 *    illustrations, on fait choisir un sens.
 *  - la première partie de lecture officielle fait **apparier** cinq phrases
 *    d'un coup ; ici chaque phrase est posée seule avec quatre réponses
 *    possibles. La compétence testée est la même, la présentation non.
 *
 * L'épreuve d'écriture n'est pas couverte : elle demande de tracer des
 * caractères à la main. Sa première partie, la remise en ordre d'une phrase,
 * existe en revanche dans le module de grammaire.
 */

export type Section = 'ecoute' | 'lecture'

export const SECTIONS: readonly Section[] = ['ecoute', 'lecture']

export const SECTION_TITRES: Record<Section, string> = {
  ecoute: 'Compréhension orale',
  lecture: 'Compréhension écrite',
}

export type PartieId =
  | 'ecoute-mot'
  | 'ecoute-phrase'
  | 'ecoute-echange'
  | 'lecture-reponse'
  | 'lecture-trou'
  | 'lecture-passage'

export type Longueur = 'court' | 'complet'

export const LONGUEUR_LABELS: Record<Longueur, string> = {
  court: 'Épreuve courte',
  complet: 'Épreuve complète',
}

export interface PartieDef {
  readonly id: PartieId
  readonly section: Section
  readonly titre: string
  readonly consigne: string
  /** Nombre d'items visés selon la longueur choisie. */
  readonly items: Record<Longueur, number>
  /** Budget de temps par item, qui donne la durée de la section. */
  readonly secondesParItem: number
}

export const PARTIES: readonly PartieDef[] = [
  {
    id: 'ecoute-mot',
    section: 'ecoute',
    titre: 'Écouter un mot',
    consigne: 'Écoute le mot, puis choisis son sens.',
    items: { court: 4, complet: 10 },
    secondesParItem: 20,
  },
  {
    id: 'ecoute-phrase',
    section: 'ecoute',
    titre: 'Écouter une phrase',
    consigne: 'Écoute la phrase, puis choisis ce qu’elle veut dire.',
    items: { court: 4, complet: 10 },
    secondesParItem: 30,
  },
  {
    id: 'ecoute-echange',
    section: 'ecoute',
    titre: 'Écouter et répondre',
    consigne: 'Écoute ce qu’on te dit, puis choisis la réponse qui convient.',
    items: { court: 4, complet: 10 },
    secondesParItem: 35,
  },
  {
    id: 'lecture-reponse',
    section: 'lecture',
    titre: 'Trouver la réponse',
    consigne: 'Lis la phrase, puis choisis la réponse qui lui convient.',
    items: { court: 4, complet: 10 },
    secondesParItem: 30,
  },
  {
    id: 'lecture-trou',
    section: 'lecture',
    titre: 'Compléter la phrase',
    consigne: 'Choisis le mot qui manque.',
    items: { court: 4, complet: 10 },
    secondesParItem: 35,
  },
  {
    id: 'lecture-passage',
    section: 'lecture',
    titre: 'Lire un passage',
    consigne: 'Lis le passage, puis choisis ce qu’il dit.',
    items: { court: 4, complet: 10 },
    secondesParItem: 60,
  },
]

export function partiesDe(section: Section): readonly PartieDef[] {
  return PARTIES.filter((partie) => partie.section === section)
}

export function definitionDe(id: PartieId): PartieDef {
  const partie = PARTIES.find((candidate) => candidate.id === id)
  // Le type `PartieId` garantit l'existence ; le repli protège d'une
  // désérialisation d'un examen enregistré par une version plus ancienne.
  if (partie === undefined) throw new Error(`Partie inconnue : ${id}`)
  return partie
}

/** Durée allouée à une section, en secondes. */
export function dureeSection(section: Section, longueur: Longueur): number {
  return partiesDe(section).reduce(
    (total, partie) => total + partie.items[longueur] * partie.secondesParItem,
    0,
  )
}

/**
 * Barème officiel, pour référence.
 *
 * Ces chiffres décrivent la structure publiée de l'examen HSK 3 : 40 items
 * d'écoute, 30 de lecture, 10 d'écriture, 100 points par section et 180 sur
 * 300 pour être reçu. Le syllabus HSK 3.0 de novembre 2025 n'a pas publié de
 * nouvelle répartition des items au moment où ceci est écrit, et les pages
 * officielles de niveau décrivent encore cette structure.
 *
 * Notre score n'est donc **pas** une note officielle : c'est un pourcentage de
 * bonnes réponses sur un examen que nous avons fabriqué. Seul le seuil est
 * emprunté, parce que 60 % reste un repère utile.
 */
export const SEUIL_REUSSITE_PCT = 60

export const REFERENCE_OFFICIELLE = {
  itemsEcoute: 40,
  itemsLecture: 30,
  itemsEcriture: 10,
  pointsParSection: 100,
  total: 300,
  seuil: 180,
} as const
