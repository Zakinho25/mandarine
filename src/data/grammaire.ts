import type { ContentStatus } from './content'
import type { TexteToken } from './textes'

/**
 * Accès aux fiches de grammaire et au travail accompli dessus.
 *
 * Comme les textes et les dialogues, les exemples arrivent déjà découpés :
 * l'application lit des jetons et ne segmente rien. Le découpage a été fait
 * à la génération, avec le vocabulaire exact du niveau.
 */

export interface GrammaireExemple {
  readonly fr: string
  readonly tokens: readonly TexteToken[]
}

export interface GrammaireMorceau {
  readonly text: string
  readonly tokens: readonly TexteToken[]
}

export interface GrammaireOrdre {
  readonly morceaux: readonly GrammaireMorceau[]
  readonly fr: string
  /** Phrases acceptées, la première étant l'ordre canonique. */
  readonly acceptes: readonly string[]
  readonly tokens: readonly TexteToken[]
}

export interface PointGrammaire {
  readonly id: string
  readonly level: number
  readonly categorie: string
  readonly titre: string
  readonly markers: readonly string[]
  readonly resume: string
  readonly explication: readonly string[]
  readonly piege: string
  readonly exemples: readonly GrammaireExemple[]
  readonly ordre: GrammaireOrdre
}

export interface PointResume {
  readonly id: string
  readonly level: number
  readonly categorie: string
  readonly titre: string
  readonly markers: readonly string[]
  readonly resume: string
}

export interface NiveauGrammaire {
  readonly format: 'mandarine-grammaire-niveau'
  readonly version: number
  readonly level: number
  readonly contentStatus: ContentStatus
  readonly count: number
  readonly points: readonly PointGrammaire[]
}

export interface GrammaireIndex {
  readonly format: 'mandarine-grammaire'
  readonly version: number
  readonly count: number
  readonly contentStatus: ContentStatus
  readonly points: readonly PointResume[]
}

async function fetchJson(path: string, expectedFormat: string): Promise<unknown> {
  const response = await fetch(`${import.meta.env.BASE_URL}content/grammaire/${path}`)
  if (!response.ok) {
    throw new Error(`Fiche introuvable (${String(response.status)}) : ${path}.`)
  }
  const parsed: unknown = await response.json()
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    (parsed as { format?: unknown }).format !== expectedFormat
  ) {
    throw new Error(`Le fichier ${path} n’a pas le format attendu.`)
  }
  return parsed
}

export async function loadGrammaireIndex(): Promise<GrammaireIndex> {
  return (await fetchJson('index.json', 'mandarine-grammaire')) as GrammaireIndex
}

export async function loadGrammaireNiveau(level: number): Promise<NiveauGrammaire> {
  return (await fetchJson(
    `niveau-${String(level)}.json`,
    'mandarine-grammaire-niveau',
  )) as NiveauGrammaire
}
