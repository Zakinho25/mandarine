import { splitNumbered, stripTone, unmarkVowel } from '../../../src/domain/pinyin/index.ts'

/**
 * Aligne les tons d'un pinyin numéroté sur ceux d'un pinyin à diacritiques.
 *
 * Pourquoi c'est nécessaire : les dictionnaires et le syllabus ne notent pas
 * les mêmes tons. Le dictionnaire enregistre souvent la prononciation
 * courante, avec ton neutre — `xue2 sheng5` pour 学生 — là où le syllabus
 * imprime le ton de citation, `xuéshēng`. Le syllabus fait autorité pour ce
 * projet : c'est lui qu'on enseigne.
 *
 * Mais on ne peut pas simplement convertir `xuéshēng` en numéroté : rien
 * n'indique où coupe la syllabe quand les lettres sont collées. D'où la
 * répartition des rôles — **le dictionnaire fournit le découpage, le syllabus
 * fournit les tons**.
 *
 * `keepBases` protège les syllabes dont le ton ne doit pas être repris : 一 et
 * 不 changent de ton selon leur voisin, et le syllabus imprime le résultat de
 * ce sandhi. On stocke leur forme de citation, le sandhi étant appliqué à
 * l'affichage par une règle que l'application doit pouvoir enseigner.
 *
 * Si l'alignement ne tombe pas juste, la fonction renvoie l'entrée inchangée :
 * mieux vaut une donnée du dictionnaire qu'une donnée devinée.
 */
export function retone(
  numbered: string,
  marked: string,
  keepBases: readonly string[] = ['yi', 'bu'],
): string {
  const syllables = splitNumbered(numbered)
  if (syllables.length === 0) return numbered

  const target = stripTone(
    marked
      .normalize('NFC')
      .toLowerCase()
      .replace(/[\s'’·\-–]/g, ''),
  )
  const tones = toneSequence(
    marked
      .normalize('NFC')
      .toLowerCase()
      .replace(/[\s'’·\-–]/g, ''),
  )

  const retoned: string[] = []
  let cursor = 0

  for (const syllable of syllables) {
    const base = stripTone(syllable)
    const slice = target.slice(cursor, cursor + base.length)

    // Le découpage ne correspond pas : on s'arrête plutôt que de deviner.
    if (slice !== base) return numbered

    const keep = keepBases.includes(base)
    const tone = keep
      ? (/[1-5]/.exec(syllable)?.[0] ?? '5')
      : String(dominantTone(tones.slice(cursor, cursor + base.length)))

    retoned.push(base + tone)
    cursor += base.length
  }

  if (cursor !== target.length) return numbered
  return retoned.join(' ')
}

/** Ton porté par chaque caractère : 1 à 4 sur la voyelle accentuée, 0 ailleurs. */
function toneSequence(compactMarked: string): number[] {
  return [...compactMarked].map((character) => unmarkVowel(character)?.tone ?? 0)
}

/** Une syllabe ne porte qu'une marque ; son absence signifie ton neutre. */
function dominantTone(tones: readonly number[]): number {
  return tones.find((tone) => tone > 0) ?? 5
}
