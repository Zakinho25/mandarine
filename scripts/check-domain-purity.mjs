/**
 * Garde-fou d'architecture.
 *
 * `src/domain/` contient toute la logique pedagogique : planification des revisions,
 * sandhi tonal, conversion du pinyin, calcul de progression. Elle doit rester du
 * TypeScript pur, sans React, sans DOM, sans acces au stockage - c'est ce qui permet
 * de la tester en quelques millisecondes et de la prouver par des tests unitaires.
 *
 * Ce script echoue si un fichier de `src/domain/` importe quoi que ce soit d'autre
 * qu'un autre module du domaine. Il tourne dans la CI.
 */
import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

const DOMAIN = 'src/domain'
const IMPORT_RE = /^\s*(?:import|export)[\s\S]*?from\s+['"]([^'"]+)['"]/gm

/** Imports autorises : chemins relatifs restant dans le domaine, et `ts-fsrs`. */
const ALLOWED_BARE = new Set(['ts-fsrs'])

async function walk(dir) {
  const out = []
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...(await walk(path)))
    else if (/.tsx?$/.test(entry.name) && !entry.name.includes('.test.')) out.push(path)
  }
  return out
}

const violations = []

for (const file of await walk(DOMAIN)) {
  const source = await readFile(file, 'utf8')
  for (const match of source.matchAll(IMPORT_RE)) {
    const spec = match[1]
    const isRelative = spec.startsWith('.')
    if (isRelative) continue
    if (ALLOWED_BARE.has(spec)) continue
    if (spec.startsWith('node:')) {
      violations.push([file, spec, 'le domaine doit tourner dans le navigateur'])
      continue
    }
    violations.push([file, spec, 'import externe interdit dans src/domain'])
  }
}

if (violations.length > 0) {
  console.error('\nArchitecture : src/domain doit rester pur.\n')
  for (const [file, spec, why] of violations) {
    console.error(`  ${relative(process.cwd(), file)} importe "${spec}" - ${why}`)
  }
  console.error(
    '\nDeplace le code qui a besoin de React, du DOM ou du stockage vers' +
      ' src/features ou src/data.\n',
  )
  process.exit(1)
}

console.log('src/domain est pur.')
