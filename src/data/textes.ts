import type { ContentStatus } from './content'

/**
 * Accès aux textes de lecture.
 *
 * Les textes sont déjà découpés : l'application lit une liste de jetons, elle
 * ne segmente rien. Le découpage a été fait au moment de la génération, avec
 * le vocabulaire exact de l'application, ce qu'un segmenteur générique ne
 * garantirait pas.
 */

export interface TexteToken {
  readonly text: string
  /** Identifiant du mot, `null` pour la ponctuation. */
  readonly lexemeId: string | null
}

export interface TexteParagraphe {
  readonly fr: string
  readonly tokens: readonly TexteToken[]
}

export interface Texte {
  readonly format: 'mandarine-texte'
  readonly version: number
  readonly id: string
  readonly level: number
  readonly titleZh: string
  readonly titleFr: string
  readonly unit: string
  readonly contentStatus: ContentStatus
  readonly paragraphs: readonly TexteParagraphe[]
}

export interface TexteSummary {
  readonly id: string
  readonly level: number
  readonly titleZh: string
  readonly titleFr: string
  readonly unit: string
  readonly words: number
  readonly characters: number
}

export interface TextesIndex {
  readonly format: 'mandarine-textes'
  readonly version: number
  readonly count: number
  readonly textes: readonly TexteSummary[]
}

async function fetchJson(path: string, expectedFormat: string): Promise<unknown> {
  const response = await fetch(`${import.meta.env.BASE_URL}content/textes/${path}`)
  if (!response.ok) {
    throw new Error(`Texte introuvable (${String(response.status)}) : ${path}.`)
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

export async function loadTextesIndex(): Promise<TextesIndex> {
  return (await fetchJson('index.json', 'mandarine-textes')) as TextesIndex
}

export async function loadTexte(id: string): Promise<Texte> {
  return (await fetchJson(`${id}.json`, 'mandarine-texte')) as Texte
}

/** Phrases d'un paragraphe, pour faire lire le texte morceau par morceau. */
export function splitSentences(tokens: readonly TexteToken[]): string[] {
  const text = tokens.map((token) => token.text).join('')
  return text
    .split(/(?<=[。！？])/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0)
}
