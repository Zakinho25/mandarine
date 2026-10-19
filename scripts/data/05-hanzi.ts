/**
 * Étape 5 — Caractères : décomposition et tracés.
 *
 * Deux sorties de nature différente :
 *
 *  - `public/content/hanzi/index.json` : un index léger (radical,
 *    décomposition, nombre de traits) pour tous les caractères du vocabulaire.
 *    Il est préchargé avec l'application ;
 *  - `public/content/hanzi/u<codepoint>.json` : les tracés d'**un** caractère,
 *    environ 3 Ko. Précharger les neuf cents ferait grossir l'installation de
 *    trois mégaoctets pour des caractères qu'on ne consultera peut-être
 *    jamais. Ils sont donc servis à la demande et mis en cache par le service
 *    worker à la première consultation.
 *
 * Le nom de fichier utilise le point de code plutôt que le caractère : un
 * caractère chinois dans une URL demande un encodage, et dans un nom de
 * fichier il dépend du système.
 */
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { COMPONENT_GLOSSES } from '../../src/data/composants.ts'
import { parseIds, topLevelParts } from '../../src/domain/hanzi/ids.ts'
import type { MergedLexeme } from './03-merge.ts'
import { OUT_DIR, RAW_DIR, WORK_DIR } from './sources.ts'

interface RawDictionaryEntry {
  readonly character: string
  readonly definition?: string
  readonly pinyin?: readonly string[]
  readonly decomposition?: string
  readonly radical?: string
  readonly etymology?: {
    readonly type: string
    readonly phonetic?: string
    readonly semantic?: string
    readonly hint?: string
  }
}

interface RawGraphicsEntry {
  readonly character: string
  readonly strokes: readonly string[]
  readonly medians: readonly (readonly (readonly number[])[])[]
}

/** Nature de la construction du caractère, traduite. */
const ORIGIN_LABELS: Readonly<Record<string, string>> = {
  pictographic: 'pictogramme',
  ideographic: 'idéogramme',
  pictophonetic: 'idéophonogramme',
}

const HANZI_DIR = join(OUT_DIR, 'hanzi')

function codepointName(character: string): string {
  return `u${(character.codePointAt(0) ?? 0).toString(16)}`
}

function readJsonLines<T>(text: string): T[] {
  const out: T[] = []
  for (const line of text.split('\n')) {
    if (line.trim().length === 0) continue
    try {
      out.push(JSON.parse(line) as T)
    } catch {
      // Une ligne illisible est ignorée : le fichier en compte des milliers.
    }
  }
  return out
}

const lexicon = JSON.parse(
  await readFile(join(WORK_DIR, 'lexicon.json'), 'utf8'),
) as MergedLexeme[]

// Caractères réellement utilisés par le vocabulaire des niveaux 1 à 3.
const needed = new Set<string>()
/** Caractères qui sont eux-mêmes des mots : leur sens vient du lexique. */
const knownWords = new Set<string>()

for (const lexeme of lexicon) {
  if (lexeme.hsk2025 > 3) continue
  if ([...lexeme.simplified].length === 1) knownWords.add(lexeme.simplified)
  for (const character of lexeme.simplified) {
    // On écarte la ponctuation et les chiffres latins éventuels.
    if (character >= '一' && character <= '鿿') needed.add(character)
  }
}

const dictionary = new Map(
  readJsonLines<RawDictionaryEntry>(
    await readFile(join(RAW_DIR, 'makemeahanzi-dictionary.txt'), 'utf8'),
  ).map((entry) => [entry.character, entry]),
)

const graphics = new Map(
  readJsonLines<RawGraphicsEntry>(
    await readFile(join(RAW_DIR, 'makemeahanzi-graphics.txt'), 'utf8'),
  ).map((entry) => [entry.character, entry]),
)

// On repart d'un dossier vide : un caractère retiré du vocabulaire ne doit pas
// laisser son fichier derrière lui.
await rm(HANZI_DIR, { recursive: true, force: true })
await mkdir(HANZI_DIR, { recursive: true })

interface IndexEntry {
  readonly character: string
  readonly strokeCount: number
  readonly radical: string | null
  readonly decomposition: string | null
  readonly parts: readonly string[]
  readonly origin: string | null
  /** Partie qui porte le sens, pour un idéophonogramme. */
  readonly semantic: string | null
  /** Partie qui donne le son, pour un idéophonogramme. */
  readonly phonetic: string | null
  readonly hasStrokes: boolean
}

const index: IndexEntry[] = []
const missingGraphics: string[] = []
const missingDictionary: string[] = []
const unglossedParts = new Map<string, number>()

for (const character of [...needed].sort()) {
  const entry = dictionary.get(character)
  const drawing = graphics.get(character)

  if (entry === undefined) missingDictionary.push(character)
  if (drawing === undefined) missingGraphics.push(character)

  const decomposition = entry?.decomposition ?? null
  const tree = decomposition === null ? undefined : parseIds(decomposition)
  const parts = tree === undefined ? [] : topLevelParts(tree)

  for (const part of parts) {
    // Un composant qui est lui-même un mot du vocabulaire tient sa
    // traduction du lexique : 不, 天 ou 可 n'ont pas besoin d'une entrée
    // écrite à la main. Seuls les composants qui n'existent pas comme mots
    // autonomes en demandent une.
    if (part in COMPONENT_GLOSSES || knownWords.has(part)) continue
    unglossedParts.set(part, (unglossedParts.get(part) ?? 0) + 1)
  }

  index.push({
    character,
    strokeCount: drawing?.strokes.length ?? 0,
    radical: entry?.radical ?? null,
    decomposition,
    parts,
    origin: ORIGIN_LABELS[entry?.etymology?.type ?? ''] ?? null,
    semantic: entry?.etymology?.semantic ?? null,
    phonetic: entry?.etymology?.phonetic ?? null,
    hasStrokes: drawing !== undefined,
  })

  if (drawing !== undefined) {
    // Format attendu par hanzi-writer : traits et médianes, rien d'autre.
    await writeFile(
      join(HANZI_DIR, `${codepointName(character)}.json`),
      JSON.stringify({ strokes: drawing.strokes, medians: drawing.medians }),
    )
  }
}

await writeFile(
  join(HANZI_DIR, 'index.json'),
  `${JSON.stringify(
    {
      format: 'mandarine-hanzi',
      version: 1,
      generatedAt: new Date().toISOString(),
      count: index.length,
      attribution: {
        source: 'Make Me a Hanzi',
        by: 'Shaunak Kishore',
        licence: 'Arphic Public License',
        url: 'https://github.com/skishore/makemeahanzi',
      },
      characters: index,
    },
    null,
    1,
  )}\n`,
)

const files = await readdir(HANZI_DIR)
const total = index.reduce((sum, entry) => sum + entry.strokeCount, 0)

console.log(`Caractères du vocabulaire : ${String(needed.size)}`)
console.log(`  avec tracés             : ${String(index.filter((e) => e.hasStrokes).length)}`)
console.log(`  traits au total         : ${String(total)}`)
console.log(`  fichiers écrits         : ${String(files.length)}`)

if (missingDictionary.length > 0) {
  console.warn(`\nSans décomposition (${String(missingDictionary.length)}) : ${missingDictionary.join('')}`)
}
if (missingGraphics.length > 0) {
  console.warn(`Sans tracés (${String(missingGraphics.length)}) : ${missingGraphics.join('')}`)
}

// On ne signale que les composants qui reviennent : la longue traîne des
// composants vus une seule fois ne vaut pas le travail de rédaction, et
// l'application sait afficher un composant sans glose.
const recurrents = [...unglossedParts.entries()]
  .filter(([, count]) => count >= 2)
  .sort((a, b) => b[1] - a[1])
const uniques = unglossedParts.size - recurrents.length

if (recurrents.length > 0) {
  console.warn(
    `\n${String(recurrents.length)} composants récurrents sans traduction française :\n` +
      recurrents.map(([part, count]) => `${part}(${String(count)})`).join(' '),
  )
  console.warn(
    '\nÀ ajouter dans src/data/composants.ts : sans glose, la décomposition' +
      ' affiche un caractère nu, ce qui n’apprend rien.',
  )
}
if (uniques > 0) {
  console.log(
    `\n${String(uniques)} composants n’apparaissent qu’une fois et restent sans glose.`,
  )
}
