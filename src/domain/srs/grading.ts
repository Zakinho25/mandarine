import {
  normalizeUmlaut,
  splitNumbered,
  stripTone,
  toneOf,
  unmarkVowel,
} from '../pinyin/index'
import type { Note } from './scheduler'

/**
 * Correction d'une réponse en pinyin.
 *
 * L'utilisateur doit pouvoir écrire comme il veut : `ni3 hao3`, `ni3hao3`,
 * `nihao`, `nǐ hǎo`, `NǏHǍO`. Ce qu'on juge, c'est sa connaissance du mot,
 * pas sa maîtrise d'une convention de saisie.
 *
 * En revanche, **un ton faux est une erreur**. Dans une application dont les
 * tons sont la priorité annoncée, accepter `ni hao` pour `nǐ hǎo` sans rien
 * dire reviendrait à enseigner qu'ils sont facultatifs. On distingue donc le
 * ton oublié — qu'on signale — du ton faux, qui relance la carte.
 */

export const VERDICTS = ['exact', 'tons_manquants', 'tons_faux', 'faux'] as const
export type Verdict = (typeof VERDICTS)[number]

export const VERDICT_MESSAGES: Record<Verdict, string> = {
  exact: 'Exact.',
  tons_manquants: 'Syllabes justes, mais les tons manquent.',
  tons_faux: 'Bonnes syllabes, mauvais ton.',
  faux: 'Ce n’est pas ce mot.',
}

/**
 * Lit la réponse en s'appuyant sur le découpage attendu.
 *
 * Une suite de lettres accentuées n'est pas découpable seule — rien n'y marque
 * la frontière des syllabes. On consomme donc la réponse syllabe par syllabe
 * en suivant le modèle attendu, ce qui permet d'accepter indifféremment les
 * chiffres, les diacritiques ou l'absence de ton.
 *
 * Renvoie le ton lu pour chaque syllabe (0 = aucun ton indiqué), ou
 * `undefined` si la réponse ne correspond pas aux syllabes attendues.
 */
function readTones(given: string, bases: readonly string[]): number[] | undefined {
  const source = normalizeUmlaut(given.normalize('NFC').toLowerCase()).replace(
    /[\s'’·\-–]/g,
    '',
  )

  const tones: number[] = []
  let cursor = 0

  for (const base of bases) {
    let consumed = ''
    let tone = 0

    while (cursor < source.length && consumed.length < base.length) {
      const character = source.charAt(cursor)
      if (character >= '1' && character <= '5') return undefined

      const marked = unmarkVowel(character)
      if (marked === undefined) consumed += character
      else {
        tone = marked.tone
        consumed += marked.vowel
      }
      cursor += 1
    }

    if (consumed !== base) return undefined

    // Un chiffre de ton suit éventuellement la syllabe.
    const next = source.charAt(cursor)
    if (next >= '1' && next <= '5') {
      tone = Number(next)
      cursor += 1
    }

    tones.push(tone)
  }

  return cursor === source.length ? tones : undefined
}

export function checkPinyin(expectedNumbered: string, given: string): Verdict {
  const syllables = splitNumbered(expectedNumbered)
  if (syllables.length === 0 || given.trim().length === 0) return 'faux'

  const bases = syllables.map((syllable) => stripTone(syllable))
  const expected = syllables.map((syllable) => toneOf(syllable))

  const tones = readTones(given, bases)
  if (tones === undefined) return 'faux'

  const correct = tones.every((tone, index) => {
    const want = expected[index] ?? 5
    // Le ton neutre ne se note pas : ne pas l'écrire est la façon normale.
    return tone === want || (want === 5 && tone === 0)
  })
  if (correct) return 'exact'

  return tones.some((tone) => tone > 0) ? 'tons_faux' : 'tons_manquants'
}

/**
 * Appréciation proposée par défaut d'après la correction.
 *
 * Un ton faux relance la carte : c'est précisément ce que l'application existe
 * pour corriger. Un ton simplement oublié vaut « difficile » — la syllabe est
 * sue, la précision ne l'est pas encore. L'utilisateur garde la main et peut
 * toujours choisir autre chose.
 */
export function suggestedNote(verdict: Verdict): Note {
  switch (verdict) {
    case 'exact':
      return 'correct'
    case 'tons_manquants':
      return 'difficile'
    default:
      return 'encore'
  }
}

export function isAcceptable(verdict: Verdict): boolean {
  return verdict === 'exact' || verdict === 'tons_manquants'
}
