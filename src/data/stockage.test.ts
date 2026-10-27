import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import type { Resultat } from '@/domain/examen/notation'
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  BackupError,
  exportBackup,
  importBackup,
  parseBackup,
} from './backup'
import { getDb } from './db'
import { enregistrerResultat, listerResultats } from './examens'
import {
  computeGrammaireProgression,
  estCouvert,
  grammarStat,
  marquerARevoir,
  recordOrdre,
} from './points'
import { addPriorities, loadPriorities, togglePriority } from './priorites'
import type { CardRecord, DailyStatRecord } from './types'

/**
 * Couche de stockage, éprouvée sur une vraie base IndexedDB.
 *
 * Jusqu'ici, rien de tout cela n'était testé : les tests de composants
 * remplacent la couche de données par des simulacres, et les tests du domaine
 * ne la touchent pas. Or c'est ici que vit la progression, c'est-à-dire la
 * seule chose du projet qui ne se régénère pas.
 */

const MAINTENANT = '2026-03-01T10:00:00.000Z'

const CARTE: CardRecord = {
  id: 'lexeme:爱-ai4:zh_fr',
  targetKind: 'lexeme',
  targetId: '爱-ai4',
  skill: 'zh_fr',
  due: '2026-03-10T00:00:00.000Z',
  stability: 12.5,
  difficulty: 5.1,
  elapsedDays: 3,
  scheduledDays: 10,
  learningSteps: 0,
  reps: 4,
  lapses: 1,
  state: 2,
  lastReview: '2026-02-20T00:00:00.000Z',
  suspendedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-02-20T00:00:00.000Z',
  deletedAt: null,
}

const JOUR: DailyStatRecord = {
  day: '2026-02-20',
  activeMs: 900_000,
  reviews: 30,
  newCards: 5,
  listeningMs: 120_000,
  readingMs: 0,
  goalMet: true,
  updatedAt: '2026-02-20T00:00:00.000Z',
}

function resultat(partiel: Partial<Resultat> = {}): Resultat {
  return {
    examenId: 'examen-42',
    seed: 42,
    level: 3,
    longueur: 'court',
    termineA: MAINTENANT,
    parties: [],
    sections: [
      { section: 'ecoute', posees: 12, justes: 9, pourcentage: 75 },
      { section: 'lecture', posees: 12, justes: 6, pourcentage: 50 },
    ],
    posees: 24,
    justes: 15,
    sansReponse: 0,
    pourcentage: 63,
    reussi: true,
    pointsFaibles: [],
    motsRates: [],
    ...partiel,
  }
}

async function viderLaBase(): Promise<void> {
  const db = await getDb()
  for (const magasin of [...db.objectStoreNames]) {
    await db.clear(magasin)
  }
}

beforeEach(async () => {
  await viderLaBase()
})

describe('sauvegarde', () => {
  it('rend une progression identique après un aller-retour', async () => {
    const db = await getDb()
    await db.put('card', CARTE)
    await db.put('daily_stat', JOUR)
    await db.put('settings', { key: 'dailyGoalMin', value: 25 })
    await recordOrdre('le-accompli', true, MAINTENANT)
    await enregistrerResultat(resultat(), MAINTENANT)

    const avant = await exportBackup()
    await viderLaBase()
    const resume = await importBackup(JSON.parse(JSON.stringify(avant)))

    expect(resume.cards).toBe(1)
    expect(resume.days).toBe(1)
    expect(resume.examens).toBe(1)

    const apres = await exportBackup()
    expect(apres.cards).toEqual(avant.cards)
    expect(apres.dailyStats).toEqual(avant.dailyStats)
    expect(apres.settings).toEqual(avant.settings)
    expect(apres.examResults).toEqual(avant.examResults)
    expect(apres.grammarStats).toEqual(avant.grammarStats)
  })

  it('exporte les sections apparues en version 2', async () => {
    await recordOrdre('ba-objet', true, MAINTENANT)
    await enregistrerResultat(resultat(), MAINTENANT)

    const sauvegarde = await exportBackup()
    expect(sauvegarde.version).toBe(BACKUP_VERSION)
    expect(sauvegarde.grammarStats).toHaveLength(1)
    expect(sauvegarde.examResults).toHaveLength(1)
  })

  it('importe une sauvegarde de version 1 sans ses nouvelles sections', async () => {
    // Un fichier exporté avant le jalon 10 reste parfaitement valable pour
    // son époque : le refuser ferait perdre une progression réelle.
    const ancienne = {
      format: BACKUP_FORMAT,
      version: 1,
      exportedAt: MAINTENANT,
      settings: { dailyGoalMin: 15 },
      cards: [CARTE],
      reviewLog: [],
      dailyStats: [JOUR],
    }

    const resume = await importBackup(ancienne)
    expect(resume.cards).toBe(1)
    expect(resume.examens).toBe(0)

    const db = await getDb()
    expect(await db.count('card')).toBe(1)
    expect(await db.count('exam_result')).toBe(0)
    expect(await db.count('grammar_stat')).toBe(0)
  })

  it('remplace la progression au lieu de la fusionner', async () => {
    const db = await getDb()
    await db.put('card', CARTE)
    await db.put('card', { ...CARTE, id: 'lexeme:книга:zh_fr', targetId: 'autre' })

    await importBackup({
      format: BACKUP_FORMAT,
      version: BACKUP_VERSION,
      exportedAt: MAINTENANT,
      settings: {},
      cards: [CARTE],
      reviewLog: [],
      dailyStats: [],
      examResults: [],
      grammarStats: [],
    })

    expect(await db.count('card')).toBe(1)
  })

  it('refuse un fichier qui n’est pas une sauvegarde', () => {
    expect(() => parseBackup({ hello: 'world' })).toThrow(BackupError)
    expect(() => parseBackup('texte')).toThrow(BackupError)
  })

  it('refuse une sauvegarde plus récente que l’application', () => {
    expect(() =>
      parseBackup({
        format: BACKUP_FORMAT,
        version: BACKUP_VERSION + 1,
        settings: {},
        cards: [],
        reviewLog: [],
        dailyStats: [],
      }),
    ).toThrow(/plus récente/)
  })

  it('refuse une sauvegarde amputée d’une section', () => {
    expect(() =>
      parseBackup({
        format: BACKUP_FORMAT,
        version: 1,
        settings: {},
        cards: [],
        reviewLog: [],
      }),
    ).toThrow(/incomplète/)
  })
})

describe('points de grammaire', () => {
  it('compte les tentatives et les réussites', async () => {
    await recordOrdre('bi-comparaison', false, MAINTENANT)
    await recordOrdre('bi-comparaison', true, MAINTENANT)

    const stat = await grammarStat('bi-comparaison')
    expect(stat?.essais).toBe(2)
    expect(stat?.reussites).toBe(1)
    expect(estCouvert(stat)).toBe(true)
  })

  it('ne considère pas couvert un point jamais réussi', async () => {
    await recordOrdre('bei-passif', false, MAINTENANT)
    expect(estCouvert(await grammarStat('bei-passif'))).toBe(false)
  })

  it('garde la date de la première réussite', async () => {
    await recordOrdre('ba-objet', true, '2026-03-01T10:00:00.000Z')
    await recordOrdre('ba-objet', true, '2026-04-01T10:00:00.000Z')

    const stat = await grammarStat('ba-objet')
    expect(stat?.premiereReussiteA).toBe('2026-03-01T10:00:00.000Z')
    expect(stat?.dernierEssaiA).toBe('2026-04-01T10:00:00.000Z')
  })

  it('efface la marque « à revoir » dès que le point est réussi', async () => {
    await marquerARevoir(['trois-de'], MAINTENANT)
    expect((await grammarStat('trois-de'))?.aRevoirDepuis).toBe(MAINTENANT)

    await recordOrdre('trois-de', true, MAINTENANT)
    expect((await grammarStat('trois-de'))?.aRevoirDepuis).toBeNull()
  })

  it('ne pose pas la marque sur un simple échec d’entraînement', async () => {
    // Se tromper en s'entraînant est le fonctionnement normal de l'exercice.
    // Seul un examen blanc pose la marque.
    await recordOrdre('yue-yue', false, MAINTENANT)
    expect((await grammarStat('yue-yue'))?.aRevoirDepuis).toBeNull()
  })

  it('marque un point jamais travaillé sans inventer de réussite', async () => {
    await marquerARevoir(['cai-jiu'], MAINTENANT)
    const stat = await grammarStat('cai-jiu')
    expect(stat?.essais).toBe(0)
    expect(stat?.reussites).toBe(0)
    expect(estCouvert(stat)).toBe(false)
  })

  it('préserve les compteurs quand un examen remarque un point déjà travaillé', async () => {
    await recordOrdre('gen-yiyang', true, MAINTENANT)
    await marquerARevoir(['gen-yiyang'], MAINTENANT)

    const stat = await grammarStat('gen-yiyang')
    expect(stat?.reussites).toBe(1)
    expect(stat?.aRevoirDepuis).toBe(MAINTENANT)
  })

  it('n’écrit rien quand la liste à marquer est vide', async () => {
    await marquerARevoir([], MAINTENANT)
    const db = await getDb()
    expect(await db.count('grammar_stat')).toBe(0)
  })

  it('résume la progression', async () => {
    await recordOrdre('a', true, MAINTENANT)
    await recordOrdre('b', false, MAINTENANT)
    await marquerARevoir(['c'], MAINTENANT)

    const progression = await computeGrammaireProgression(48)
    expect(progression.couverts).toBe(1)
    expect(progression.total).toBe(48)
    expect(progression.aRevoir).toEqual(['c'])
  })
})

describe('file de priorité', () => {
  it('ajoute sans retirer', async () => {
    await togglePriority('mot-1')
    await addPriorities(['mot-2', 'mot-3'])
    expect([...(await loadPriorities())].sort()).toEqual(['mot-1', 'mot-2', 'mot-3'])
  })

  it('ne compte pas deux fois le même mot', async () => {
    await addPriorities(['mot-1', 'mot-1'])
    const ajoutes = await addPriorities(['mot-1'])
    expect(ajoutes).toBe(0)
    expect((await loadPriorities()).size).toBe(1)
  })

  it('accepte une liste vide', async () => {
    expect(await addPriorities([])).toBe(0)
  })
})

describe('résultats d’examen', () => {
  it('enregistre le résultat et ses conséquences', async () => {
    await enregistrerResultat(
      resultat({
        motsRates: ['爱-ai4', '书-shu1'],
        pointsFaibles: [{ pointId: 'ba-objet', rates: 2, poses: 3 }],
      }),
      '2026-03-01T09:30:00.000Z',
    )

    const [enregistre] = await listerResultats()
    expect(enregistre?.pourcentage).toBe(63)
    expect(enregistre?.commenceA).toBe('2026-03-01T09:30:00.000Z')
    expect(enregistre?.sections).toHaveLength(2)

    // Les erreurs alimentent les révisions : c'est un principe du cahier des
    // charges, pas un ornement.
    expect([...(await loadPriorities())].sort()).toEqual(['书-shu1', '爱-ai4'].sort())
    expect((await grammarStat('ba-objet'))?.aRevoirDepuis).toBe(MAINTENANT)
  })

  it('range les examens du plus récent au plus ancien', async () => {
    await enregistrerResultat(
      resultat({ examenId: 'vieux', termineA: '2026-01-01T10:00:00.000Z' }),
      '2026-01-01T09:00:00.000Z',
    )
    await enregistrerResultat(
      resultat({ examenId: 'recent', termineA: '2026-05-01T10:00:00.000Z' }),
      '2026-05-01T09:00:00.000Z',
    )

    const liste = await listerResultats()
    expect(liste.map((entree) => entree.examenId)).toEqual(['recent', 'vieux'])
  })

  it('n’ajoute rien à la file quand rien n’a été raté', async () => {
    await enregistrerResultat(resultat(), MAINTENANT)
    expect((await loadPriorities()).size).toBe(0)
  })
})
