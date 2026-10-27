/**
 * Étape 8 — Fiches de grammaire : vérification et découpage.
 *
 * Mêmes garanties que pour les textes et les dialogues : chaque phrase
 * d'exemple est découpée avec notre lexique et refusée si elle emploie un mot
 * au-dessus du niveau de la fiche.
 *
 * Portée exacte de la vérification, parce qu'elle a une limite assumée :
 * elle couvre les **exemples** et la **phrase à remettre en ordre**, pas le
 * chinois cité dans le texte explicatif. Ce dernier contient volontairement
 * des formes fautives (« 他比我很高 est faux »), qu'un contrôle de niveau
 * rejetterait à tort. Le prix à payer est que ces citations ne sont vérifiées
 * que par la relecture.
 *
 * S'y ajoutent des contrôles de structure propres à l'exercice de remise en
 * ordre : un ordre alternatif qui ne serait pas une permutation exacte des
 * morceaux rendrait l'exercice insoluble.
 */
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { NIVEAU_1 } from './grammaire/niveau1.ts'
import { NIVEAU_2 } from './grammaire/niveau2.ts'
import { NIVEAU_3 } from './grammaire/niveau3.ts'
import type { PointSource } from './grammaire/types.ts'
import { loadVocabulaire, reportViolations, type OutToken } from './lib/vocabulaire.ts'
import { OUT_DIR } from './sources.ts'

const DIR = join(OUT_DIR, 'grammaire')
const NIVEAUX: readonly (readonly PointSource[])[] = [NIVEAU_1, NIVEAU_2, NIVEAU_3]

const vocabulaire = await loadVocabulaire()
const problemes: string[] = []

/** Signature d'un multiensemble de morceaux, pour comparer deux ordres. */
function signature(morceaux: readonly string[]): string {
  return [...morceaux].sort().join('\u0000')
}

function verifierStructure(point: PointSource, attendu: number): void {
  const ou = `${point.id}`

  if (point.level !== attendu) {
    problemes.push(`${ou} : déclaré niveau ${String(point.level)} dans la liste du niveau ${String(attendu)}`)
  }
  if (point.exemples.length < 2) {
    problemes.push(`${ou} : moins de deux exemples`)
  }
  if (point.explication.length === 0) {
    problemes.push(`${ou} : explication vide`)
  }
  // Moins de trois morceaux, et il n'y a plus d'exercice : deux morceaux se
  // remettent en ordre au hasard une fois sur deux.
  if (point.ordre.length < 3) {
    problemes.push(`${ou} : la phrase à remettre en ordre a moins de trois morceaux`)
  }

  const canonique = signature(point.ordre)
  const vus = new Set<string>([point.ordre.join('')])

  for (const autre of point.ordreAussi ?? []) {
    if (signature(autre) !== canonique) {
      problemes.push(
        `${ou} : l’ordre « ${autre.join('')} » n’est pas une permutation des morceaux`,
      )
      continue
    }
    const assemble = autre.join('')
    if (vus.has(assemble)) {
      problemes.push(`${ou} : l’ordre « ${assemble} » est proposé deux fois`)
    }
    vus.add(assemble)
  }
}

await rm(DIR, { recursive: true, force: true })
await mkdir(DIR, { recursive: true })

interface Resume {
  id: string
  level: number
  categorie: string
  titre: string
  markers: readonly string[]
  resume: string
}

const resumes: Resume[] = []
const ids = new Set<string>()

for (const [index, points] of NIVEAUX.entries()) {
  const level = index + 1
  const sortie = []

  for (const point of points) {
    if (ids.has(point.id)) problemes.push(`${point.id} : identifiant en double`)
    ids.add(point.id)
    verifierStructure(point, level)

    const proper = new Set(point.proper ?? [])

    const exemples = point.exemples.map((exemple) => ({
      fr: exemple.fr,
      tokens: vocabulaire.checkAndSegment(exemple.zh, point.level, proper, point.id)
        .tokens,
    }))

    // Chaque morceau est vérifié séparément : un découpage qui couperait un
    // mot en deux produirait ici une moitié inconnue, donc une violation.
    const morceaux = point.ordre.map((morceau): { text: string; tokens: OutToken[] } => ({
      text: morceau,
      tokens: vocabulaire.checkAndSegment(
        morceau,
        point.level,
        proper,
        `${point.id}, morceau « ${morceau} »`,
      ).tokens,
    }))

    const phrase = point.ordre.join('')
    const acceptes = [phrase, ...(point.ordreAussi ?? []).map((autre) => autre.join(''))]

    sortie.push({
      id: point.id,
      level: point.level,
      categorie: point.categorie,
      titre: point.titre,
      markers: point.markers,
      resume: point.resume,
      explication: point.explication,
      piege: point.piege,
      exemples,
      ordre: {
        morceaux,
        fr: point.ordreFr,
        acceptes,
        tokens: vocabulaire.checkAndSegment(
          phrase,
          point.level,
          proper,
          `${point.id}, phrase à reconstituer`,
        ).tokens,
      },
    })

    resumes.push({
      id: point.id,
      level: point.level,
      categorie: point.categorie,
      titre: point.titre,
      markers: point.markers,
      resume: point.resume,
    })
  }

  await writeFile(
    join(DIR, `niveau-${String(level)}.json`),
    `${JSON.stringify(
      {
        format: 'mandarine-grammaire-niveau',
        version: 1,
        generatedAt: new Date().toISOString(),
        level,
        contentStatus: 'auto_checked',
        count: sortie.length,
        points: sortie,
      },
      null,
      1,
    )}\n`,
  )

  console.log(`  HSK ${String(level)} : ${String(sortie.length)} points de grammaire`)
}

await writeFile(
  join(DIR, 'index.json'),
  `${JSON.stringify(
    {
      format: 'mandarine-grammaire',
      version: 1,
      generatedAt: new Date().toISOString(),
      count: resumes.length,
      contentStatus: 'auto_checked',
      points: resumes,
    },
    null,
    1,
  )}\n`,
)

if (problemes.length > 0) {
  console.error(`\n${String(problemes.length)} problème(s) de structure :`)
  for (const probleme of problemes) console.error(`  ${probleme}`)
  process.exit(1)
}

reportViolations(vocabulaire.violations)

console.log(`\n${String(resumes.length)} points de grammaire écrits dans ${DIR}/`)
