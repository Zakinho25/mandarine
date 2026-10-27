import { getDb } from './db'
import type { GrammarStatRecord, Timestamp } from './types'

/**
 * Travail accompli sur les points de grammaire.
 *
 * Séparé de `grammaire.ts`, qui ne fait que charger le contenu : les fiches
 * sont du contenu statique régénérable, ce fichier touche à la progression,
 * qui ne se régénère pas. La séparation permet aussi aux tests du contenu de
 * valider les fiches sans entraîner IndexedDB avec elles.
 */

export async function allGrammarStats(): Promise<GrammarStatRecord[]> {
  const db = await getDb()
  return db.getAll('grammar_stat')
}

export async function grammarStat(
  pointId: string,
): Promise<GrammarStatRecord | undefined> {
  const db = await getDb()
  return db.get('grammar_stat', pointId)
}

/** Un point est couvert dès que son exercice a été réussi une fois. */
export function estCouvert(stat: GrammarStatRecord | undefined): boolean {
  return stat !== undefined && stat.reussites > 0
}

/**
 * Consigne une tentative de remise en ordre.
 *
 * Une réussite efface le drapeau « à revoir » posé par un examen blanc : le
 * point a été retravaillé, le signal a fait son travail. Un échec ne le pose
 * pas — se tromper en s'entraînant est le fonctionnement normal de
 * l'exercice, pas un symptôme.
 */
export async function recordOrdre(
  pointId: string,
  reussi: boolean,
  now: Timestamp = new Date().toISOString(),
): Promise<GrammarStatRecord> {
  const db = await getDb()
  const tx = db.transaction('grammar_stat', 'readwrite')
  const store = tx.objectStore('grammar_stat')
  const precedent = await store.get(pointId)

  const stat: GrammarStatRecord = {
    pointId,
    essais: (precedent?.essais ?? 0) + 1,
    reussites: (precedent?.reussites ?? 0) + (reussi ? 1 : 0),
    premiereReussiteA: precedent?.premiereReussiteA ?? (reussi ? now : null),
    dernierEssaiA: now,
    aRevoirDepuis: reussi ? null : (precedent?.aRevoirDepuis ?? null),
    updatedAt: now,
  }

  await store.put(stat)
  await tx.done
  return stat
}

/**
 * Marque des points comme « à revoir » après un examen blanc.
 *
 * C'est le seul endroit où ce drapeau est posé, et il vient toujours d'un
 * examen : une erreur dans un exercice d'entraînement n'a pas la même valeur
 * de signal qu'une erreur dans une épreuve chronométrée.
 */
export async function marquerARevoir(
  pointIds: readonly string[],
  now: Timestamp = new Date().toISOString(),
): Promise<void> {
  if (pointIds.length === 0) return
  const db = await getDb()
  const tx = db.transaction('grammar_stat', 'readwrite')
  const store = tx.objectStore('grammar_stat')

  for (const pointId of pointIds) {
    const precedent = await store.get(pointId)
    await store.put({
      pointId,
      essais: precedent?.essais ?? 0,
      reussites: precedent?.reussites ?? 0,
      premiereReussiteA: precedent?.premiereReussiteA ?? null,
      dernierEssaiA: precedent?.dernierEssaiA ?? now,
      aRevoirDepuis: now,
      updatedAt: now,
    })
  }
  await tx.done
}

export interface GrammaireProgression {
  readonly couverts: number
  readonly total: number
  readonly aRevoir: readonly string[]
}

export async function computeGrammaireProgression(
  total: number,
): Promise<GrammaireProgression> {
  const stats = await allGrammarStats()
  return {
    couverts: stats.filter((stat) => estCouvert(stat)).length,
    total,
    aRevoir: stats
      .filter((stat) => stat.aRevoirDepuis !== null)
      .map((stat) => stat.pointId),
  }
}
