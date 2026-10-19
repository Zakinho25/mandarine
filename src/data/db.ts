import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type {
  CardRecord,
  CardSkill,
  CardTargetKind,
  DailyStatRecord,
  ReviewLogRecord,
} from './types'

export const DB_NAME = 'mandarine'
export const DB_VERSION = 1

interface StoredValue {
  readonly key: string
  readonly value: unknown
}

export interface MandarineDB extends DBSchema {
  /** Version du schéma, du contenu, dates de sauvegarde. */
  meta: { key: string; value: StoredValue }
  /** Préférences, une ligne par réglage pour tolérer les ajouts futurs. */
  settings: { key: string; value: StoredValue }
  card: {
    key: string
    value: CardRecord
    indexes: {
      'by-due': string
      'by-target': [CardTargetKind, string, CardSkill]
    }
  }
  review_log: {
    key: string
    value: ReviewLogRecord
    indexes: { 'by-card': string }
  }
  daily_stat: { key: string; value: DailyStatRecord }
}

let connection: Promise<IDBPDatabase<MandarineDB>> | undefined

/**
 * Ouvre la base locale, en la créant au premier lancement.
 *
 * Tous les magasins sont créés dès la version 1, y compris ceux que seuls les
 * jalons suivants utiliseront : une migration IndexedDB coûte plus cher qu'un
 * magasin vide.
 */
export function getDb(): Promise<IDBPDatabase<MandarineDB>> {
  connection ??= openDB<MandarineDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore('meta', { keyPath: 'key' })
      db.createObjectStore('settings', { keyPath: 'key' })

      const cards = db.createObjectStore('card', { keyPath: 'id' })
      cards.createIndex('by-due', 'due')
      // Une seule carte par couple (cible, compétence) : c'est l'unicité qui
      // garantit qu'on n'étudie pas deux fois la même chose.
      cards.createIndex('by-target', ['targetKind', 'targetId', 'skill'], {
        unique: true,
      })

      const log = db.createObjectStore('review_log', { keyPath: 'id' })
      log.createIndex('by-card', 'cardId')

      db.createObjectStore('daily_stat', { keyPath: 'day' })
    },
  })
  return connection
}

/**
 * Demande au navigateur de ne pas effacer nos données.
 *
 * Nécessaire parce que Safari purge le stockage d'un site **non installé**
 * après sept jours sans visite. Une fois l'application ajoutée à l'écran
 * d'accueil, les données deviennent persistantes. Safari ignore cet appel —
 * d'où la sauvegarde exportable, qui reste le vrai filet de sécurité.
 *
 * Renvoie `true` si le navigateur confirme la persistance.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  const storage = navigator.storage
  if (typeof storage?.persist !== 'function') return false
  try {
    return await storage.persist()
  } catch {
    return false
  }
}

/** Indique si le navigateur garantit la persistance du stockage. */
export async function isStoragePersistent(): Promise<boolean> {
  const storage = navigator.storage
  if (typeof storage?.persisted !== 'function') return false
  try {
    return await storage.persisted()
  } catch {
    return false
  }
}
