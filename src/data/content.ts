/**
 * Accès au contenu pédagogique.
 *
 * Le contenu est du JSON statique servi à côté de l'application et mis en
 * cache par le service worker. Il est volontairement séparé des données de
 * progression : une mise à jour du contenu ne doit jamais toucher à ce que
 * l'utilisateur a appris.
 *
 * Ces fichiers sont produits par `npm run data` et vérifiés par des tests.
 * Ils ne sont jamais modifiés à la main.
 */

/** Niveau de confiance d'un élément de contenu. Toujours affiché à l'utilisateur. */
export type ContentStatus = 'demo' | 'draft_ai' | 'auto_checked' | 'reviewed_human'

export const CONTENT_STATUS_LABELS: Record<ContentStatus, string> = {
  demo: 'démonstration',
  draft_ai: 'brouillon',
  auto_checked: 'vérifié automatiquement',
  reviewed_human: 'relu',
}

export const CONTENT_STATUS_EXPLANATIONS: Record<ContentStatus, string> = {
  demo: 'Saisi à la main pour tester l’affichage. Aucune valeur pédagogique.',
  draft_ai: 'Rédigé mais pas encore vérifié.',
  auto_checked:
    'Mot et niveau issus du syllabus officiel ; définition française reprise de CFDICT. ' +
    'La conformité du vocabulaire est vérifiée par script, pas le naturel de la langue.',
  reviewed_human: 'Rédigé et relu phrase par phrase.',
}

export interface PartOfSpeech {
  readonly label: string
  /** Emploi secondaire, noté entre parenthèses dans le syllabus. */
  readonly secondary: boolean
}

export interface Lexeme {
  readonly id: string
  readonly simplified: string
  readonly traditional: string | null
  /** Forme canonique numérotée, avant sandhi tonal : `ni3 hao3`. */
  readonly pinyinNum: string
  /** Pinyin tel qu'imprimé dans le syllabus, sandhi compris. */
  readonly pinyinMark: string
  readonly pos: readonly PartOfSpeech[]
  readonly hsk2025: number
  /** Niveau dans le standard de 2021, `null` si le mot n'y figure pas. */
  readonly hsk2021: number | null
  readonly glossFr: readonly string[]
  readonly contentStatus: ContentStatus
  /** Définition rapprochée avec une tolérance : à vérifier en priorité. */
  readonly glossApprox: boolean
  /** Rang de fréquence d'usage ; plus il est bas, plus le mot est courant. */
  readonly freqRank: number | null
  /** Identifiant de l'unité thématique. */
  readonly unit: string
}

export interface UniteEntry {
  readonly id: string
  readonly title: string
  readonly goal: string
  readonly count: number
}

export interface UnitesFile {
  readonly format: 'mandarine-unites'
  readonly version: number
  readonly generatedAt: string
  readonly total: number
  readonly units: readonly UniteEntry[]
}

export interface Attribution {
  readonly what: string
  readonly source: string
  readonly by: string
  readonly licence: string
  readonly url?: string
}

export interface ContentFile {
  readonly format: 'mandarine-contenu'
  readonly version: number
  readonly generatedAt: string
  readonly level: number
  readonly examTrack: string
  readonly count: number
  readonly attribution: readonly Attribution[]
  readonly lexemes: readonly Lexeme[]
}

export interface ContentIndex {
  readonly format: 'mandarine-index'
  readonly version: number
  readonly generatedAt: string
  readonly source: {
    readonly document: string
    readonly publishedBy: string
    readonly publishedOn: string
    readonly note: string
  }
  readonly levels: readonly {
    readonly level: number
    readonly file: string
    readonly count: number
    readonly cumulative: number
  }[]
  readonly attribution: readonly Attribution[]
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
 * `BASE_URL` est injecté par Vite : l'application fonctionne aussi bien à la
 * racine en développement que dans un sous-dossier sur GitHub Pages.
 */
async function fetchJson(name: string, expectedFormat: string): Promise<unknown> {
  const response = await fetch(`${import.meta.env.BASE_URL}content/${name}`)
  if (!response.ok) {
    throw new ContentError(`Contenu introuvable (${String(response.status)}) : ${name}.`)
  }

  const parsed: unknown = await response.json()
  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    (parsed as { format?: unknown }).format !== expectedFormat
  ) {
    throw new ContentError(`Le fichier ${name} n’a pas le format attendu.`)
  }
  return parsed
}

export async function loadIndex(): Promise<ContentIndex> {
  return (await fetchJson('index.json', 'mandarine-index')) as ContentIndex
}

export async function loadUnites(): Promise<UnitesFile> {
  return (await fetchJson('unites.json', 'mandarine-unites')) as UnitesFile
}

export async function loadLevel(level: number): Promise<ContentFile> {
  return (await fetchJson(
    `hsk-${String(level)}.json`,
    'mandarine-contenu',
  )) as ContentFile
}

/**
 * Tous les mots du programme, indexés par identifiant.
 *
 * Plusieurs écrans ont besoin de remonter d'un jeton à son pinyin et à sa
 * définition. Ils chargeaient chacun l'index puis tous les niveaux ; ce
 * raccourci évite de répéter l'assemblage, et le cache du navigateur fait le
 * reste.
 */
export async function loadLexemeMap(): Promise<Map<string, Lexeme>> {
  const index = await loadIndex()
  const files = await Promise.all(
    index.levels.map(async (level) => loadLevel(level.level)),
  )
  return new Map(
    files.flatMap((file) => file.lexemes).map((lexeme) => [lexeme.id, lexeme]),
  )
}

/** Les classes grammaticales d'un mot, lisibles : « nom, verbe (secondaire) ». */
export function describeParts(parts: readonly PartOfSpeech[]): string {
  return parts
    .map((part) => (part.secondary ? `${part.label} (secondaire)` : part.label))
    .join(', ')
}
