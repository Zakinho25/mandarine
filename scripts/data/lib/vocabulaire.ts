import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { buildLexicon, isHanzi, segment } from '../../../src/domain/segmentation.ts'
import type { MergedLexeme } from '../03-merge.ts'
import { WORK_DIR } from '../sources.ts'

/**
 * Outillage commun aux contenus rédigés : textes de lecture et dialogues.
 *
 * Les deux ont le même besoin — découper du chinois avec notre lexique, et
 * refuser tout mot qui dépasse le niveau annoncé — et la même raison de le
 * faire au moment de la génération plutôt qu'à l'affichage.
 */

export interface OutToken {
  readonly text: string
  /** Identifiant du mot, `null` pour la ponctuation et les noms propres. */
  readonly lexemeId: string | null
}

export interface Violation {
  readonly ou: string
  readonly mot: string
}

export interface Vocabulaire {
  /** Découpe et vérifie une phrase. Les mots hors niveau sont signalés. */
  readonly checkAndSegment: (
    zh: string,
    level: number,
    proper: ReadonlySet<string>,
    ou: string,
  ) => { tokens: OutToken[]; words: number }
  readonly violations: readonly Violation[]
}

export async function loadVocabulaire(): Promise<Vocabulaire> {
  const lexicon = JSON.parse(
    await readFile(join(WORK_DIR, 'lexicon.json'), 'utf8'),
  ) as MergedLexeme[]

  /**
   * Un mot par graphie, le plus simple d'abord : à graphie égale on retient
   * l'entrée du niveau le plus bas, puis la plus fréquente. C'est celle que
   * l'apprenant rencontrera en premier.
   */
  const byWord = new Map<string, MergedLexeme>()
  for (const entry of lexicon) {
    if (entry.hsk2025 > 3) continue
    const current = byWord.get(entry.simplified)
    if (
      current === undefined ||
      entry.hsk2025 < current.hsk2025 ||
      (entry.hsk2025 === current.hsk2025 &&
        (entry.freqRank ?? Infinity) < (current.freqRank ?? Infinity))
    ) {
      byWord.set(entry.simplified, entry)
    }
  }

  const perLevel = new Map<number, ReturnType<typeof buildLexicon>>()
  const violations: Violation[] = []

  function lexiconFor(level: number, proper: ReadonlySet<string>) {
    // Les noms propres changent d'un contenu à l'autre : on ne met en cache
    // que le vocabulaire du niveau, et on y ajoute les noms à la volée.
    const base = perLevel.get(level)
    const words =
      base ??
      buildLexicon(
        [...byWord.values()]
          .filter((entry) => entry.hsk2025 <= level)
          .map((entry) => entry.simplified),
      )
    if (base === undefined) perLevel.set(level, words)
    if (proper.size === 0) return words
    return buildLexicon([...words.words, ...proper])
  }

  return {
    violations,
    checkAndSegment(zh, level, proper, ou) {
      let words = 0
      const tokens = segment(zh, lexiconFor(level, proper)).map((token): OutToken => {
        if (!isHanzi(token.text.charAt(0))) return { text: token.text, lexemeId: null }

        words += 1
        if (proper.has(token.text)) return { text: token.text, lexemeId: null }

        const entry = byWord.get(token.text)
        if (entry === undefined || entry.hsk2025 > level) {
          violations.push({ ou, mot: token.text })
          return { text: token.text, lexemeId: null }
        }
        return { text: token.text, lexemeId: entry.id }
      })

      return { tokens, words }
    },
  }
}

export function reportViolations(violations: readonly Violation[]): void {
  if (violations.length === 0) return

  console.error(`\n${String(violations.length)} mot(s) hors du vocabulaire autorisé :`)
  for (const violation of violations) {
    console.error(`  ${violation.ou} : ${violation.mot}`)
  }
  console.error(
    '\nUn contenu qui emploie un mot que le lecteur n’a pas appris le met en' +
      ' échec sans qu’il comprenne pourquoi. Corrige la phrase ou déclare le' +
      ' mot comme nom propre.',
  )
  process.exit(1)
}
