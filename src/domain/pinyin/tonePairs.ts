import { splitNumbered, tonePattern } from './pinyin'
import type { Tone } from './toneMarks'

/**
 * Les vingt combinaisons de tons sur deux syllabes.
 *
 * C'est l'exercice que le cahier des charges place juste après
 * l'identification d'un ton isolé, et il est bien plus difficile : entendre un
 * troisième ton seul est faisable après quelques jours, l'entendre entre un
 * deuxième et un quatrième demande des mois. La première syllabe porte un ton
 * plein (1 à 4), la seconde peut aussi être neutre — d'où vingt paires et non
 * seize.
 */

export const FULL_TONES: readonly Tone[] = [1, 2, 3, 4]
export const SECOND_TONES: readonly Tone[] = [1, 2, 3, 4, 5]

export const TONE_PAIRS: readonly (readonly [Tone, Tone])[] = FULL_TONES.flatMap(
  (first) => SECOND_TONES.map((second) => [first, second] as const),
)

export function pairKey(first: Tone, second: Tone): string {
  return `${String(first)}-${String(second)}`
}

export function pairLabel(first: Tone, second: Tone): string {
  const name = (tone: Tone): string => (tone === 5 ? 'neutre' : String(tone))
  return `${name(first)} · ${name(second)}`
}

/** Ce dont l'exercice a besoin d'un mot ; `Lexeme` le satisfait. */
export interface PairCandidate {
  readonly id: string
  readonly pinyinNum: string
}

/**
 * Range les mots de deux syllabes par combinaison de tons.
 *
 * Les exemples viennent ainsi du vocabulaire que l'utilisateur apprend
 * réellement, au lieu d'une liste de mots inventés pour l'exercice : entendre
 * la paire 2-4 sur 学校 vaut mieux que sur une syllabe abstraite.
 */
export function groupByTonePair<T extends PairCandidate>(
  items: readonly T[],
): Map<string, T[]> {
  const groups = new Map<string, T[]>()

  for (const item of items) {
    if (splitNumbered(item.pinyinNum).length !== 2) continue

    const key = tonePattern(item.pinyinNum)
    if (!TONE_PAIRS.some(([a, b]) => pairKey(a, b) === key)) continue

    const group = groups.get(key)
    if (group === undefined) groups.set(key, [item])
    else group.push(item)
  }

  return groups
}

/**
 * Combinaisons voisines : celles qui ne diffèrent que d'un ton.
 *
 * Ce sont les seules propositions intéressantes dans un exercice à choix. Face
 * à `2-4`, proposer `2-3` oblige à écouter la seconde syllabe ; proposer `1-1`
 * se devine sans rien entendre.
 */
export function nearbyPairs(key: string): string[] {
  const [first, second] = key.split('-').map(Number)
  if (first === undefined || second === undefined) return []

  return TONE_PAIRS.map(([a, b]) => pairKey(a, b)).filter((candidate) => {
    if (candidate === key) return false
    const [a, b] = candidate.split('-').map(Number)
    return (a === first) !== (b === second)
  })
}

/** Les combinaisons pour lesquelles le vocabulaire fournit un exemple. */
export function availablePairs(groups: ReadonlyMap<string, unknown[]>): string[] {
  return TONE_PAIRS.map(([a, b]) => pairKey(a, b)).filter((key) => {
    const group = groups.get(key)
    return group !== undefined && group.length > 0
  })
}
