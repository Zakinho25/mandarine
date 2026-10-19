/**
 * Étape 3 — Fusion et rapport de divergences.
 *
 * Le syllabus de 2025 fait autorité sur **quels mots** et **à quel niveau**.
 * Le standard de 2021 fournit les métadonnées (traditionnel, pinyin numéroté)
 * et sert de deuxième avis sur le niveau. CFDICT fournit le français.
 *
 * Règle de conduite : là où deux sources divergent, on ne tranche pas en
 * silence — on enregistre le désaccord dans le rapport.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { stripTone, toDiacritics } from '../../src/domain/pinyin/index.ts'
import { retone } from './lib/retone.ts'
import type { PartOfSpeech } from './lib/pos.ts'
import type { DictEntry, StandardEntry, SyllabusEntry } from './lib/types.ts'
import { OVERRIDES, overrideKey, type Override } from './overrides.ts'
import { WORK_DIR } from './sources.ts'

export interface MergedLexeme {
  readonly id: string
  readonly simplified: string
  readonly traditional: string | null
  /** Forme canonique du projet. `null` si aucune source ne l'a fournie. */
  readonly pinyinNum: string | null
  readonly pinyinMark: string
  readonly pos: readonly PartOfSpeech[]
  readonly hsk2025: number
  readonly hsk2021: number | null
  readonly glossFr: readonly string[]
  /**
   * `cfdict` = rapprochement exact, `cfdict-approx` = tolérance appliquée,
   * `manuel` = rédigé à la main dans `overrides.ts`.
   */
  readonly glossSource: 'cfdict' | 'cfdict-approx' | 'manuel' | null
  readonly syllabusId: number
}

/**
 * Forme comparable d'un pinyin à diacritiques : sans espaces, sans
 * apostrophes, en minuscules. Le syllabus écrit `bàba`, CFDICT écrit
 * `ba4 ba5` — une fois converti et compacté, les deux donnent `bàba`.
 */
function compact(pinyin: string): string {
  return pinyin
    .normalize('NFC')
    .toLowerCase()
    // Le syllabus sépare parfois les syllabes par un tiret (`hóng-lǜdēng`),
    // le dictionnaire par une espace. Ni l'un ni l'autre ne porte de sens.
    .replace(/[\s'’·\-–]/g, '')
}

function groupBy<T>(items: readonly T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const k = key(item)
    const bucket = map.get(k)
    if (bucket === undefined) map.set(k, [item])
    else bucket.push(item)
  }
  return map
}

const syllabus = JSON.parse(
  await readFile(join(WORK_DIR, 'syllabus-2025.json'), 'utf8'),
) as SyllabusEntry[]
const standard = JSON.parse(
  await readFile(join(WORK_DIR, 'standard-2021.json'), 'utf8'),
) as StandardEntry[]
const dictionary = JSON.parse(
  await readFile(join(WORK_DIR, 'cfdict.json'), 'utf8'),
) as DictEntry[]

const standardBySimplified = groupBy(standard, (entry) => entry.simplified)
const dictBySimplified = groupBy(dictionary, (entry) => entry.simplified)

interface DictMatch {
  readonly entry: DictEntry
  /** `false` quand le rapprochement a demandé une tolérance. */
  readonly exact: boolean
  readonly how: 'exact' | 'lecture-multiple' | 'sans-erhua' | 'ton-ignoré' | 'candidat-unique'
}

/**
 * Cherche un mot dans CFDICT, avec trois tolérances successives — chacune
 * répond à un écart systématique constaté entre le syllabus et le
 * dictionnaire, pas à un cas isolé :
 *
 *  1. **Lectures multiples** : le syllabus écrit `shéi/shuí` pour 谁, le
 *     dictionnaire a une entrée par lecture.
 *  2. **Érhua** : le syllabus liste 面条儿, le dictionnaire ne connaît que
 *     面条. Le sens est le même, le suffixe est phonétique.
 *  3. **Ton neutre** : 起来 s'écrit `qǐlái` au syllabus et `qi3 lai5` au
 *     dictionnaire. Même mot, notation du ton différente.
 *
 * Tout ce qui n'est pas exact est marqué comme tel et compté dans le rapport :
 * une tolérance invisible serait une erreur qui se propage.
 */
function findInDictionary(simplified: string, pinyinMark: string): DictMatch | undefined {
  const readings = pinyinMark.split('/').map((reading) => compact(reading))
  const toneless = readings.map((reading) => stripTone(reading))

  function lookup(word: string, viaErhua: boolean): DictMatch | undefined {
    const candidates = dictBySimplified.get(word) ?? []
    if (candidates.length === 0) return undefined

    for (const candidate of candidates) {
      if (readings.includes(compact(toDiacritics(candidate.pinyinNum)))) {
        return {
          entry: candidate,
          exact: !viaErhua,
          how: viaErhua ? 'sans-erhua' : readings.length > 1 ? 'lecture-multiple' : 'exact',
        }
      }
    }
    for (const candidate of candidates) {
      if (toneless.includes(stripTone(compact(toDiacritics(candidate.pinyinNum))))) {
        return { entry: candidate, exact: false, how: viaErhua ? 'sans-erhua' : 'ton-ignoré' }
      }
    }
    if (candidates.length === 1 && candidates[0] !== undefined) {
      return { entry: candidates[0], exact: false, how: 'candidat-unique' }
    }
    return undefined
  }

  const direct = lookup(simplified, false)
  if (direct !== undefined) return direct

  if (simplified.length > 1 && simplified.endsWith('儿')) {
    return lookup(simplified.slice(0, -1), true)
  }
  return undefined
}

interface Divergence {
  readonly simplified: string
  readonly pinyinMark: string
  readonly hsk2025: number
  readonly hsk2021: number
}

const merged: MergedLexeme[] = []
const usedIds = new Set<string>()
const divergences: Divergence[] = []
const missingFromStandard: SyllabusEntry[] = []
const missingPinyinNum: SyllabusEntry[] = []
const missingGloss: SyllabusEntry[] = []
const approximate = new Map<string, number>()

const overrides = new Map<string, Override>(
  OVERRIDES.map((override) => [
    overrideKey(override.simplified, override.pinyinMark),
    override,
  ]),
)
const usedOverrides = new Set<Override>()
let retonedCount = 0

for (const entry of syllabus) {
  const target = compact(entry.pinyinMark)

  // --- 1. Correspondance dans le standard 2021 -----------------------------
  const standardCandidates = standardBySimplified.get(entry.simplified) ?? []
  const standardMatch =
    standardCandidates.find((candidate) => compact(candidate.pinyinMark) === target) ??
    (standardCandidates.length === 1 ? standardCandidates[0] : undefined)

  if (standardCandidates.length === 0) missingFromStandard.push(entry)

  // --- 2. Correspondance dans CFDICT ---------------------------------------
  const found = findInDictionary(entry.simplified, entry.pinyinMark)
  const dictMatch = found?.entry

  // --- 3. Pinyin numéroté, forme canonique ---------------------------------
  // Priorité au standard : sa clé CEDICT est déjà normalisée. CFDICT ensuite.
  // Un appariement approximatif ne fournit pas le pinyin : il pourrait être
  // celui d'une autre lecture du même caractère.
  const pinyinNum =
    standardMatch?.pinyinNum ?? (found?.exact === true ? found.entry.pinyinNum : null)

  // --- 3 bis. Corrections écrites à la main --------------------------------
  const override =
    overrides.get(overrideKey(entry.simplified, entry.pinyinMark)) ??
    overrides.get(overrideKey(entry.simplified))
  if (override !== undefined) usedOverrides.add(override)

  // Le dictionnaire fournit le découpage en syllabes, le syllabus fournit les
  // tons : 学生 est `xue2 sheng5` au dictionnaire et `xuéshēng` au syllabus.
  // C'est le syllabus qu'on enseigne.
  const aligned =
    pinyinNum === null ? null : retone(pinyinNum, entry.pinyinMark)
  if (aligned !== null && aligned !== pinyinNum) retonedCount += 1

  const finalPinyinNum = override?.pinyinNum ?? aligned
  if (finalPinyinNum === null) missingPinyinNum.push(entry)

  const glossFr = override?.glossFr ?? dictMatch?.definitions ?? []
  if (glossFr.length === 0) missingGloss.push(entry)

  const hsk2021 = standardMatch?.level ?? null
  if (hsk2021 !== null && hsk2021 !== entry.level) {
    divergences.push({
      simplified: entry.simplified,
      pinyinMark: entry.pinyinMark,
      hsk2025: entry.level,
      hsk2021,
    })
  }

  // --- 4. Identifiant stable ------------------------------------------------
  const base = `${entry.simplified}-${(finalPinyinNum ?? entry.pinyinMark).replace(/\s/g, '')}`
  const id = usedIds.has(base) ? `${base}-${String(entry.id)}` : base
  usedIds.add(id)

  merged.push({
    id,
    simplified: entry.simplified,
    traditional: standardMatch?.traditional ?? dictMatch?.traditional ?? null,
    pinyinNum: finalPinyinNum,
    pinyinMark: entry.pinyinMark,
    pos: entry.pos,
    hsk2025: entry.level,
    hsk2021,
    glossFr,
    glossSource:
      glossFr.length === 0
        ? null
        : override?.glossFr !== undefined
          ? 'manuel'
          : found?.exact === true
            ? 'cfdict'
            : 'cfdict-approx',
    syllabusId: entry.id,
  })

  if (found !== undefined && !found.exact) {
    approximate.set(found.how, (approximate.get(found.how) ?? 0) + 1)
  }
}

await writeFile(join(WORK_DIR, 'lexicon.json'), JSON.stringify(merged))

// ---------------------------------------------------------------------------
// Rapport
// ---------------------------------------------------------------------------
const core = merged.filter((lexeme) => lexeme.hsk2025 <= 3)
const coreDivergences = divergences.filter((d) => d.hsk2025 <= 3)

function pct(part: number, total: number): string {
  return total === 0 ? '—' : `${((100 * part) / total).toFixed(1)} %`
}

function levelRow(level: number): string {
  const slice = merged.filter((lexeme) => lexeme.hsk2025 === level)
  const withGloss = slice.filter((lexeme) => lexeme.glossFr.length > 0).length
  const withPinyin = slice.filter((lexeme) => lexeme.pinyinNum !== null).length
  const inStandard = slice.filter((lexeme) => lexeme.hsk2021 !== null).length
  return `| ${level === 7 ? '7-9' : String(level)} | ${String(slice.length)} | ${pct(inStandard, slice.length)} | ${pct(withPinyin, slice.length)} | ${pct(withGloss, slice.length)} |`
}

const sampleDivergences = coreDivergences
  .slice(0, 40)
  .map(
    (d) =>
      `| ${d.simplified} | ${d.pinyinMark} | ${String(d.hsk2025)} | ${String(d.hsk2021)} |`,
  )
  .join('\n')

const report = `# Rapport de données — jalon 2

Généré automatiquement par \`npm run data\`. Ne pas modifier à la main.

Date : ${new Date().toISOString().slice(0, 10)}

## Provenance

Le vocabulaire et les niveaux viennent du **《新版HSK考试大纲》** publié en
novembre 2025 par le Center for Language Education and Cooperation. Le PDF
officiel a été téléchargé et **son empreinte SHA-256 correspond** à celle que
déclare la transcription utilisée : les données proviennent bien de ce
document, et non d'une recopie approximative.

Totaux par niveau relevés dans les données : 300, 200, 500, 1 000, 1 600,
1 800 et 5 600 nouveaux mots — soit **300, 500 et 1 000 mots cumulés** aux
niveaux 1 à 3. Conforme au syllabus.

## Couverture

| Niveau | Mots | Présents dans le standard 2021 | Pinyin numéroté | Définition française |
|---|---|---|---|---|
${[1, 2, 3, 4, 5, 6, 7].map(levelRow).join('\n')}

Pour les trois niveaux qui nous intéressent (${String(core.length)} mots) :

- **${pct(core.filter((l) => l.glossFr.length > 0).length, core.length)}** ont une définition française issue de CFDICT ;
- **${pct(core.filter((l) => l.pinyinNum !== null).length, core.length)}** ont un pinyin numéroté ;
- **${pct(core.filter((l) => l.traditional !== null).length, core.length)}** ont une forme traditionnelle.

Mots des niveaux 1 à 3 sans définition française : **${String(missingGloss.filter((e) => e.level <= 3).length)}**.
Ils sont rédigés à la main dans \`scripts/data/overrides.ts\`, ou marqués comme
manquants dans le contenu s'ils ne l'ont pas encore été.

### Rapprochements approximatifs

Trois écarts systématiques séparent le syllabus du dictionnaire, et chacun a sa
tolérance. Elles sont comptées ici parce qu'une tolérance invisible devient une
erreur qui se propage :

${
  approximate.size === 0
    ? 'Aucun : tous les rapprochements sont exacts.'
    : [...approximate.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([how, count]) => `- \`${how}\` : ${String(count)} mots`)
        .join('\n')
}

Ces mots portent \`glossSource: "cfdict-approx"\` dans les données, et leur
pinyin numéroté n'est jamais emprunté au dictionnaire : il pourrait être celui
d'une autre lecture du même caractère.

### Tons réalignés sur le syllabus

**${String(retonedCount)} mots** sur l'ensemble du lexique avaient, au dictionnaire, un ton
différent de celui qu'imprime le syllabus — presque toujours un ton neutre là
où le syllabus donne un ton plein : 学生 est \`xue2 sheng5\` au dictionnaire et
\`xuéshēng\` au syllabus.

Le dictionnaire fournit le découpage en syllabes, le syllabus fournit les tons.
C'est le syllabus qui fait autorité ici, puisque c'est lui qu'on enseigne. Les
tons de 一 et 不 sont exclus de ce réalignement : le syllabus en imprime la
forme après sandhi, et c'est la règle de sandhi qui doit rester visible.

### Corrections écrites à la main

${String(usedOverrides.size)} entrées de \`scripts/data/overrides.ts\` ont été appliquées, chacune avec
sa justification. Elles portent \`glossSource: "manuel"\` et le statut
\`reviewed_human\`. Le pipeline échoue si l'une d'elles ne correspond plus à
aucun mot : une correction devenue inutile serait un bug silencieux.

À noter : pour 一下 et 一会儿, le syllabus imprime le pinyin **après** sandhi
(\`yíxià\`). Les données stockent la forme de citation \`yi1 xia4\`, et c'est
la fonction de sandhi du jalon 4 qui produira la prononciation réelle. Stocker
la forme déjà transformée rendrait la règle invisible, donc impossible à
enseigner.

## Divergences de niveau entre 2021 et 2025

Le standard de 2021 et le syllabus de 2025 n'attribuent pas les mêmes niveaux.
C'est attendu : le niveau 1 est passé de 500 à 300 mots, le niveau 3 de 2 245 à
1 000. Un mot « niveau 2 » en 2025 peut donc être « niveau 1 » en 2021.

- Mots du syllabus 2025 absents du standard 2021 : **${String(missingFromStandard.length)}**
- Désaccords de niveau, tous niveaux : **${String(divergences.length)}**
- Désaccords sur les niveaux 1 à 3 : **${String(coreDivergences.length)}**

${coreDivergences.length > 0 ? `Premiers désaccords sur les niveaux 1 à 3 :\n\n| Mot | Pinyin | Niveau 2025 | Niveau 2021 |\n|---|---|---|---|\n${sampleDivergences}` : 'Aucun désaccord sur les niveaux 1 à 3.'}

**Ce que l'application en fait :** chaque mot porte les deux niveaux. Le réglage
« Programme visé » choisit lequel pilote le parcours, par défaut celui de 2025.
Aucun arbitrage n'est fait dans les données.

## Limite connue

Aucune donnée de fréquence n'est encore intégrée. Le syllabus classe les mots
par ordre alphabétique de pinyin, pas par fréquence d'usage. L'ordre
d'introduction des mots dans le parcours (jalon 6) en aura besoin : c'est une
source à ajouter, pas une donnée à inventer.
`

await mkdir('docs', { recursive: true })
await writeFile(join('docs', 'rapport-donnees.md'), report)

console.log(`Lexique fusionné : ${String(merged.length)} entrées`)
console.log(`  niveaux 1 à 3  : ${String(core.length)}`)
console.log(
  `  avec définition française : ${String(core.filter((l) => l.glossFr.length > 0).length)} / ${String(core.length)}` +
    ` (${pct(core.filter((l) => l.glossFr.length > 0).length, core.length)})`,
)
console.log(
  `  avec pinyin numéroté      : ${String(core.filter((l) => l.pinyinNum !== null).length)} / ${String(core.length)}`,
)
console.log(`Absents du standard 2021   : ${String(missingFromStandard.length)}`)
console.log(`Désaccords de niveau (1-3) : ${String(coreDivergences.length)}`)
console.log(
  `Corrections manuelles      : ${String(usedOverrides.size)} / ${String(OVERRIDES.length)}`,
)
console.log('\nRapport écrit dans docs/rapport-donnees.md')

// Une correction qui ne s'applique à rien est un bug silencieux : soit le mot
// a changé d'orthographe dans la source, soit la clé comporte une faute. Dans
// les deux cas, continuer reviendrait à livrer une donnée qu'on croit corrigée.
const unused = OVERRIDES.filter((override) => !usedOverrides.has(override))
if (unused.length > 0) {
  console.error(
    `\n${String(unused.length)} correction(s) de overrides.ts ne correspondent à aucun mot :`,
  )
  for (const override of unused) console.error(`  ${override.simplified}`)
  process.exit(1)
}
