import 'fake-indexeddb/auto'
import { beforeAll, describe, expect, it } from 'vitest'
import { DB_NAME, DB_VERSION, getDb } from './db'

/**
 * Migration de la base locale, de la version 1 à la version 2.
 *
 * C'est le code le plus risqué du projet : il s'exécute une seule fois, sur
 * la machine de l'utilisateur, sur la seule donnée qui ne se régénère pas. Un
 * test qui part d'une base vide ne prouverait rien, puisque la création
 * complète et la migration ne prennent pas le même chemin. Celui-ci fabrique
 * donc une vraie base de version 1, avec des données dedans, avant d'ouvrir
 * l'application.
 */

const CARTE_V1 = {
  id: 'lexeme:爱-ai4:zh_fr',
  targetKind: 'lexeme',
  targetId: '爱-ai4',
  skill: 'zh_fr',
  due: '2026-01-01T00:00:00.000Z',
  stability: 12.5,
  difficulty: 5.1,
  elapsedDays: 3,
  scheduledDays: 10,
  learningSteps: 0,
  reps: 4,
  lapses: 1,
  state: 2,
  lastReview: '2025-12-22T00:00:00.000Z',
  suspendedAt: null,
  createdAt: '2025-12-01T00:00:00.000Z',
  updatedAt: '2025-12-22T00:00:00.000Z',
  deletedAt: null,
}

const JOUR_V1 = {
  day: '2025-12-22',
  activeMs: 900_000,
  reviews: 30,
  newCards: 5,
  listeningMs: 120_000,
  readingMs: 0,
  goalMet: true,
  updatedAt: '2025-12-22T00:00:00.000Z',
}

/** Recrée exactement le schéma de la version 1, tel qu'il était livré. */
function creerBaseV1(): Promise<void> {
  return new Promise((resolve, reject) => {
    const requete = indexedDB.open(DB_NAME, 1)

    requete.onupgradeneeded = () => {
      const db = requete.result
      db.createObjectStore('meta', { keyPath: 'key' })
      db.createObjectStore('settings', { keyPath: 'key' })

      const cards = db.createObjectStore('card', { keyPath: 'id' })
      cards.createIndex('by-due', 'due')
      cards.createIndex('by-target', ['targetKind', 'targetId', 'skill'], {
        unique: true,
      })

      const log = db.createObjectStore('review_log', { keyPath: 'id' })
      log.createIndex('by-card', 'cardId')

      db.createObjectStore('daily_stat', { keyPath: 'day' })
    }

    requete.onerror = () => {
      reject(new Error('ouverture de la base v1 impossible'))
    }

    requete.onsuccess = () => {
      const db = requete.result
      const tx = db.transaction(['card', 'daily_stat', 'settings'], 'readwrite')
      tx.objectStore('card').put(CARTE_V1)
      tx.objectStore('daily_stat').put(JOUR_V1)
      tx.objectStore('settings').put({ key: 'dailyGoalMin', value: 20 })
      tx.oncomplete = () => {
        db.close()
        resolve()
      }
      tx.onerror = () => {
        reject(new Error('écriture dans la base v1 impossible'))
      }
    }
  })
}

beforeAll(async () => {
  await creerBaseV1()
})

describe('migration de la version 1 vers la version 2', () => {
  it('ouvre la base à la version attendue', async () => {
    const db = await getDb()
    expect(db.version).toBe(DB_VERSION)
    expect(DB_VERSION).toBe(2)
  })

  it('ajoute les magasins de la grammaire et des examens', async () => {
    const db = await getDb()
    expect([...db.objectStoreNames]).toContain('exam_result')
    expect([...db.objectStoreNames]).toContain('grammar_stat')
  })

  it('garde tous les magasins de la version 1', async () => {
    const db = await getDb()
    for (const nom of ['meta', 'settings', 'card', 'review_log', 'daily_stat']) {
      expect([...db.objectStoreNames], nom).toContain(nom)
    }
  })

  it('ne touche à aucune donnée existante', async () => {
    // La raison d'être de cette migration additive : une progression perdue
    // ne se reconstitue pas.
    const db = await getDb()
    const carte = await db.get('card', CARTE_V1.id)
    expect(carte).toEqual(CARTE_V1)

    const jour = await db.get('daily_stat', JOUR_V1.day)
    expect(jour).toEqual(JOUR_V1)

    const reglage = await db.get('settings', 'dailyGoalMin')
    expect(reglage?.value).toBe(20)
  })

  it('conserve les index de la version 1', async () => {
    // Un index perdu ne casse rien visiblement : les requêtes se mettent
    // simplement à échouer plus tard, sur une base déjà migrée.
    const db = await getDb()
    const tx = db.transaction('card')
    const store = tx.objectStore('card')
    expect([...store.indexNames].sort()).toEqual(['by-due', 'by-target'])
    await tx.done
  })

  it('crée un index de date sur les résultats d’examen', async () => {
    const db = await getDb()
    const tx = db.transaction('exam_result')
    expect([...tx.objectStore('exam_result').indexNames]).toContain('by-date')
    await tx.done
  })

  it('laisse les nouveaux magasins vides', async () => {
    const db = await getDb()
    expect(await db.count('exam_result')).toBe(0)
    expect(await db.count('grammar_stat')).toBe(0)
  })

  it('accepte une écriture dans un magasin fraîchement créé', async () => {
    const db = await getDb()
    await db.put('grammar_stat', {
      pointId: 'le-accompli',
      essais: 1,
      reussites: 1,
      premiereReussiteA: '2026-03-01T10:00:00.000Z',
      dernierEssaiA: '2026-03-01T10:00:00.000Z',
      aRevoirDepuis: null,
      updatedAt: '2026-03-01T10:00:00.000Z',
    })
    expect((await db.get('grammar_stat', 'le-accompli'))?.reussites).toBe(1)
  })
})
