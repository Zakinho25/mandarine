/**
 * Étape 4 — Génération du contenu de l'application.
 *
 * Produit `public/content/index.json` et un fichier par niveau. Ces fichiers
 * sont les seuls que l'application lit ; tout le reste du pipeline leur est
 * invisible.
 *
 * L'attribution voyage **dans** les fichiers de données, pas seulement dans
 * un document à part : CFDICT est sous CC BY-SA, et une donnée séparée de sa
 * licence finit toujours par être réutilisée sans elle.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { DIVERS_ID, UNITES } from '../../src/data/unites.ts'
import type { MergedLexeme } from './03-merge.ts'
import { OUT_DIR, WORK_DIR } from './sources.ts'

/** Niveaux produits pour l'instant. Le reste du lexique attend son jalon. */
const LEVELS = [1, 2, 3] as const

const ATTRIBUTION = [
  {
    what: 'Vocabulaire, niveaux et classes grammaticales',
    source: '《新版HSK考试大纲》 (nouveau syllabus HSK), novembre 2025',
    by: 'Center for Language Education and Cooperation',
    licence: 'Document officiel — droits réservés, usage personnel',
  },
  {
    what: 'Définitions françaises',
    source: 'CFDICT',
    by: 'Chine Informations',
    licence: 'CC BY-SA 3.0',
    url: 'https://chine.in/mandarin/dictionnaire/CFDICT/',
  },
  {
    what: 'Formes traditionnelles et pinyin numéroté',
    source: 'ivankra/hsk30, d’après le standard GF 0025-2021',
    by: 'Ivan Krasilnikov',
    licence: 'MIT',
    url: 'https://github.com/ivankra/hsk30',
  },
] as const

const lexicon = JSON.parse(
  await readFile(join(WORK_DIR, 'lexicon.json'), 'utf8'),
) as MergedLexeme[]

await mkdir(OUT_DIR, { recursive: true })

function statusOf(lexeme: MergedLexeme): string {
  return lexeme.glossSource === 'manuel' ? 'reviewed_human' : 'auto_checked'
}

const summaries: {
  level: number
  file: string
  count: number
  cumulative: number
  bytes: number
}[] = []
let cumulative = 0

for (const level of LEVELS) {
  const slice = lexicon
    .filter((lexeme) => lexeme.hsk2025 === level)
    // Ordre pédagogique : du plus fréquent au moins fréquent, comme le demande
    // le cahier des charges. Le syllabus classe par ordre alphabétique de
    // pinyin, ce qui ne dit rien de l'utilité d'un mot. Les quelques mots sans
    // rang passent en fin de liste, dans l'ordre du syllabus.
    .sort((a, b) => {
      const rankA = a.freqRank ?? Number.POSITIVE_INFINITY
      const rankB = b.freqRank ?? Number.POSITIVE_INFINITY
      return rankA === rankB ? a.syllabusId - b.syllabusId : rankA - rankB
    })

  const lexemes = slice.map((lexeme) => ({
    id: lexeme.id,
    simplified: lexeme.simplified,
    traditional: lexeme.traditional,
    pinyinNum: lexeme.pinyinNum,
    pinyinMark: lexeme.pinyinMark,
    pos: lexeme.pos,
    hsk2025: lexeme.hsk2025,
    hsk2021: lexeme.hsk2021,
    glossFr: lexeme.glossFr,
    contentStatus: statusOf(lexeme),
    /** Définition rapprochée avec une tolérance : à vérifier en priorité. */
    glossApprox: lexeme.glossSource === 'cfdict-approx',
    freqRank: lexeme.freqRank,
    unit: lexeme.unit,
  }))

  cumulative += lexemes.length

  const file = `hsk-${String(level)}.json`
  const payload = {
    format: 'mandarine-contenu',
    version: 1,
    generatedAt: new Date().toISOString(),
    level,
    examTrack: 'hsk3_2025',
    count: lexemes.length,
    attribution: ATTRIBUTION,
    lexemes,
  }

  const json = `${JSON.stringify(payload, null, 1)}\n`
  await writeFile(join(OUT_DIR, file), json)
  summaries.push({
    level,
    file,
    count: lexemes.length,
    cumulative,
    bytes: Buffer.byteLength(json),
  })
}

const index = {
  format: 'mandarine-index',
  version: 1,
  generatedAt: new Date().toISOString(),
  source: {
    document: '《新版HSK考试大纲》 — nouveau syllabus HSK',
    publishedBy: 'Center for Language Education and Cooperation',
    publishedOn: '2025-11',
    note: 'Empreinte SHA-256 du PDF officiel vérifiée lors du téléchargement.',
  },
  levels: summaries.map(({ level, file, count, cumulative: total }) => ({
    level,
    file,
    count,
    cumulative: total,
  })),
  attribution: ATTRIBUTION,
}

await writeFile(join(OUT_DIR, 'index.json'), `${JSON.stringify(index, null, 2)}\n`)

// --------------------------------------------------------------------------
// Unités thématiques
// --------------------------------------------------------------------------
const core = lexicon.filter((lexeme) => LEVELS.includes(lexeme.hsk2025 as 1 | 2 | 3))
const counts = new Map<string, number>()
for (const lexeme of core) counts.set(lexeme.unit, (counts.get(lexeme.unit) ?? 0) + 1)

const units = [
  ...UNITES.map((unit) => ({
    id: unit.id,
    title: unit.title,
    goal: unit.goal,
    count: counts.get(unit.id) ?? 0,
  })),
  {
    id: DIVERS_ID,
    title: 'Le reste',
    goal: 'Les mots qui ne tiennent dans aucun thème. Ils comptent autant.',
    count: counts.get(DIVERS_ID) ?? 0,
  },
].filter((unit) => unit.count > 0)

await writeFile(
  join(OUT_DIR, 'unites.json'),
  `${JSON.stringify(
    {
      format: 'mandarine-unites',
      version: 1,
      generatedAt: new Date().toISOString(),
      total: core.length,
      units,
    },
    null,
    1,
  )}\n`,
)
console.log(`  unites.json  ${String(units.length)} unités`)

for (const summary of summaries) {
  console.log(
    `  ${summary.file.padEnd(12)} ${String(summary.count).padStart(4)} mots` +
      ` (${String(summary.cumulative).padStart(4)} cumulés)` +
      ` — ${String(Math.round(summary.bytes / 1024))} Ko`,
  )
}
console.log(`\n${String(cumulative)} mots écrits dans ${OUT_DIR}/`)
