import {
  isMarkedVowel,
  markedVowel,
  MARKED_VOWEL_CHARS,
  unmarkVowel,
  type BaseVowel,
  type Tone,
} from './toneMarks'

/** Erreur levée quand une entrée ne peut pas être convertie sans deviner. */
export class PinyinError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PinyinError'
  }
}

const LETTERS = 'a-zA-ZüÜ'

/** Syllabe numérotée : des lettres nues suivies du chiffre de ton. */
const SYLLABLE_RE = new RegExp(`([${LETTERS}]+)([1-5])`, 'g')

/**
 * Suite de lettres dans du pinyin **accentué**. Les voyelles à diacritique
 * doivent y figurer explicitement : sans elles, `hǎo` serait vu comme deux
 * suites « h » et « o » séparées par un caractère inconnu, et la conversion
 * inverse produirait `h5ǎo5`.
 */
const LETTER_RUN_RE = new RegExp(`[${LETTERS}${MARKED_VOWEL_CHARS}]+`, 'g')

/**
 * Normalise les trois écritures de `ü` : `v`, `u:` et `ü` lui-même.
 *
 * Les claviers français n'ont ni `ü` commode ni `u:`, et les sources de données
 * utilisent les trois : on accepte tout en entrée, on stocke `ü`. Le `v`
 * n'existant pas en pinyin, la substitution est sans ambiguïté.
 */
export function normalizeUmlaut(input: string): string {
  return input
    .replace(/u:/g, 'ü')
    .replace(/U:/g, 'Ü')
    .replace(/v/g, 'ü')
    .replace(/V/g, 'Ü')
}

/**
 * Position de la voyelle qui porte le diacritique, selon la règle officielle :
 *
 *  1. s'il y a un `a` ou un `e`, c'est lui ;
 *  2. sinon, dans `ou`, c'est le `o` ;
 *  3. sinon, c'est la dernière voyelle.
 *
 * Renvoie -1 si la syllabe ne contient aucune voyelle.
 */
export function toneMarkIndex(syllable: string): number {
  const lower = normalizeUmlaut(syllable).toLowerCase()

  const a = lower.indexOf('a')
  if (a >= 0) return a
  const e = lower.indexOf('e')
  if (e >= 0) return e
  const ou = lower.indexOf('ou')
  if (ou >= 0) return ou

  for (let i = lower.length - 1; i >= 0; i -= 1) {
    if ('iouü'.includes(lower.charAt(i))) return i
  }
  return -1
}

/** Pose le diacritique du ton sur une syllabe nue : (`hao`, 3) donne `hǎo`. */
export function applyToneMark(syllable: string, tone: Tone): string {
  const normalized = normalizeUmlaut(syllable)
  if (tone === 5) return normalized

  const index = toneMarkIndex(normalized)
  if (index < 0) return normalized

  const character = normalized.charAt(index)
  const upper =
    character === character.toUpperCase() && character !== character.toLowerCase()
  const vowel = character.toLowerCase() as BaseVowel

  return (
    normalized.slice(0, index) +
    markedVowel(vowel, tone, upper) +
    normalized.slice(index + 1)
  )
}

/**
 * Pinyin numéroté vers pinyin à diacritiques. Opère sur une chaîne entière :
 * ponctuation, espaces, apostrophes et majuscules sont préservés.
 *
 *   `ni3 hao3`  donne  `nǐ hǎo`
 *   `Bei3jing1` donne  `Běijīng`
 *   `xi1'an1`   donne  `xī'ān`
 */
export function toDiacritics(numbered: string): string {
  return normalizeUmlaut(numbered).replace(
    SYLLABLE_RE,
    (_match, letters: string, digit: string) =>
      applyToneMark(letters, Number(digit) as Tone),
  )
}

/** Une syllabe à diacritiques vers sa forme numérotée : `hǎo` donne `hao3`. */
export function syllableToNumbered(marked: string): string {
  const normalized = normalizeUmlaut(marked)
  let tone: Tone = 5
  let base = ''

  for (const character of normalized) {
    const unmarked = unmarkVowel(character)
    if (unmarked === undefined) {
      base += character
      continue
    }
    tone = unmarked.tone
    base += unmarked.upper ? unmarked.vowel.toUpperCase() : unmarked.vowel
  }

  return base + String(tone)
}

/**
 * Pinyin à diacritiques vers pinyin numéroté.
 *
 * Limite assumée : une suite de lettres portant plusieurs diacritiques
 * (`nǐhǎo`) est ambiguë à découper, puisqu'une syllabe au ton neutre ne porte
 * aucune marque qui signalerait sa frontière. Plutôt que de deviner, on lève
 * une erreur et on exige des syllabes séparées. La forme numérotée étant la
 * forme canonique de stockage, ce sens de conversion ne sert qu'à l'import de
 * données — où échouer bruyamment vaut mieux que produire du faux.
 */
export function toNumbered(marked: string): string {
  return normalizeUmlaut(marked).replace(LETTER_RUN_RE, (run: string) => {
    const marks = [...run].filter(isMarkedVowel).length
    if (marks > 1) {
      throw new PinyinError(
        `"${run}" contient ${marks} diacritiques : sépare les syllabes par une` +
          ' espace, un tiret ou une apostrophe.',
      )
    }
    return syllableToNumbered(run)
  })
}

/** Découpe du pinyin numéroté en syllabes : `ni3hao3` donne `['ni3', 'hao3']`. */
export function splitNumbered(numbered: string): string[] {
  return [...normalizeUmlaut(numbered).matchAll(SYLLABLE_RE)].map((match) => match[0])
}

/** Ton d'une syllabe numérotée ; ton neutre si aucun chiffre n'est présent. */
export function toneOf(numberedSyllable: string): Tone {
  const digit = numberedSyllable.match(/[1-5]/)
  return digit === null ? 5 : (Number(digit[0]) as Tone)
}

/** Fragment de pinyin prêt à afficher : du texte, et son ton s'il en a un. */
export interface PinyinToken {
  readonly text: string
  /** `undefined` pour les espaces, apostrophes et ponctuation. */
  readonly tone: Tone | undefined
}

/**
 * Découpe du pinyin numéroté en fragments affichables, séparateurs compris.
 *
 *   `ni3 hao3` donne `[{nǐ, 3}, { , -}, {hǎo, 3}]`
 *
 * C'est cette fonction qui permet de colorer chaque syllabe selon son ton sans
 * perdre les espaces ni la ponctuation. Elle est ici, dans le domaine, parce
 * que la lecture graduée en aura besoin autant que les fiches de vocabulaire.
 */
export function annotate(numbered: string): PinyinToken[] {
  const source = normalizeUmlaut(numbered)
  const tokens: PinyinToken[] = []
  const regex = new RegExp(SYLLABLE_RE.source, 'g')
  let cursor = 0

  for (;;) {
    const match = regex.exec(source)
    if (match === null) break

    if (match.index > cursor) {
      tokens.push({ text: source.slice(cursor, match.index), tone: undefined })
    }
    const letters = match[1] ?? ''
    const tone = Number(match[2]) as Tone
    tokens.push({ text: applyToneMark(letters, tone), tone })
    cursor = match.index + match[0].length
  }

  if (cursor < source.length) {
    tokens.push({ text: source.slice(cursor), tone: undefined })
  }
  return tokens
}

/** Retire toute marque de ton, chiffre comme diacritique : `hǎo` et `hao3` donnent `hao`. */
export function stripTone(input: string): string {
  let out = ''
  for (const character of normalizeUmlaut(input)) {
    if (character >= '1' && character <= '5') continue
    const unmarked = unmarkVowel(character)
    if (unmarked === undefined) {
      out += character
      continue
    }
    out += unmarked.upper ? unmarked.vowel.toUpperCase() : unmarked.vowel
  }
  return out
}
