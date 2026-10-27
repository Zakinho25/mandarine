import { getDb } from './db'

/**
 * Mots que l'utilisateur veut apprendre en priorité.
 *
 * Toutes les cartes existent dès le départ, à l'état neuf ; c'est le plafond
 * quotidien qui décide lesquelles sont introduites. « Ajouter aux révisions »
 * depuis un texte ne peut donc pas créer une carte : ce que ça fait, c'est
 * mettre le mot **en tête de file**, pour qu'il soit introduit à la prochaine
 * session plutôt que dans trois semaines.
 *
 * Stocké dans le magasin `meta`, qui existe depuis la version 1 du schéma :
 * aucune migration.
 */

const KEY = 'priorites'

export async function loadPriorities(): Promise<Set<string>> {
  const db = await getDb()
  const row = await db.get('meta', KEY)
  const value = row?.value
  return new Set(Array.isArray(value) ? (value as string[]) : [])
}

async function save(ids: Set<string>): Promise<void> {
  const db = await getDb()
  await db.put('meta', { key: KEY, value: [...ids] })
}

export async function togglePriority(lexemeId: string): Promise<boolean> {
  const ids = await loadPriorities()
  const added = !ids.has(lexemeId)
  if (added) ids.add(lexemeId)
  else ids.delete(lexemeId)
  await save(ids)
  return added
}

/**
 * Ajoute des mots à la file, sans jamais en retirer.
 *
 * Sert aux examens blancs : un mot raté passe en tête, et un mot déjà là y
 * reste. L'opération est idempotente, pour qu'un même examen rejoué ne
 * gonfle pas la file.
 */
export async function addPriorities(lexemeIds: readonly string[]): Promise<number> {
  if (lexemeIds.length === 0) return 0
  const ids = await loadPriorities()
  const avant = ids.size
  for (const lexemeId of lexemeIds) ids.add(lexemeId)
  if (ids.size === avant) return 0
  await save(ids)
  return ids.size - avant
}

export async function clearPriority(lexemeId: string): Promise<void> {
  const ids = await loadPriorities()
  if (!ids.delete(lexemeId)) return
  await save(ids)
}
