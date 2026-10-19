import { COMPONENT_GLOSSES, type ComponentGloss } from './composants'

/**
 * Accès aux données de caractères.
 *
 * L'index est léger et préchargé ; les tracés d'un caractère sont chargés à la
 * première consultation et mis en cache par le service worker. Précharger les
 * 655 fichiers ferait grossir l'installation de trois mégaoctets pour des
 * caractères qu'on ne regardera peut-être jamais.
 */

export interface HanziEntry {
  readonly character: string
  readonly strokeCount: number
  readonly radical: string | null
  /** Expression IDS, par exemple `⿰女子`. */
  readonly decomposition: string | null
  readonly parts: readonly string[]
  /** `pictogramme`, `idéogramme` ou `idéophonogramme`. */
  readonly origin: string | null
  /** Partie qui porte le sens, pour un idéophonogramme. */
  readonly semantic: string | null
  /** Partie qui donne le son, pour un idéophonogramme. */
  readonly phonetic: string | null
  readonly hasStrokes: boolean
}

export interface HanziIndexFile {
  readonly format: 'mandarine-hanzi'
  readonly version: number
  readonly count: number
  readonly attribution: {
    readonly source: string
    readonly by: string
    readonly licence: string
    readonly url: string
  }
  readonly characters: readonly HanziEntry[]
}

/** Format attendu par hanzi-writer. */
export interface StrokeData {
  readonly strokes: string[]
  readonly medians: number[][][]
}

function fileName(character: string): string {
  return `u${(character.codePointAt(0) ?? 0).toString(16)}`
}

let indexCache: Promise<Map<string, HanziEntry>> | undefined

export function loadHanziIndex(): Promise<Map<string, HanziEntry>> {
  indexCache ??= (async () => {
    const response = await fetch(`${import.meta.env.BASE_URL}content/hanzi/index.json`)
    if (!response.ok) throw new Error('Index des caractères introuvable.')
    const file = (await response.json()) as HanziIndexFile
    return new Map(file.characters.map((entry) => [entry.character, entry]))
  })()
  return indexCache
}

export async function loadStrokes(character: string): Promise<StrokeData> {
  const response = await fetch(
    `${import.meta.env.BASE_URL}content/hanzi/${fileName(character)}.json`,
  )
  if (!response.ok) {
    throw new Error(`Tracés indisponibles pour ${character}.`)
  }
  return (await response.json()) as StrokeData
}

export interface ResolvedComponent {
  readonly character: string
  readonly meaning: string | null
  readonly note: string | null
  /** D'où vient le sens affiché. */
  readonly source: 'composant' | 'vocabulaire' | null
}

/**
 * Trouve le sens français d'un composant.
 *
 * Deux sources, dans cet ordre : la table rédigée des composants, puis le
 * vocabulaire lui-même quand le composant est un mot à part entière. 女 vient
 * de la table, 不 vient du lexique. Quand aucune des deux ne sait, on
 * l'assume : afficher un caractère nu vaut mieux qu'inventer un sens.
 */
export function resolveComponent(
  character: string,
  wordMeaning: (character: string) => string | undefined,
  glosses: Readonly<Record<string, ComponentGloss>> = COMPONENT_GLOSSES,
): ResolvedComponent {
  const gloss = glosses[character]
  if (gloss !== undefined) {
    return {
      character,
      meaning: gloss.meaning,
      note: gloss.note ?? null,
      source: 'composant',
    }
  }

  const word = wordMeaning(character)
  if (word !== undefined && word.length > 0) {
    return { character, meaning: word, note: null, source: 'vocabulaire' }
  }

  return { character, meaning: null, note: null, source: null }
}
