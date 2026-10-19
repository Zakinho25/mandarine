/**
 * Enregistrements stockés localement, dans IndexedDB.
 *
 * Trois conventions sont posées dès maintenant, alors qu'aucune
 * synchronisation n'est prévue :
 *
 *  - identifiants **UUID v7** et jamais de compteur auto-incrémenté ;
 *  - `updatedAt` sur tout enregistrement modifiable ;
 *  - `deletedAt` en pierre tombale plutôt qu'une suppression réelle.
 *
 * Elles ne coûtent rien aujourd'hui. Les ajouter après coup imposerait de
 * migrer des données de progression déjà accumulées, c'est-à-dire la seule
 * chose dans cette application qui ne se régénère pas.
 */

/** Horodatage ISO 8601 en UTC. */
export type Timestamp = string

/** Compétence évaluée par une carte. Une même cible en a plusieurs. */
export type CardSkill =
  /** Caractère vu, sens à retrouver. */
  | 'zh_fr'
  /** Mot entendu, sens à retrouver. */
  | 'audio_fr'
  /** Sens donné, caractère ou pinyin à produire. */
  | 'fr_zh'
  /** Ton à identifier à l'oreille. */
  | 'tone'
  /** Tracé à écrire (désactivé par défaut). */
  | 'write'

export type CardTargetKind = 'lexeme' | 'hanzi' | 'sentence' | 'tone_pair'

/** États FSRS, tels que les numérote `ts-fsrs`. */
export type CardState = 0 | 1 | 2 | 3

export interface CardRecord {
  readonly id: string
  readonly targetKind: CardTargetKind
  /** Identifiant stable dans le contenu, par exemple `hao3-好`. */
  readonly targetId: string
  readonly skill: CardSkill

  // État FSRS
  readonly due: Timestamp
  readonly stability: number | null
  readonly difficulty: number | null
  readonly elapsedDays: number
  readonly scheduledDays: number
  readonly reps: number
  readonly lapses: number
  readonly state: CardState
  readonly lastReview: Timestamp | null

  readonly suspendedAt: Timestamp | null
  readonly createdAt: Timestamp
  readonly updatedAt: Timestamp
  readonly deletedAt: Timestamp | null
}

/**
 * Journal de révisions, en **ajout seul** : jamais modifié, jamais supprimé.
 *
 * Rien ne le consomme avant longtemps. C'est pourtant la seule matière
 * première qui permettra d'optimiser les paramètres FSRS sur les données
 * réelles plutôt que sur les valeurs par défaut — et elle ne peut pas être
 * reconstituée après coup.
 */
export interface ReviewLogRecord {
  readonly id: string
  readonly cardId: string
  /** 1 = oublié, 2 = difficile, 3 = correct, 4 = facile. */
  readonly rating: 1 | 2 | 3 | 4
  readonly state: CardState
  readonly due: Timestamp
  readonly stability: number | null
  readonly difficulty: number | null
  readonly elapsedDays: number
  readonly lastElapsedDays: number
  readonly scheduledDays: number
  readonly reviewedAt: Timestamp
  readonly durationMs: number
  /** Ce que l'utilisateur a réellement répondu, pour l'analyse des erreurs. */
  readonly answer: string | null
}

/** Effort réel de la journée. Ce sont ces minutes-là qui comptent, pas les points. */
export interface DailyStatRecord {
  /** Jour local au format `AAAA-MM-JJ`. */
  readonly day: string
  readonly activeMs: number
  readonly reviews: number
  readonly newCards: number
  readonly listeningMs: number
  readonly readingMs: number
  readonly goalMet: boolean
  readonly updatedAt: Timestamp
}

export const EXAM_TRACKS = ['hsk3_2025', 'hsk3_2021', 'hsk2'] as const
export type ExamTrack = (typeof EXAM_TRACKS)[number]

export const EXAM_TRACK_LABELS: Record<ExamTrack, string> = {
  hsk3_2025: 'HSK 3.0 — programme révisé (environ 1 000 mots)',
  hsk3_2021: 'HSK 3.0 — version 2021 (environ 2 245 mots)',
  hsk2: 'Ancien examen HSK 2.0 (600 mots)',
}

export const TONE_SCHEMES = ['standard', 'daltonien', 'aucune'] as const
export type ToneScheme = (typeof TONE_SCHEMES)[number]

export const PINYIN_DISPLAYS = ['toujours', 'inconnus', 'jamais'] as const
export type PinyinDisplay = (typeof PINYIN_DISPLAYS)[number]

export const HANZI_SIZES = ['petit', 'moyen', 'grand'] as const
export type HanziSize = (typeof HANZI_SIZES)[number]

export const THEMES = ['auto', 'light', 'dark'] as const
export type ThemePreference = (typeof THEMES)[number]
