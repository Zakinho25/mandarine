import { getDb } from './db'
import type {
  ExamTrack,
  HanziSize,
  PinyinDisplay,
  ThemePreference,
  Timestamp,
  ToneScheme,
} from './types'

export interface Settings {
  readonly theme: ThemePreference
  readonly toneScheme: ToneScheme
  readonly hanziSize: HanziSize
  readonly pinyinDisplay: PinyinDisplay
  readonly dailyGoalMin: 10 | 20 | 30
  readonly examTrack: ExamTrack
  /** L'écriture manuscrite n'est pas exigée avant le HSK 5 : désactivée. */
  readonly handwriting: boolean
  readonly lastBackupAt: Timestamp | null
  /** Heure du rappel quotidien, `HH:MM`. Sert à produire l'événement d'agenda. */
  readonly reminderTime: string
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'auto',
  toneScheme: 'standard',
  hanziSize: 'moyen',
  pinyinDisplay: 'inconnus',
  dailyGoalMin: 20,
  examTrack: 'hsk3_2025',
  handwriting: false,
  lastBackupAt: null,
  reminderTime: '19:00',
}

/**
 * Lit les préférences, en complétant par les valeurs par défaut.
 *
 * Chaque réglage est une ligne distincte : ajouter une préférence dans une
 * version ultérieure ne casse donc pas les données déjà stockées, et ne
 * demande aucune migration.
 */
export async function loadSettings(): Promise<Settings> {
  const db = await getDb()
  const rows = await db.getAll('settings')
  const stored = new Map(rows.map((row) => [row.key, row.value]))

  const merged: Record<string, unknown> = { ...DEFAULT_SETTINGS }
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (stored.has(key)) merged[key] = stored.get(key)
  }
  return merged as unknown as Settings
}

export async function saveSetting<K extends keyof Settings>(
  key: K,
  value: Settings[K],
): Promise<void> {
  const db = await getDb()
  await db.put('settings', { key, value })
}
