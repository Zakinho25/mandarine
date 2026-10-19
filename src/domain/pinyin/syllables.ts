import { normalizeUmlaut, toneOf } from './pinyin'
import type { Tone } from './toneMarks'

/**
 * Décomposition d'une syllabe en initiale et finale.
 *
 * Analyse retenue : `y` et `w` ne sont **pas** des initiales, ce sont les
 * graphies de l'attaque `i`/`u`/`ü` quand la syllabe n'a pas de consonne
 * initiale. Donc `wo` s'analyse en initiale vide + finale `uo`, exactement
 * comme `duo` s'analyse en `d` + `uo`.
 *
 * C'est le découpage dont on a besoin pour générer de bons distracteurs :
 * proposer `duǒ` face à `wǒ` est un piège utile, parce que les deux partagent
 * réellement la même finale. Un découpage orthographique naïf
 * (initiale `w` + finale `o`) ne verrait pas cette parenté.
 */
export interface ParsedSyllable {
  readonly initial: string
  readonly final: string
  readonly tone: Tone
  /** Syllabe en -r (érhua) : `zher` = `zh` + `e` + suffixe `r`. */
  readonly erhua: boolean
}

/** Initiales du mandarin, les digrammes d'abord pour l'appariement glouton. */
export const INITIALS = [
  'zh',
  'ch',
  'sh',
  'b',
  'p',
  'm',
  'f',
  'd',
  't',
  'n',
  'l',
  'g',
  'k',
  'h',
  'j',
  'q',
  'x',
  'r',
  'z',
  'c',
  's',
] as const

/** Finales canoniques. */
export const FINALS = [
  'a',
  'o',
  'e',
  'ai',
  'ei',
  'ao',
  'ou',
  'an',
  'en',
  'ang',
  'eng',
  'ong',
  'er',
  'i',
  'ia',
  'ie',
  'iao',
  'iu',
  'ian',
  'in',
  'iang',
  'ing',
  'iong',
  'u',
  'ua',
  'uo',
  'uai',
  'ui',
  'uan',
  'un',
  'uang',
  'ueng',
  'ü',
  'üe',
  'üan',
  'ün',
] as const

const FINAL_SET: ReadonlySet<string> = new Set(FINALS)

/**
 * Graphies en `y`/`w` vers la finale canonique correspondante.
 * `you` s'écrit ainsi mais vaut la finale `iu`, `wei` vaut `ui`, etc.
 */
const GLIDE_SPELLINGS: Readonly<Record<string, string>> = {
  yi: 'i',
  ya: 'ia',
  ye: 'ie',
  yao: 'iao',
  you: 'iu',
  yan: 'ian',
  yin: 'in',
  yang: 'iang',
  ying: 'ing',
  yong: 'iong',
  yu: 'ü',
  yue: 'üe',
  yuan: 'üan',
  yun: 'ün',
  wu: 'u',
  wa: 'ua',
  wo: 'uo',
  wai: 'uai',
  wei: 'ui',
  wan: 'uan',
  wen: 'un',
  wang: 'uang',
  weng: 'ueng',
}

/**
 * Interjections et syllabes nasales autonomes, acceptées telles quelles.
 * Elles ne respectent pas le schéma initiale + finale.
 */
const STANDALONE: ReadonlySet<string> = new Set(['m', 'n', 'ng', 'hm', 'hng', 'ê'])

function longestInitial(syllable: string): string {
  for (const initial of INITIALS) {
    if (syllable.startsWith(initial)) return initial
  }
  return ''
}

/**
 * Décompose une syllabe, numérotée ou nue. Renvoie `undefined` si la structure
 * n'est pas reconnue.
 *
 * Applique au passage la règle orthographique du `ü` : après `j`, `q`, `x` et
 * `y`, un `u` écrit note toujours `ü`. C'est le piège de pinyin qui fait écrire
 * « jun » et prononcer « jün ».
 */
export function parseSyllable(input: string): ParsedSyllable | undefined {
  const tone = toneOf(input)
  const nude = normalizeUmlaut(input).replace(/[1-5]/g, '').toLowerCase()
  if (nude.length === 0) return undefined

  if (STANDALONE.has(nude)) {
    return { initial: '', final: nude, tone, erhua: false }
  }

  const glide = GLIDE_SPELLINGS[nude]
  if (glide !== undefined) {
    return { initial: '', final: glide, tone, erhua: false }
  }

  const initial = longestInitial(nude)
  let rest = nude.slice(initial.length)

  // Après j, q, x : le u écrit note ü. Le test sur la longueur est nécessaire :
  // `'jqx'.includes('')` vaut `true`, ce qui transformerait aussi les syllabes
  // sans initiale.
  if (initial.length === 1 && 'jqx'.includes(initial) && rest.startsWith('u')) {
    rest = 'ü' + rest.slice(1)
  }

  if (FINAL_SET.has(rest)) {
    return { initial, final: rest, tone, erhua: false }
  }

  // Érhua : la finale est suivie d'un r suffixé.
  if (rest.endsWith('r')) {
    const withoutR = rest.slice(0, -1)
    if (FINAL_SET.has(withoutR)) {
      return { initial, final: withoutR, tone, erhua: true }
    }
  }

  return undefined
}

/**
 * Vérification **structurelle** : l'initiale et la finale existent toutes deux.
 *
 * Ce n'est pas une vérification d'existence réelle : `zhü` passe ici alors que
 * cette syllabe n'existe pas en mandarin. La liste exacte des quelque 400
 * syllabes réelles arrivera avec les données du jalon 2 ; en attendant, cette
 * fonction sert à rejeter les saisies manifestement impossibles, pas à valider
 * du contenu pédagogique.
 */
export function isStructurallyValidSyllable(input: string): boolean {
  return parseSyllable(input) !== undefined
}
