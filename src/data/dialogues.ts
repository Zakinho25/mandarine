import type { ContentStatus } from './content'
import type { TexteToken } from './textes'

/**
 * Accès aux dialogues guidés.
 *
 * Comme les textes de lecture, ils arrivent déjà découpés : l'application lit
 * une liste de jetons et ne segmente rien.
 */

export type Qualite = 'juste' | 'maladroit' | 'inadapte'

export interface Replique {
  readonly fr: string
  readonly qualite: Qualite
  /** Commentaire du bilan, `null` quand la réponse ne pose pas de problème. */
  readonly note: string | null
  readonly next: string | null
  readonly tokens: readonly TexteToken[]
}

export interface NoeudDialogue {
  readonly id: string
  readonly fr: string
  readonly tokens: readonly TexteToken[]
  readonly repliques: readonly Replique[]
}

export interface Dialogue {
  readonly format: 'mandarine-dialogue'
  readonly version: number
  readonly id: string
  readonly level: number
  readonly titleZh: string
  readonly titleFr: string
  readonly role: string
  readonly situation: string
  readonly unit: string
  readonly contentStatus: ContentStatus
  readonly start: string
  readonly nodes: readonly NoeudDialogue[]
}

export interface DialogueSummary {
  readonly id: string
  readonly level: number
  readonly titleZh: string
  readonly titleFr: string
  readonly role: string
  readonly situation: string
  readonly unit: string
  readonly turns: number
}

export interface DialoguesIndex {
  readonly format: 'mandarine-dialogues'
  readonly version: number
  readonly count: number
  readonly dialogues: readonly DialogueSummary[]
}

export const QUALITE_LABELS: Record<Qualite, string> = {
  juste: 'Juste',
  maladroit: 'Maladroit',
  inadapte: 'Hors de propos',
}

async function fetchJson(path: string, expectedFormat: string): Promise<unknown> {
  const response = await fetch(`${import.meta.env.BASE_URL}content/dialogues/${path}`)
  if (!response.ok) {
    throw new Error(`Dialogue introuvable (${String(response.status)}) : ${path}.`)
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

export async function loadDialoguesIndex(): Promise<DialoguesIndex> {
  return (await fetchJson('index.json', 'mandarine-dialogues')) as DialoguesIndex
}

export async function loadDialogue(id: string): Promise<Dialogue> {
  return (await fetchJson(`${id}.json`, 'mandarine-dialogue')) as Dialogue
}

export function tokensToText(tokens: readonly TexteToken[]): string {
  return tokens.map((token) => token.text).join('')
}
