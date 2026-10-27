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

import type { Longueur, Section } from '@/domain/examen/format'
import type { Verdict } from '@/domain/srs/grading'
import type { Note, SrsState, SrsStateKind } from '@/domain/srs/scheduler'
import type { CardSkill, CardTargetKind } from '@/domain/srs/cards'

/** Horodatage ISO 8601 en UTC. */
export type Timestamp = string

export type { CardSkill, CardTargetKind }

/** États FSRS, tels que les numérote `ts-fsrs`. */
export type CardState = SrsStateKind

/**
 * Une carte stockée.
 *
 * L'identifiant est **déterministe** : c'est `cardKey(cible, compétence)`.
 * Recréer les cartes d'un mot est donc idempotent, sans risque de doublon, et
 * deux appareils qui apprennent le même mot aboutissent au même identifiant —
 * ce qui facilitera une synchronisation plutôt que de la compliquer.
 *
 * Le journal de révisions, lui, garde des UUID v7 : il est en ajout seul, et
 * ses entrées n'ont pas d'équivalent sur un autre appareil.
 */
export interface CardRecord extends SrsState {
  readonly id: string
  readonly targetKind: CardTargetKind
  /** Identifiant stable dans le contenu, par exemple `爱-ai4`. */
  readonly targetId: string
  readonly skill: CardSkill

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
  readonly targetId: string
  readonly skill: CardSkill
  readonly note: Note
  /** État et échéance **avant** cette révision. */
  readonly previousState: CardState
  readonly previousDue: Timestamp
  readonly stability: number
  readonly difficulty: number
  readonly elapsedDays: number
  readonly lastElapsedDays: number
  readonly scheduledDays: number
  readonly reviewedAt: Timestamp
  readonly durationMs: number
  /** Verdict de la correction automatique, quand la carte en avait une. */
  readonly verdict: Verdict | null
  /** Ce que l'utilisateur a réellement tapé, pour l'analyse des erreurs. */
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

/**
 * Résultat d'un examen blanc, en **ajout seul** comme le journal de
 * révisions : un examen passé est un fait daté, pas un état modifiable.
 *
 * Les items eux-mêmes ne sont pas conservés. Ils se régénèrent à l'identique
 * depuis la graine, le niveau et la longueur, et les stocker ferait grossir
 * la sauvegarde avec du contenu qui n'est pas de la progression.
 */
export interface ExamResultRecord {
  readonly id: string
  readonly examenId: string
  readonly seed: number
  readonly level: number
  readonly longueur: Longueur
  readonly commenceA: Timestamp
  readonly termineA: Timestamp
  readonly posees: number
  readonly justes: number
  readonly pourcentage: number
  readonly reussi: boolean
  readonly sections: readonly {
    readonly section: Section
    readonly posees: number
    readonly justes: number
  }[]
  readonly pointsFaibles: readonly {
    readonly pointId: string
    readonly rates: number
    readonly poses: number
  }[]
  readonly createdAt: Timestamp
}

/**
 * Travail accompli sur un point de grammaire.
 *
 * Un point compte comme **couvert** dès que son exercice de remise en ordre a
 * été réussi au moins une fois. Le critère est affiché à l'utilisateur :
 * compter les fiches ouvertes aurait été plus flatteur et n'aurait rien
 * mesuré.
 */
export interface GrammarStatRecord {
  readonly pointId: string
  readonly essais: number
  readonly reussites: number
  readonly premiereReussiteA: Timestamp | null
  readonly dernierEssaiA: Timestamp
  /** Daté par un examen blanc qui a trouvé ce point en échec. */
  readonly aRevoirDepuis: Timestamp | null
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
