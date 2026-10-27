import type {
  EchangeSource,
  MotSource,
  PassageSource,
  PhraseSource,
  Vivier,
} from '@/domain/examen/generation'
import type { Resultat } from '@/domain/examen/notation'
import { uuidv7 } from '@/domain/ids'
import { loadLevel } from './content'
import { getDb } from './db'
import { loadDialogue, loadDialoguesIndex, tokensToText } from './dialogues'
import { loadGrammaireNiveau } from './grammaire'
import { marquerARevoir } from './points'
import { addPriorities } from './priorites'
import { loadTexte, loadTextesIndex } from './textes'
import type { ExamResultRecord, Timestamp } from './types'

/**
 * Matière des examens blancs, et mémoire des résultats.
 *
 * Aucun item n'est écrit à la main : le vivier est assemblé depuis le contenu
 * déjà vérifié — vocabulaire du syllabus, exemples de grammaire, tours de
 * dialogue, paragraphes de lecture. C'est ce qui permet de produire des
 * examens en nombre sans reproduire un sujet officiel, qui est protégé.
 */

/** Charge tout ce qui sert à fabriquer un examen jusqu'au niveau demandé. */
export async function construireVivier(level: number): Promise<Vivier> {
  const niveaux = Array.from({ length: level }, (_, index) => index + 1)

  const [contenus, grammaires, textesIndex, dialoguesIndex] = await Promise.all([
    Promise.all(niveaux.map(async (n) => loadLevel(n))),
    Promise.all(niveaux.map(async (n) => loadGrammaireNiveau(n))),
    loadTextesIndex(),
    loadDialoguesIndex(),
  ])

  const mots: MotSource[] = contenus.flatMap((contenu) =>
    contenu.lexemes.map((lexeme) => ({
      id: lexeme.id,
      simplified: lexeme.simplified,
      pinyinNum: lexeme.pinyinNum,
      glossFr: lexeme.glossFr,
      level: lexeme.hsk2025,
    })),
  )

  const phrases: PhraseSource[] = grammaires.flatMap((fichier) =>
    fichier.points.flatMap((point) =>
      point.exemples.map((exemple, index): PhraseSource => ({
        id: `${point.id}#${String(index)}`,
        level: point.level,
        zh: tokensToText(exemple.tokens),
        fr: exemple.fr,
        tokens: exemple.tokens,
        pointId: point.id,
        markers: point.markers,
      })),
    ),
  )

  const marqueurs = [
    ...new Set(
      grammaires.flatMap((fichier) =>
        fichier.points.flatMap((point) => [...point.markers]),
      ),
    ),
  ]

  // Les textes et les dialogues sont chargés en entier : ils sont peu
  // nombreux, déjà en cache du service worker, et on a besoin de l'ensemble
  // pour que les distracteurs varient d'un examen à l'autre.
  const textes = await Promise.all(
    textesIndex.textes
      .filter((resume) => resume.level <= level)
      .map(async (resume) => loadTexte(resume.id)),
  )

  const passages: PassageSource[] = textes.flatMap((texte) =>
    texte.paragraphs.map((paragraphe, index): PassageSource => ({
      id: `${texte.id}#${String(index)}`,
      level: texte.level,
      texteId: texte.id,
      fr: paragraphe.fr,
      tokens: paragraphe.tokens,
    })),
  )

  const dialogues = await Promise.all(
    dialoguesIndex.dialogues
      .filter((resume) => resume.level <= level)
      .map(async (resume) => loadDialogue(resume.id)),
  )

  const echanges: EchangeSource[] = dialogues.flatMap((dialogue) =>
    dialogue.nodes.flatMap((noeud): EchangeSource[] => {
      const phrase = (
        suffixe: string,
        tokens: readonly { text: string; lexemeId: string | null }[],
        fr: string,
      ): PhraseSource => ({
        id: `${dialogue.id}/${noeud.id}/${suffixe}`,
        level: dialogue.level,
        zh: tokensToText(tokens),
        fr,
        tokens,
        pointId: null,
        markers: [],
      })

      const juste = noeud.repliques.find((replique) => replique.qualite === 'juste')
      // Un tour sans réponse juste ne peut pas faire d'item. La génération du
      // contenu l'interdit déjà ; ce repli protège d'un fichier plus ancien.
      if (juste === undefined) return []

      return [
        {
          id: `${dialogue.id}/${noeud.id}`,
          level: dialogue.level,
          amorce: phrase('amorce', noeud.tokens, noeud.fr),
          bonne: phrase('juste', juste.tokens, juste.fr),
          mauvaises: noeud.repliques
            .filter((replique) => replique.qualite !== 'juste')
            .map((replique, index) =>
              phrase(`autre-${String(index)}`, replique.tokens, replique.fr),
            ),
        },
      ]
    }),
  )

  return { mots, phrases, echanges, passages, marqueurs }
}

export async function listerResultats(): Promise<ExamResultRecord[]> {
  const db = await getDb()
  const resultats = await db.getAll('exam_result')
  return resultats.sort((a, b) => b.termineA.localeCompare(a.termineA))
}

/**
 * Enregistre un examen passé, et en tire les conséquences.
 *
 * Trois écritures, parce que le cahier des charges demande que les erreurs
 * alimentent les révisions :
 *
 *  - le résultat lui-même, en ajout seul ;
 *  - les mots ratés passent en tête de file de révision, par le même
 *    mécanisme que « ajouter aux révisions » depuis un texte ;
 *  - les points de grammaire en échec sont marqués « à revoir ».
 *
 * Le résultat est écrit d'abord et dans sa propre transaction : si la mise en
 * file échouait, mieux vaut un examen enregistré sans ses conséquences que
 * l'inverse. Un examen passé est un fait, les conséquences se rattrapent.
 */
export async function enregistrerResultat(
  resultat: Resultat,
  commenceA: Timestamp,
): Promise<ExamResultRecord> {
  const record: ExamResultRecord = {
    id: uuidv7(new Date(resultat.termineA).getTime()),
    examenId: resultat.examenId,
    seed: resultat.seed,
    level: resultat.level,
    longueur: resultat.longueur,
    commenceA,
    termineA: resultat.termineA,
    posees: resultat.posees,
    justes: resultat.justes,
    pourcentage: resultat.pourcentage,
    reussi: resultat.reussi,
    sections: resultat.sections.map((score) => ({
      section: score.section,
      posees: score.posees,
      justes: score.justes,
    })),
    pointsFaibles: resultat.pointsFaibles.map((faible) => ({
      pointId: faible.pointId,
      rates: faible.rates,
      poses: faible.poses,
    })),
    createdAt: resultat.termineA,
  }

  const db = await getDb()
  await db.put('exam_result', record)

  await addPriorities(resultat.motsRates)

  await marquerARevoir(
    resultat.pointsFaibles.map((faible) => faible.pointId),
    resultat.termineA,
  )

  return record
}
