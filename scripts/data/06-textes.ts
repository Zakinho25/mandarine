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
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { loadVocabulaire, reportViolations } from './lib/vocabulaire.ts'
import { OUT_DIR } from './sources.ts'
import { TEXTES } from './textes.ts'

const TEXTES_DIR = join(OUT_DIR, 'textes')

const vocabulaire = await loadVocabulaire()

await rm(TEXTES_DIR, { recursive: true, force: true })
await mkdir(TEXTES_DIR, { recursive: true })

const summaries: {
  id: string
  level: number
  titleZh: string
  titleFr: string
  unit: string
  words: number
  characters: number
}[] = []

for (const source of TEXTES) {
  const proper = new Set(source.proper ?? [])
  let words = 0
  let characters = 0

  const paragraphs = source.paragraphs.map((paragraph, index) => {
    const result = vocabulaire.checkAndSegment(
      paragraph.zh,
      source.level,
      proper,
      `${source.id}, paragraphe ${String(index + 1)}`,
    )
    words += result.words
    for (const token of result.tokens) {
      if (token.lexemeId !== null) characters += [...token.text].length
    }
    return { fr: paragraph.fr, tokens: result.tokens }
  })

  await writeFile(
    join(TEXTES_DIR, `${source.id}.json`),
    `${JSON.stringify(
      {
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
      null,
      1,
    )}\n`,
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

reportViolations(vocabulaire.violations)

console.log(`\n${String(summaries.length)} textes écrits dans ${TEXTES_DIR}/`)
