/**
 * Tables des voyelles accentuées du pinyin.
 *
 * Forme canonique retenue dans tout le projet : le pinyin **numéroté**
 * (`hao3`). Les diacritiques (`hǎo`) sont dérivés à l'affichage par une
 * fonction pure. Cela évite tout problème de normalisation Unicode dans les
 * données, rend la recherche triviale, et donne les deux formes demandées
 * par le cahier des charges sans les stocker deux fois.
 */

/** 1 à 4 = tons marqués, 5 = ton neutre (sans diacritique). */
export type Tone = 1 | 2 | 3 | 4 | 5

export const NEUTRAL_TONE = 5 satisfies Tone

export const BASE_VOWELS = ['a', 'e', 'i', 'o', 'u', 'ü'] as const
export type BaseVowel = (typeof BASE_VOWELS)[number]

type MarkRow = readonly [string, string, string, string, string]

/** Voyelle de base vers ses formes aux tons 1, 2, 3, 4, puis neutre. */
const MARKED_LOWER: Record<BaseVowel, MarkRow> = {
  a: ['ā', 'á', 'ǎ', 'à', 'a'],
  e: ['ē', 'é', 'ě', 'è', 'e'],
  i: ['ī', 'í', 'ǐ', 'ì', 'i'],
  o: ['ō', 'ó', 'ǒ', 'ò', 'o'],
  u: ['ū', 'ú', 'ǔ', 'ù', 'u'],
  ü: ['ǖ', 'ǘ', 'ǚ', 'ǜ', 'ü'],
}

const MARKED_UPPER: Record<BaseVowel, MarkRow> = {
  a: ['Ā', 'Á', 'Ǎ', 'À', 'A'],
  e: ['Ē', 'É', 'Ě', 'È', 'E'],
  i: ['Ī', 'Í', 'Ǐ', 'Ì', 'I'],
  o: ['Ō', 'Ó', 'Ǒ', 'Ò', 'O'],
  u: ['Ū', 'Ú', 'Ǔ', 'Ù', 'U'],
  ü: ['Ǖ', 'Ǘ', 'Ǚ', 'Ǜ', 'Ü'],
}

/** Renvoie la voyelle accentuée correspondante, en respectant la casse. */
export function markedVowel(vowel: BaseVowel, tone: Tone, upper: boolean): string {
  const row = upper ? MARKED_UPPER[vowel] : MARKED_LOWER[vowel]
  return row[tone - 1] ?? vowel
}

export interface UnmarkedVowel {
  readonly vowel: BaseVowel
  readonly tone: Tone
  readonly upper: boolean
}

/**
 * Table inverse : caractère accentué vers voyelle de base et ton.
 *
 * Seuls les tons 1 à 4 y figurent : une voyelle sans diacritique n'est pas une
 * marque, c'est l'absence de marque — qui signifie ton neutre au niveau de la
 * syllabe, pas au niveau du caractère. Sans cette distinction, le `o` de `hǎo`
 * serait lu comme un ton neutre et écraserait le ton 3 de la syllabe.
 */
const UNMARK = new Map<string, UnmarkedVowel>()
for (const vowel of BASE_VOWELS) {
  for (const tone of [1, 2, 3, 4] as const) {
    UNMARK.set(markedVowel(vowel, tone, false), { vowel, tone, upper: false })
    UNMARK.set(markedVowel(vowel, tone, true), { vowel, tone, upper: true })
  }
}

/**
 * Tous les caractères porteurs d'un diacritique de ton, concaténés.
 *
 * Indispensable pour construire les expressions régulières qui doivent
 * reconnaître une syllabe accentuée : `[a-z]` ne contient pas `ǎ`, et sans
 * cette liste `hǎo` serait découpé en « h » et « o ».
 */
export const MARKED_VOWEL_CHARS = [...UNMARK.keys()].join('')

export function unmarkVowel(character: string): UnmarkedVowel | undefined {
  return UNMARK.get(character)
}

/** `true` si le caractère porte un diacritique de ton. */
export function isMarkedVowel(character: string): boolean {
  return UNMARK.has(character)
}
