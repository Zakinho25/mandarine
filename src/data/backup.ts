import { getDb } from './db'
import type {
  CardRecord,
  DailyStatRecord,
  ExamResultRecord,
  GrammarStatRecord,
  ReviewLogRecord,
  Timestamp,
} from './types'

export const BACKUP_FORMAT = 'mandarine-sauvegarde'
export const BACKUP_VERSION = 2

export interface BackupFile {
  readonly format: typeof BACKUP_FORMAT
  readonly version: number
  readonly exportedAt: Timestamp
  readonly settings: Record<string, unknown>
  readonly cards: readonly CardRecord[]
  readonly reviewLog: readonly ReviewLogRecord[]
  readonly dailyStats: readonly DailyStatRecord[]
  /** Ajoutés en version 2 : absents d'une sauvegarde plus ancienne. */
  readonly examResults: readonly ExamResultRecord[]
  readonly grammarStats: readonly GrammarStatRecord[]
}

export class BackupError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BackupError'
  }
}

/**
 * Exporte toute la progression dans un objet sérialisable.
 *
 * C'est le filet de sécurité de l'application : le stockage d'un navigateur
 * n'est pas un lieu sûr. Safari peut purger les données d'un site non installé,
 * et un historique effacé emporte tout. Le contenu pédagogique, lui, se
 * retélécharge — il n'est donc pas sauvegardé ici.
 */
export async function exportBackup(): Promise<BackupFile> {
  const db = await getDb()
  const [settingRows, cards, reviewLog, dailyStats, examResults, grammarStats] =
    await Promise.all([
      db.getAll('settings'),
      db.getAll('card'),
      db.getAll('review_log'),
      db.getAll('daily_stat'),
      db.getAll('exam_result'),
      db.getAll('grammar_stat'),
    ])

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    settings: Object.fromEntries(settingRows.map((row) => [row.key, row.value])),
    cards,
    reviewLog,
    dailyStats,
    examResults,
    grammarStats,
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Valide un fichier de sauvegarde avant de s'en servir.
 *
 * On refuse explicitement plutôt que d'importer à moitié : écraser une
 * progression avec des données douteuses serait pire que de ne rien importer.
 */
export function parseBackup(raw: unknown): BackupFile {
  if (!isRecord(raw)) {
    throw new BackupError('Ce fichier ne contient pas une sauvegarde Mandarine.')
  }
  if (raw['format'] !== BACKUP_FORMAT) {
    throw new BackupError(
      'Ce fichier n’est pas une sauvegarde Mandarine (en-tête de format absent).',
    )
  }
  if (typeof raw['version'] !== 'number' || raw['version'] > BACKUP_VERSION) {
    throw new BackupError(
      'Cette sauvegarde a été produite par une version plus récente de' +
        ' l’application. Mets Mandarine à jour avant de l’importer.',
    )
  }
  for (const key of ['cards', 'reviewLog', 'dailyStats'] as const) {
    if (!Array.isArray(raw[key])) {
      throw new BackupError(`Sauvegarde incomplète : la section « ${key} » est absente.`)
    }
  }
  if (!isRecord(raw['settings'])) {
    throw new BackupError('Sauvegarde incomplète : les préférences sont absentes.')
  }

  // Les sections apparues en version 2 manquent dans une sauvegarde plus
  // ancienne, et c'est normal : on les complète à vide plutôt que de refuser
  // un fichier parfaitement valable pour son époque.
  return {
    ...(raw as unknown as BackupFile),
    examResults: Array.isArray(raw['examResults'])
      ? (raw['examResults'] as ExamResultRecord[])
      : [],
    grammarStats: Array.isArray(raw['grammarStats'])
      ? (raw['grammarStats'] as GrammarStatRecord[])
      : [],
  }
}

export interface ImportSummary {
  readonly cards: number
  readonly reviews: number
  readonly days: number
  readonly examens: number
}

/**
 * Remplace la progression locale par celle de la sauvegarde.
 *
 * Tout passe dans une seule transaction : en cas d'échec au milieu, rien n'est
 * modifié. Une restauration à moitié faite serait indétectable et fausserait
 * durablement la planification des révisions.
 */
export async function importBackup(raw: unknown): Promise<ImportSummary> {
  const backup = parseBackup(raw)
  const db = await getDb()

  const tx = db.transaction(
    ['settings', 'card', 'review_log', 'daily_stat', 'exam_result', 'grammar_stat'],
    'readwrite',
  )
  await Promise.all([
    tx.objectStore('settings').clear(),
    tx.objectStore('card').clear(),
    tx.objectStore('review_log').clear(),
    tx.objectStore('daily_stat').clear(),
    tx.objectStore('exam_result').clear(),
    tx.objectStore('grammar_stat').clear(),
  ])

  const settings = tx.objectStore('settings')
  for (const [key, value] of Object.entries(backup.settings)) {
    await settings.put({ key, value })
  }
  const cards = tx.objectStore('card')
  for (const card of backup.cards) await cards.put(card)
  const log = tx.objectStore('review_log')
  for (const entry of backup.reviewLog) await log.put(entry)
  const days = tx.objectStore('daily_stat')
  for (const day of backup.dailyStats) await days.put(day)
  const examens = tx.objectStore('exam_result')
  for (const examen of backup.examResults) await examens.put(examen)
  const grammaire = tx.objectStore('grammar_stat')
  for (const stat of backup.grammarStats) await grammaire.put(stat)

  await tx.done

  return {
    cards: backup.cards.length,
    reviews: backup.reviewLog.length,
    days: backup.dailyStats.length,
    examens: backup.examResults.length,
  }
}

/** Nom de fichier daté, pour que plusieurs sauvegardes coexistent. */
export function backupFileName(now: Date = new Date()): string {
  const day = now.toISOString().slice(0, 10)
  return `mandarine-${day}.json`
}
