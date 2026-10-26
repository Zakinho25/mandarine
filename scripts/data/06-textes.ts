/**
 * Étape 6 — Textes de lecture : découpage et vérification.
 *
 * Deux responsabilités :
 *
 *  1. **Vérifier** que chaque texte n'emploie que le vocabulaire de son niveau.
 *     Le script échoue si un seul mot sort de la liste : c'est la garantie
 *     qu'un texte de niveau 1 reste lisible avec 300 mots.
 *  2. **Découper une fois pour toutes.** Les textes sont segmentés ici et les
 *     jetons sont écrits avec leur identifiant de mot. L'application n'a plus
 *     rien à découper : elle lit une liste. C'est plus rapide, déterministe,
 *     et surtout le découpage coïncide exactement avec le vocabulaire
 *     enseigné, ce qu'un segmenteur générique ne garantirait pas.
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { buildLexicon, isHanzi, segment } from '../../src/domain/segmentation.ts'
import type { MergedLexeme } from './03-merge.ts'
import { OUT_DIR, WORK_DIR } from './sources.ts'
import { TEXTES, type TexteSource } from './textes.ts'

const TEXTES_DIR = join(OUT_DIR, 'textes')

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

/** Vocabulaire autorisé à un niveau : le sien et tous les précédents. */
function allowedWords(level: number): string[] {
  return [...byWord.values()]
    .filter((entry) => entry.hsk2025 <= level)
    .map((entry) => entry.simplified)
}

interface OutToken {
  readonly text: string
  /** Identifiant du mot, `null` pour la ponctuation et les noms propres. */
  readonly lexemeId: string | null
}

interface Violation {
  readonly texte: string
  readonly paragraphe: number
  readonly mot: string
}

const violations: Violation[] = []
const summaries: {
  id: string
  level: number
  titleZh: string
  titleFr: string
  unit: string
  words: number
  characters: number
}[] = []

await rm(TEXTES_DIR, { recursive: true, force: true })
await mkdir(TEXTES_DIR, { recursive: true })

function buildText(source: TexteSource): {
  payload: unknown
  words: number
  characters: number
} {
  const allowed = allowedWords(source.level)
  const proper = new Set(source.proper ?? [])
  const lex = buildLexicon([...allowed, ...proper])

  let words = 0
  let characters = 0

  const paragraphs = source.paragraphs.map((paragraph, index) => {
    const tokens: OutToken[] = segment(paragraph.zh, lex).map((token) => {
      if (!isHanzi(token.text.charAt(0))) return { text: token.text, lexemeId: null }

      words += 1
      characters += [...token.text].length

      if (proper.has(token.text)) return { text: token.text, lexemeId: null }

      const entry = byWord.get(token.text)
      if (entry === undefined || entry.hsk2025 > source.level) {
        violations.push({ texte: source.id, paragraphe: index + 1, mot: token.text })
        return { text: token.text, lexemeId: null }
      }
      return { text: token.text, lexemeId: entry.id }
    })

    return { fr: paragraph.fr, tokens }
  })

  return {
    payload: {
      format: 'mandarine-texte',
      version: 1,
      generatedAt: new Date().toISOString(),
      id: source.id,
      level: source.level,
      titleZh: source.titleZh,
      titleFr: source.titleFr,
      unit: source.unit,
      // Le vocabulaire est vérifié par script ; le naturel de la langue ne
      // l'est pas. L'étiquette dit exactement ce qui a été contrôlé.
      contentStatus: 'auto_checked',
      paragraphs,
    },
    words,
    characters,
  }
}

for (const source of TEXTES) {
  const { payload, words, characters } = buildText(source)
  await writeFile(
    join(TEXTES_DIR, `${source.id}.json`),
    `${JSON.stringify(payload, null, 1)}\n`,
  )
  summaries.push({
    id: source.id,
    level: source.level,
    titleZh: source.titleZh,
    titleFr: source.titleFr,
    unit: source.unit,
    words,
    characters,
  })
}

await writeFile(
  join(TEXTES_DIR, 'index.json'),
  `${JSON.stringify(
    {
      format: 'mandarine-textes',
      version: 1,
      generatedAt: new Date().toISOString(),
      count: summaries.length,
      textes: summaries,
    },
    null,
    1,
  )}\n`,
)

for (const level of [1, 2, 3]) {
  const slice = summaries.filter((text) => text.level === level)
  console.log(
    `  HSK ${String(level)} : ${String(slice.length)} textes,` +
      ` ${String(slice.reduce((sum, t) => sum + t.words, 0))} mots`,
  )
}

if (violations.length > 0) {
  console.error(`\n${String(violations.length)} mot(s) hors du vocabulaire autorisé :`)
  for (const violation of violations) {
    console.error(
      `  ${violation.texte}, paragraphe ${String(violation.paragraphe)} : ${violation.mot}`,
    )
  }
  console.error(
    '\nUn texte qui emploie un mot que le lecteur n’a pas appris le met en' +
      ' échec sans qu’il comprenne pourquoi. Corrige le texte ou déclare le mot' +
      ' comme nom propre.',
  )
  process.exit(1)
}

console.log(`\n${String(summaries.length)} textes écrits dans ${TEXTES_DIR}/`)
