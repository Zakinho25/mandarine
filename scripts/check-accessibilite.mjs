import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'

/**
 * Vérifications d'accessibilité qu'une relecture ne tient pas dans la durée.
 *
 * Elles sont mécaniques et portent sur une seule règle, celle qu'on oublie :
 * **du chinois affiché sans attribut `lang` est lu par un lecteur d'écran
 * avec la voix de l'interface.** 你好 passé à une voix française ne ressemble
 * à rien, et rien à l'écran ne le signale — c'est donc exactement le genre de
 * défaut qui survit à une relecture.
 *
 * La classe `hanzi` marque déjà tout le chinois de l'application. Ce script
 * exige que `lang` l'accompagne partout.
 */

const RACINE = 'src'
const MARQUEUR = /className=(?:"hanzi|\{`hanzi)/

async function fichiers(dossier) {
  const trouves = []
  for (const entree of await readdir(dossier, { withFileTypes: true })) {
    const chemin = join(dossier, entree.name)
    if (entree.isDirectory()) trouves.push(...(await fichiers(chemin)))
    else if (chemin.endsWith('.tsx') && !chemin.endsWith('.test.tsx')) {
      trouves.push(chemin)
    }
  }
  return trouves
}

const problemes = []
let verifies = 0

for (const chemin of await fichiers(RACINE)) {
  const lignes = (await readFile(chemin, 'utf8')).split('\n')

  for (const [index, ligne] of lignes.entries()) {
    if (!MARQUEUR.test(ligne)) continue
    verifies += 1

    // L'attribut peut être sur la même ligne ou juste au-dessus, selon la
    // mise en forme du JSX par Prettier.
    const voisinage = [lignes[index - 1] ?? '', ligne].join(' ')
    if (!/lang="zh-(Hans|Hant)"/.test(voisinage)) {
      problemes.push(
        `${chemin}:${String(index + 1)} : chinois affiché sans attribut lang`,
      )
    }
  }
}

if (problemes.length > 0) {
  console.error(`${String(problemes.length)} problème(s) d'accessibilité :\n`)
  for (const probleme of problemes) console.error(`  ${probleme}`)
  console.error(
    "\nAjoute lang=\"zh-Hans\" (ou zh-Hant pour du traditionnel) sur l'élément.",
  )
  console.error(
    "Sans lui, un lecteur d'écran prononce le chinois avec la voix de l'interface.",
  )
  process.exit(1)
}

console.log(`Accessibilité : ${String(verifies)} affichages de chinois, tous étiquetés.`)
