/**
 * Classes grammaticales : du chinois du syllabus vers le français.
 *
 * Le syllabus note par exemple `动、名` (verbe puis nom) et met entre
 * parenthèses les emplois secondaires : `名、（动）`. On conserve cette
 * nuance, parce qu'elle est pédagogiquement utile — savoir qu'un mot est
 * surtout un nom et accessoirement un verbe change la façon de l'apprendre.
 */

export interface PartOfSpeech {
  readonly label: string
  /** `true` quand le syllabus l'a mis entre parenthèses. */
  readonly secondary: boolean
}

const LABELS: Readonly<Record<string, string>> = {
  名: 'nom',
  动: 'verbe',
  形: 'adjectif',
  副: 'adverbe',
  量: 'classificateur',
  数: 'numéral',
  数量: 'numéral-classificateur',
  代: 'pronom',
  介: 'préposition',
  连: 'conjonction',
  助: 'particule',
  叹: 'interjection',
  拟声: 'onomatopée',
  前缀: 'préfixe',
  后缀: 'suffixe',
  区别: 'déterminatif',
}

/** Étiquettes rencontrées dans les données mais absentes de la table. */
export const unknownTags = new Set<string>()

export function parsePartsOfSpeech(raw: string): PartOfSpeech[] {
  const trimmed = raw.trim()
  if (trimmed.length === 0) return []

  const result: PartOfSpeech[] = []

  for (const chunk of trimmed.split('、')) {
    let tag = chunk.trim()
    if (tag.length === 0) continue

    // Les parenthèses sont chinoises (（）), pas latines.
    const secondary = tag.startsWith('（') || tag.startsWith('(')
    tag = tag.replace(/[（）()]/g, '').trim()
    if (tag.length === 0) continue

    const label = LABELS[tag]
    if (label === undefined) {
      unknownTags.add(tag)
      continue
    }
    if (result.some((existing) => existing.label === label)) continue

    result.push({ label, secondary })
  }

  return result
}
