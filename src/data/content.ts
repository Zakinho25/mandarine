/**
 * Accès au contenu pédagogique.
 *
 * Le contenu est du JSON statique servi à côté de l'application, mis en cache
 * par le service worker. Il est volontairement séparé des données de
 * progression : une mise à jour du contenu ne doit jamais toucher à ce que
 * l'utilisateur a appris.
 */

/** Niveau de confiance d'un élément de contenu. Toujours affiché à l'utilisateur. */
export type ContentStatus = 'demo' | 'draft_ai' | 'auto_checked' | 'reviewed_human'

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  demo: 'démonstration',
  draft_ai: 'brouillon',
  auto_checked: 'vérifié automatiquement',
  reviewed_human: 'relu',
}

export interface Lexeme {
  readonly id: string
  readonly simplified: string
  /** Forme canonique numérotée, par exemple `ni3 hao3`. */
  readonly pinyinNum: string
  readonly glossFr: string
  readonly hsk3Level: number
  readonly contentStatus: ContentStatus
}

export interface ContentFile {
  readonly format: 'mandarine-contenu'
  readonly version: number
  readonly contentStatus: ContentStatus
  readonly note?: string
  readonly lexemes: readonly Lexeme[]
}

export class ContentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ContentError'
  }
}

/**
 * Charge un fichier de contenu.
 *
 * `BASE_URL` est injecté par Vite : l'application fonctionne donc aussi bien à
 * la racine en développement que dans un sous-dossier sur GitHub Pages.
 */
export async function loadContentFile(name: string): Promise<ContentFile> {
  const url = `${import.meta.env.BASE_URL}content/${name}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new ContentError(
      `Contenu introuvable (${String(response.status)}) : ${name}.`,
    )
  }

  const parsed: unknown = await response.json()
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    (parsed as { format?: unknown }).format !== 'mandarine-contenu'
  ) {
    throw new ContentError(`Le fichier ${name} n’est pas un contenu Mandarine.`)
  }
  return parsed as ContentFile
}
