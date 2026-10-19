/**
 * Étape 2 — Normalisation.
 *
 * Chaque source arrive dans un format différent ; on les ramène à des
 * structures typées, sans encore rien joindre. Séparer la normalisation de la
 * fusion permet de relancer l'une sans l'autre, et rend les erreurs
 * attribuables à une source précise.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { parseCedict, parseCedictKey } from './lib/cedict.ts'
import { parseCsvRecords } from './lib/csv.ts'
import { parsePartsOfSpeech, unknownTags } from './lib/pos.ts'
import type { DictEntry, StandardEntry, SyllabusEntry } from './lib/types.ts'
import { RAW_DIR, WORK_DIR } from './sources.ts'

interface RawSyllabusEntry {
  readonly id: number
  readonly level: string
  readonly hanzi: string
  readonly pinyin: string
  readonly part_of_speech: string | null
  readonly homograph: number | string | null
  readonly level_label: string
  readonly source_pdf_page: number
}

/** `"7-9"` devient 7 : le syllabus ne subdivise pas la bande avancée. */
function normalizeLevel(label: string): number {
  if (label.startsWith('7')) return 7
  const parsed = Number.parseInt(label, 10)
  return Number.isNaN(parsed) ? 0 : parsed
}

await mkdir(WORK_DIR, { recursive: true })

// --------------------------------------------------------------------------
// Syllabus 2025
// --------------------------------------------------------------------------
const rawSyllabus = JSON.parse(
  await readFile(join(RAW_DIR, 'hsk-3.0-syllabus-2025.json'), 'utf8'),
) as RawSyllabusEntry[]

const syllabus: SyllabusEntry[] = rawSyllabus.map((entry) => ({
  id: entry.id,
  level: normalizeLevel(entry.level),
  levelLabel: entry.level_label,
  simplified: entry.hanzi.trim(),
  pinyinMark: entry.pinyin.trim(),
  pos: parsePartsOfSpeech(entry.part_of_speech ?? ''),
  homograph: entry.homograph === null ? null : Number(entry.homograph),
  sourcePdfPage: entry.source_pdf_page,
}))

// --------------------------------------------------------------------------
// Standard 2021
// --------------------------------------------------------------------------
const standardRecords = parseCsvRecords(
  await readFile(join(RAW_DIR, 'hsk30-standard-2021.csv'), 'utf8'),
)

const standard: StandardEntry[] = standardRecords
  .filter((record) => (record['Simplified'] ?? '').length > 0)
  .map((record) => {
    const cedictKey = record['CEDICT'] ?? ''
    const parsed = cedictKey.length > 0 ? parseCedictKey(cedictKey) : undefined
    const traditional = record['Traditional'] ?? ''

    return {
      id: record['ID'] ?? '',
      simplified: (record['Simplified'] ?? '').trim(),
      traditional: traditional.length > 0 ? traditional.trim() : null,
      pinyinMark: (record['Pinyin'] ?? '').trim(),
      posLatin: (record['POS'] ?? '').trim(),
      level: normalizeLevel(record['Level'] ?? ''),
      pinyinNum: parsed?.pinyinNum ?? null,
    }
  })

// --------------------------------------------------------------------------
// CFDICT
// --------------------------------------------------------------------------
const dictionary: DictEntry[] = parseCedict(
  await readFile(join(RAW_DIR, 'cfdict.u8'), 'utf8'),
)

// --------------------------------------------------------------------------
await writeFile(join(WORK_DIR, 'syllabus-2025.json'), JSON.stringify(syllabus))
await writeFile(join(WORK_DIR, 'standard-2021.json'), JSON.stringify(standard))
await writeFile(join(WORK_DIR, 'cfdict.json'), JSON.stringify(dictionary))

const byLevel = new Map<number, number>()
for (const entry of syllabus) byLevel.set(entry.level, (byLevel.get(entry.level) ?? 0) + 1)

console.log(`Syllabus 2025   : ${String(syllabus.length)} entrées`)
console.log(
  `  par niveau    : ${[...byLevel.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([level, count]) => `${String(level)}=${String(count)}`)
    .join('  ')}`,
)
console.log(`Standard 2021   : ${String(standard.length)} entrées`)
console.log(
  `  pinyin numéroté absent : ${String(standard.filter((e) => e.pinyinNum === null).length)}`,
)
console.log(`CFDICT          : ${String(dictionary.length)} entrées`)

if (unknownTags.size > 0) {
  console.warn(
    `\nClasses grammaticales inconnues, ignorées : ${[...unknownTags].join(', ')}`,
  )
}
