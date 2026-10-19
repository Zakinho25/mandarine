import type { Lexeme } from '@/data/content'
import type { ToneSet } from '@/data/prononciation'
import { availablePairs, groupByTonePair, nearbyPairs } from '@/domain/pinyin'
import { shuffle, type Random } from '@/domain/random'

/**
 * Fabrication des questions d'écoute.
 *
 * Séparé de l'écran pour être testable : l'équité d'un exercice à choix tient
 * à des détails qu'on ne voit pas en le regardant tourner — la bonne réponse
 * est-elle toujours dans les propositions, les propositions sont-elles
 * distinctes, sont-elles assez proches pour qu'il faille vraiment écouter.
 */

export const ROUND_LENGTH = 10

export type Mode = 'ton' | 'paire'

export interface Question {
  readonly kind: Mode
  /** Caractères donnés à lire à la synthèse vocale. */
  readonly character: string
  readonly pinyinNum: string
  readonly gloss: string
  /** Ton attendu (`'3'`) ou combinaison attendue (`'2-4'`). */
  readonly answer: string
  readonly options: readonly string[]
}

function pick<T>(items: readonly T[], random: Random): T | undefined {
  return items[Math.floor(random() * items.length)]
}

export function buildToneQuestions(
  sets: readonly ToneSet[],
  random: Random,
  count = ROUND_LENGTH,
): Question[] {
  const questions: Question[] = []

  for (let i = 0; i < count; i += 1) {
    const set = pick(sets, random)
    const entry = set === undefined ? undefined : pick(set.entries, random)
    if (entry === undefined) continue

    questions.push({
      kind: 'ton',
      character: entry.character,
      pinyinNum: entry.pinyinNum,
      gloss: entry.gloss,
      answer: String(entry.tone),
      // Les quatre tons sont toujours proposés : le choix ne doit jamais se
      // réduire par élimination.
      options: ['1', '2', '3', '4'],
    })
  }

  return questions
}

export function buildPairQuestions(
  lexemes: readonly Lexeme[],
  random: Random,
  count = ROUND_LENGTH,
): Question[] {
  const groups = groupByTonePair(lexemes)
  const keys = availablePairs(groups)
  const questions: Question[] = []

  for (let i = 0; i < count; i += 1) {
    const key = pick(keys, random)
    const word = key === undefined ? undefined : pick(groups.get(key) ?? [], random)
    if (key === undefined || word === undefined) continue

    // Les propositions ne diffèrent de la bonne réponse que d'un ton : il faut
    // écouter les deux syllabes pour trancher, pas une seule.
    const neighbours = shuffle(
      nearbyPairs(key).filter((candidate) => keys.includes(candidate)),
      random,
    ).slice(0, 3)

    questions.push({
      kind: 'paire',
      character: word.simplified,
      pinyinNum: word.pinyinNum,
      gloss: word.glossFr.slice(0, 2).join(', '),
      answer: key,
      options: shuffle([key, ...neighbours], random),
    })
  }

  return questions
}
