/**
 * Étape 7 — Dialogues guidés : vérification et découpage.
 *
 * Mêmes garanties que pour les textes de lecture : chaque phrase est découpée
 * avec notre lexique et vérifiée contre le vocabulaire du niveau. Le script
 * échoue si un seul mot dépasse.
 *
 * S'y ajoutent des vérifications de structure, parce qu'un arbre de dialogue
 * casse plus facilement qu'un texte : un `next` qui pointe vers un nœud
 * inexistant bloquerait l'utilisateur au milieu de l'échange.
 */
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { DIALOGUES, type ScenarioSource } from './dialogues.ts'
import { loadVocabulaire, reportViolations } from './lib/vocabulaire.ts'
import { OUT_DIR } from './sources.ts'

const DIR = join(OUT_DIR, 'dialogues')

const vocabulaire = await loadVocabulaire()
const problemesDeStructure: string[] = []

function verifierStructure(scenario: ScenarioSource): void {
  const ids = new Set(scenario.nodes.map((node) => node.id))

  if (!ids.has(scenario.start)) {
    problemesDeStructure.push(`${scenario.id} : le nœud de départ ${scenario.start} n’existe pas`)
  }

  const atteints = new Set<string>([scenario.start])
  for (const node of scenario.nodes) {
    if (node.repliques.length === 0) {
      problemesDeStructure.push(`${scenario.id}/${node.id} : aucune réponse possible`)
    }
    for (const replique of node.repliques) {
      if (replique.next === null) continue
      if (!ids.has(replique.next)) {
        problemesDeStructure.push(
          `${scenario.id}/${node.id} : renvoie vers ${replique.next}, qui n’existe pas`,
        )
      } else {
        atteints.add(replique.next)
      }
    }
    // Chaque tour doit offrir au moins une réponse juste, sinon l'exercice
    // devient un piège.
    if (!node.repliques.some((replique) => replique.qualite === 'juste')) {
      problemesDeStructure.push(`${scenario.id}/${node.id} : aucune réponse juste proposée`)
    }
    // Une note sans défaut, ou un défaut sans note, laisse le bilan muet.
    for (const replique of node.repliques) {
      if (replique.qualite !== 'juste' && replique.note === undefined) {
        problemesDeStructure.push(
          `${scenario.id}/${node.id} : « ${replique.zh} » est signalée comme ${replique.qualite} sans explication`,
        )
      }
    }
  }

  for (const node of scenario.nodes) {
    if (!atteints.has(node.id)) {
      problemesDeStructure.push(`${scenario.id}/${node.id} : nœud inatteignable`)
    }
  }
}

await rm(DIR, { recursive: true, force: true })
await mkdir(DIR, { recursive: true })

const summaries: {
  id: string
  level: number
  titleZh: string
  titleFr: string
  role: string
  situation: string
  unit: string
  turns: number
}[] = []

for (const scenario of DIALOGUES) {
  verifierStructure(scenario)
  const proper = new Set(scenario.proper ?? [])

  const nodes = scenario.nodes.map((node) => ({
    id: node.id,
    fr: node.fr,
    tokens: vocabulaire.checkAndSegment(
      node.zh,
      scenario.level,
      proper,
      `${scenario.id}/${node.id}`,
    ).tokens,
    repliques: node.repliques.map((replique) => ({
      fr: replique.fr,
      qualite: replique.qualite,
      note: replique.note ?? null,
      next: replique.next,
      tokens: vocabulaire.checkAndSegment(
        replique.zh,
        scenario.level,
        proper,
        `${scenario.id}/${node.id}, réponse`,
      ).tokens,
    })),
  }))

  await writeFile(
    join(DIR, `${scenario.id}.json`),
    `${JSON.stringify(
      {
        format: 'mandarine-dialogue',
        version: 1,
        generatedAt: new Date().toISOString(),
        id: scenario.id,
        level: scenario.level,
        titleZh: scenario.titleZh,
        titleFr: scenario.titleFr,
        role: scenario.role,
        situation: scenario.situation,
        unit: scenario.unit,
        contentStatus: 'auto_checked',
        start: scenario.start,
        nodes,
      },
      null,
      1,
    )}\n`,
  )

  summaries.push({
    id: scenario.id,
    level: scenario.level,
    titleZh: scenario.titleZh,
    titleFr: scenario.titleFr,
    role: scenario.role,
    situation: scenario.situation,
    unit: scenario.unit,
    turns: scenario.nodes.length,
  })
}

await writeFile(
  join(DIR, 'index.json'),
  `${JSON.stringify(
    {
      format: 'mandarine-dialogues',
      version: 1,
      generatedAt: new Date().toISOString(),
      count: summaries.length,
      dialogues: summaries,
    },
    null,
    1,
  )}\n`,
)

for (const level of [1, 2, 3]) {
  const slice = summaries.filter((scenario) => scenario.level === level)
  if (slice.length === 0) continue
  console.log(
    `  HSK ${String(level)} : ${String(slice.length)} dialogues,` +
      ` ${String(slice.reduce((sum, s) => sum + s.turns, 0))} tours`,
  )
}

if (problemesDeStructure.length > 0) {
  console.error(`\n${String(problemesDeStructure.length)} problème(s) de structure :`)
  for (const probleme of problemesDeStructure) console.error(`  ${probleme}`)
  process.exit(1)
}

reportViolations(vocabulaire.violations)

console.log(`\n${String(summaries.length)} dialogues écrits dans ${DIR}/`)
