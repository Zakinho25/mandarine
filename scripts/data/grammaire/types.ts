/**
 * Forme des fiches de grammaire telles qu'elles sont rédigées à la main.
 *
 * Le découpage des exemples et la vérification du vocabulaire sont faits par
 * `08-grammaire.ts`, jamais ici : la source reste lisible et modifiable sans
 * connaître le format de sortie.
 */

export type Categorie =
  | 'phrase'
  | 'aspect'
  | 'negation'
  | 'question'
  | 'determination'
  | 'mesure'
  | 'comparaison'
  | 'complement'
  | 'connecteur'
  | 'modal'

export const CATEGORIE_TITRES: Record<Categorie, string> = {
  phrase: 'Construire la phrase',
  aspect: 'Situer l’action dans le temps',
  negation: 'Nier',
  question: 'Questionner',
  determination: 'Préciser un nom',
  mesure: 'Compter et mesurer',
  comparaison: 'Comparer',
  complement: 'Compléter le verbe',
  connecteur: 'Relier deux idées',
  modal: 'Vouloir, pouvoir, devoir',
}

export interface ExempleSource {
  readonly zh: string
  readonly fr: string
}

export interface PointSource {
  readonly id: string
  readonly level: 1 | 2 | 3
  readonly categorie: Categorie
  readonly titre: string
  /** Mots-clés chinois du point, affichés en tête de fiche. */
  readonly markers: readonly string[]
  /** Une phrase : ce qu'il faut retenir si on ne lit rien d'autre. */
  readonly resume: string
  readonly explication: readonly string[]
  /** L'erreur que fait un francophone sur ce point précis. */
  readonly piege: string
  readonly exemples: readonly ExempleSource[]
  /**
   * Morceaux à remettre en ordre. Leur concaténation est la phrase attendue,
   * et chaque morceau est vérifié séparément : un découpage qui couperait un
   * mot en deux fait échouer la génération.
   */
  readonly ordre: readonly string[]
  /** Traduction de la phrase à reconstituer. */
  readonly ordreFr: string
  /** Autres ordres acceptés, comme permutations exactes de `ordre`. */
  readonly ordreAussi?: readonly (readonly string[])[]
  /** Noms propres employés dans les exemples, hors vocabulaire du niveau. */
  readonly proper?: readonly string[]
}
