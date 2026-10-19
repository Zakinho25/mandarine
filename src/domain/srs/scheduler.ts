import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  State,
  type Card,
  type Grade,
} from 'ts-fsrs'

/**
 * Planification des révisions.
 *
 * `ts-fsrs` est enfermé ici, et nulle part ailleurs : le reste de
 * l'application ne connaît que `SrsState` et `Note`. Changer d'algorithme —
 * ou de bibliothèque — ne toucherait que ce fichier.
 *
 * Les dates sont des chaînes ISO en UTC, comme dans le stockage : elles se
 * comparent dans l'ordre lexicographique, ce qui évite de convertir en `Date`
 * pour savoir ce qui est dû, et supprime toute surprise de fuseau horaire.
 */

/** Appréciation donnée par l'utilisateur après avoir vu la réponse. */
export const NOTES = ['encore', 'difficile', 'correct', 'facile'] as const
export type Note = (typeof NOTES)[number]

export const NOTE_LABELS: Record<Note, string> = {
  encore: 'Encore',
  difficile: 'Difficile',
  correct: 'Correct',
  facile: 'Facile',
}

const GRADES: Record<Note, Grade> = {
  encore: Rating.Again,
  difficile: Rating.Hard,
  correct: Rating.Good,
  facile: Rating.Easy,
}

/** 0 nouvelle, 1 apprentissage, 2 révision, 3 réapprentissage. */
export type SrsStateKind = 0 | 1 | 2 | 3

export interface SrsState {
  readonly due: string
  readonly stability: number
  readonly difficulty: number
  readonly elapsedDays: number
  readonly scheduledDays: number
  readonly learningSteps: number
  readonly reps: number
  readonly lapses: number
  readonly state: SrsStateKind
  readonly lastReview: string | null
}

export interface ReviewOutcome {
  readonly state: SrsState
  /** Ce qu'il faut consigner dans le journal, en ajout seul. */
  readonly log: {
    readonly note: Note
    readonly previousState: SrsStateKind
    readonly previousDue: string
    readonly stability: number
    readonly difficulty: number
    readonly elapsedDays: number
    readonly lastElapsedDays: number
    readonly scheduledDays: number
    readonly reviewedAt: string
  }
}

export interface SchedulerOptions {
  /**
   * Probabilité de rappel visée au moment de la révision. Plus elle est haute,
   * plus les révisions sont fréquentes. 0,9 est la valeur recommandée.
   */
  readonly requestRetention?: number
  /**
   * Disperse légèrement les intervalles pour éviter que des cartes apprises le
   * même jour ne reviennent toutes ensemble. Désactivable pour les tests, qui
   * ont besoin de déterminisme.
   */
  readonly fuzz?: boolean
}

export interface Scheduler {
  readonly create: (now: string) => SrsState
  readonly grade: (state: SrsState, note: Note, now: string) => ReviewOutcome
  readonly retrievability: (state: SrsState, now: string) => number
}

function toCard(state: SrsState): Card {
  return {
    due: new Date(state.due),
    stability: state.stability,
    difficulty: state.difficulty,
    elapsed_days: state.elapsedDays,
    scheduled_days: state.scheduledDays,
    learning_steps: state.learningSteps,
    reps: state.reps,
    lapses: state.lapses,
    state: state.state as State,
    ...(state.lastReview === null ? {} : { last_review: new Date(state.lastReview) }),
  }
}

function fromCard(card: Card): SrsState {
  return {
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsed_days,
    scheduledDays: card.scheduled_days,
    learningSteps: card.learning_steps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state as SrsStateKind,
    lastReview: card.last_review === undefined ? null : card.last_review.toISOString(),
  }
}

export function createScheduler(options: SchedulerOptions = {}): Scheduler {
  const engine = fsrs(
    generatorParameters({
      request_retention: options.requestRetention ?? 0.9,
      enable_fuzz: options.fuzz ?? true,
    }),
  )

  return {
    create(now) {
      return fromCard(createEmptyCard(new Date(now)))
    },

    grade(state, note, now) {
      const { card, log } = engine.next(toCard(state), new Date(now), GRADES[note])
      return {
        state: fromCard(card),
        log: {
          note,
          previousState: state.state,
          previousDue: state.due,
          stability: log.stability,
          difficulty: log.difficulty,
          elapsedDays: log.elapsed_days,
          lastElapsedDays: log.last_elapsed_days,
          scheduledDays: log.scheduled_days,
          reviewedAt: log.review.toISOString(),
        },
      }
    },

    retrievability(state, now) {
      if (state.state === 0) return 0
      return engine.get_retrievability(toCard(state), new Date(now), false)
    },
  }
}

/** `true` si la carte est à réviser maintenant. Comparaison de chaînes ISO. */
export function isDue(state: SrsState, now: string): boolean {
  return state.due <= now
}

/**
 * Un mot est considéré comme **maîtrisé** quand sa stabilité dépasse 30 jours
 * et que la probabilité de s'en souvenir dépasse 90 %.
 *
 * Cette définition est affichée à l'utilisateur dans l'application. Un
 * compteur de progression dont personne ne connaît la règle est un chiffre
 * décoratif.
 */
export const MASTERY_STABILITY_DAYS = 30
export const MASTERY_RETRIEVABILITY = 0.9

export function isMastered(
  state: SrsState,
  now: string,
  scheduler: Scheduler,
): boolean {
  if (state.state !== 2) return false
  if (state.stability < MASTERY_STABILITY_DAYS) return false
  return scheduler.retrievability(state, now) >= MASTERY_RETRIEVABILITY
}
