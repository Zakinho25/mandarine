import { parseSyllable, splitNumbered, stripTone, toneOf } from '../pinyin/index'
import { shuffle, type Random } from '../random'

/**
 * Choix des mauvaises réponses d'un exercice à choix multiple.
 *
 * Le cahier des charges est explicite : « des distracteurs proches (même ton,
 * même composant), pas des choix évidents ». Proposer 你好 face à 图书馆 ne
 * teste rien — l'élève élimine par la longueur, sans lire. Un bon distracteur
 * est celui qu'on pourrait réellement confondre : même schéma tonal, même
 * initiale, ou un caractère en commun.
 */

export interface DistractorItem {
  readonly id: string
  readonly simplified: string
  readonly pinyinNum: string
  readonly glossFr: readonly string[]
}

function normalizeGloss(gloss: string): string {
  return gloss
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Deux mots qui partagent un sens ne peuvent pas s'opposer dans un QCM :
 * la « mauvaise » réponse serait défendable. C'est une règle d'équité, pas de
 * difficulté.
 */
export function sharesMeaning(a: DistractorItem, b: DistractorItem): boolean {
  const senses = new Set(a.glossFr.map(normalizeGloss))
  return b.glossFr.some((gloss) => senses.has(normalizeGloss(gloss)))
}

/** Suite des tons d'un mot : 你好 donne `3-3`. */
export function tonePattern(pinyinNum: string): string {
  return splitNumbered(pinyinNum)
    .map((syllable) => String(toneOf(syllable)))
    .join('-')
}

/**
 * Note de proximité entre deux mots. Plus elle est haute, plus le second fait
 * un distracteur crédible pour le premier.
 */
export function similarity(target: DistractorItem, candidate: DistractorItem): number {
  if (target.id === candidate.id) return -1

  const targetSyllables = splitNumbered(target.pinyinNum)
  const candidateSyllables = splitNumbered(candidate.pinyinNum)
  let score = 0

  // Même schéma tonal : la confusion la plus fréquente, et celle qui compte
  // le plus dans une application centrée sur les tons.
  if (
    tonePattern(target.pinyinNum) === tonePattern(candidate.pinyinNum) &&
    targetSyllables.length > 0
  ) {
    score += 4
  }

  if (targetSyllables.length === candidateSyllables.length) score += 1

  // Un caractère en commun : 学习 et 学生 se confondent vraiment.
  const targetChars = new Set([...target.simplified])
  if ([...candidate.simplified].some((character) => targetChars.has(character))) {
    score += 3
  }

  const first = targetSyllables[0]
  const other = candidateSyllables[0]
  if (first !== undefined && other !== undefined) {
    if (stripTone(first) === stripTone(other)) score += 3
    else {
      const a = parseSyllable(first)
      const b = parseSyllable(other)
      if (a !== undefined && b !== undefined) {
        if (a.initial === b.initial && a.initial !== '') score += 2
        if (a.final === b.final) score += 2
      }
    }
  }

  return score
}

export interface DistractorOptions {
  /** Nombre de distracteurs souhaités. */
  readonly count: number
  /**
   * Taille du vivier dans lequel on tire. Plus il est large, plus les
   * propositions varient d'une session à l'autre ; plus il est étroit, plus
   * elles sont proches. Trois fois le nombre demandé est un bon compromis.
   */
  readonly poolFactor?: number
}

/**
 * Choisit des distracteurs parmi `pool`.
 *
 * On classe tout le vivier par proximité, on garde une tête de liste un peu
 * plus large que nécessaire, puis on tire dedans : les propositions restent
 * difficiles sans être identiques à chaque passage.
 */
export function pickDistractors(
  target: DistractorItem,
  pool: readonly DistractorItem[],
  random: Random,
  options: DistractorOptions,
): DistractorItem[] {
  const factor = options.poolFactor ?? 3

  const ranked = pool
    .filter((item) => item.id !== target.id && !sharesMeaning(target, item))
    .map((item) => ({ item, score: similarity(target, item) }))
    .sort((a, b) => b.score - a.score)

  const shortlist = ranked.slice(0, Math.max(options.count * factor, options.count))
  return shuffle(shortlist, random)
    .slice(0, options.count)
    .map((entry) => entry.item)
}
