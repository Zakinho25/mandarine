import { uuidv7 } from '@/domain/ids'
import { cardKey, seedsForLexeme, type CardSkill } from '@/domain/srs/cards'
import type { Verdict } from '@/domain/srs/grading'
import { createScheduler, type Note, type SrsState } from '@/domain/srs/scheduler'
import { getDb } from './db'
import type { CardRecord, DailyStatRecord, ReviewLogRecord } from './types'

/**
 * Stockage des cartes, du journal de révisions et des statistiques du jour.
 *
 * Une révision écrit dans trois magasins. Elle le fait dans **une seule
 * transaction** : une carte replanifiée sans son entrée de journal rendrait
 * l'optimisation future des paramètres FSRS silencieusement fausse, et une
 * statistique sans sa carte afficherait une progression qui n'a pas eu lieu.
 */

export const scheduler = createScheduler({ fuzz: true })

function srsOf(card: CardRecord): SrsState {
  return {
    due: card.due,
    stability: card.stability,
    difficulty: card.difficulty,
    elapsedDays: card.elapsedDays,
    scheduledDays: card.scheduledDays,
    learningSteps: card.learningSteps,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    lastReview: card.lastReview,
  }
}

/** Jour local au format `AAAA-MM-JJ`. Les journées comptent dans le fuseau de l'utilisateur. */
export function localDay(now: Date = new Date()): string {
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

export async function allCards(): Promise<CardRecord[]> {
  const db = await getDb()
  const cards = await db.getAll('card')
  return cards.filter((card) => card.deletedAt === null)
}

export async function countCards(): Promise<number> {
  const db = await getDb()
  return db.count('card')
}

/**
 * Crée les cartes manquantes pour une liste de mots, et ne touche pas aux
 * autres. Relancer l'opération ne crée aucun doublon : les identifiants sont
 * déterministes.
 *
 * Renvoie le nombre de cartes réellement ajoutées.
 */
export async function ensureCardsForLexemes(
  lexemeIds: readonly string[],
  now: string = new Date().toISOString(),
): Promise<number> {
  const db = await getDb()
  const existing = new Set((await db.getAllKeys('card')).map(String))

  const fresh = lexemeIds
    .flatMap((lexemeId) => seedsForLexeme(lexemeId))
    .filter((seed) => !existing.has(seed.key))

  if (fresh.length === 0) return 0

  const transaction = db.transaction('card', 'readwrite')
  const store = transaction.objectStore('card')
  const blank = scheduler.create(now)

  for (const seed of fresh) {
    await store.put({
      ...blank,
      id: seed.key,
      targetKind: seed.targetKind,
      targetId: seed.targetId,
      skill: seed.skill,
      suspendedAt: null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    })
  }
  await transaction.done

  return fresh.length
}

export interface ReviewInput {
  readonly card: CardRecord
  readonly note: Note
  readonly now: string
  readonly durationMs: number
  /** Objectif du jour en millisecondes, pour savoir s'il est atteint. */
  readonly goalMs: number
  readonly verdict?: Verdict
  readonly answer?: string
}

export interface ReviewResult {
  readonly card: CardRecord
  readonly nextDue: string
}

/**
 * Enregistre une révision : replanifie la carte, consigne le journal et met à
 * jour la journée. Tout ou rien.
 */
export async function recordReview(input: ReviewInput): Promise<ReviewResult> {
  const { card, note, now, durationMs } = input
  const outcome = scheduler.grade(srsOf(card), note, now)

  const updated: CardRecord = {
    ...card,
    ...outcome.state,
    updatedAt: now,
  }

  const logEntry: ReviewLogRecord = {
    id: uuidv7(new Date(now).getTime()),
    cardId: card.id,
    targetId: card.targetId,
    skill: card.skill,
    note,
    previousState: outcome.log.previousState,
    previousDue: outcome.log.previousDue,
    stability: outcome.log.stability,
    difficulty: outcome.log.difficulty,
    elapsedDays: outcome.log.elapsedDays,
    lastElapsedDays: outcome.log.lastElapsedDays,
    scheduledDays: outcome.log.scheduledDays,
    reviewedAt: outcome.log.reviewedAt,
    durationMs,
    verdict: input.verdict ?? null,
    answer: input.answer ?? null,
  }

  const db = await getDb()
  const transaction = db.transaction(['card', 'review_log', 'daily_stat'], 'readwrite')

  await transaction.objectStore('card').put(updated)
  await transaction.objectStore('review_log').put(logEntry)

  const day = localDay(new Date(now))
  const statStore = transaction.objectStore('daily_stat')
  const previous = await statStore.get(day)
  const activeMs = (previous?.activeMs ?? 0) + durationMs
  const stat: DailyStatRecord = {
    day,
    activeMs,
    reviews: (previous?.reviews ?? 0) + 1,
    // Une carte encore neuve au moment où on la note est une découverte.
    newCards: (previous?.newCards ?? 0) + (card.state === 0 ? 1 : 0),
    listeningMs: previous?.listeningMs ?? 0,
    readingMs: previous?.readingMs ?? 0,
    // Une fois l'objectif atteint, il le reste : changer de réglage en cours
    // de route ne doit pas effacer une journée déjà gagnée.
    goalMet: previous?.goalMet === true || activeMs >= input.goalMs,
    updatedAt: now,
  }
  await statStore.put(stat)

  await transaction.done
  return { card: updated, nextDue: updated.due }
}

/**
 * Mots découverts aujourd'hui, comptés sur le journal plutôt que sur le
 * compteur du jour.
 *
 * Le compteur additionne des cartes ; ce qui plafonne, ce sont des **mots**.
 * Comme les deux cartes d'un mot peuvent être vues dans deux sessions
 * différentes, seul le journal permet de compter juste — et donc d'empêcher
 * qu'une deuxième session du jour introduise une seconde fournée.
 */
export async function newWordsToday(now: Date = new Date()): Promise<Set<string>> {
  const db = await getDb()
  const day = localDay(now)
  const words = new Set<string>()

  for (const entry of await db.getAll('review_log')) {
    if (entry.previousState !== 0) continue
    if (localDay(new Date(entry.reviewedAt)) !== day) continue
    words.add(entry.targetId)
  }
  return words
}

/**
 * Compte du temps passé à écouter.
 *
 * Le cahier des charges est explicite : le temps passé sur du vrai contenu
 * compte plus que les points. Les exercices d'écoute alimentent donc le même
 * compteur de journée que les révisions, au lieu d'un score séparé.
 */
export async function recordListening(
  ms: number,
  goalMs: number,
  now: Date = new Date(),
): Promise<void> {
  if (ms <= 0) return
  const db = await getDb()
  const day = localDay(now)

  const transaction = db.transaction('daily_stat', 'readwrite')
  const store = transaction.objectStore('daily_stat')
  const previous = await store.get(day)
  const activeMs = (previous?.activeMs ?? 0) + ms

  await store.put({
    day,
    activeMs,
    reviews: previous?.reviews ?? 0,
    newCards: previous?.newCards ?? 0,
    listeningMs: (previous?.listeningMs ?? 0) + ms,
    readingMs: previous?.readingMs ?? 0,
    goalMet: previous?.goalMet === true || activeMs >= goalMs,
    updatedAt: now.toISOString(),
  })
  await transaction.done
}

export async function todayStat(now: Date = new Date()): Promise<DailyStatRecord | undefined> {
  const db = await getDb()
  return db.get('daily_stat', localDay(now))
}

export async function allDailyStats(): Promise<DailyStatRecord[]> {
  const db = await getDb()
  return db.getAll('daily_stat')
}

/** Cartes d'un mot, toutes compétences confondues. */
export async function cardsForLexeme(
  lexemeId: string,
  skills: readonly CardSkill[],
): Promise<(CardRecord | undefined)[]> {
  const db = await getDb()
  return Promise.all(
    skills.map((skill) => db.get('card', cardKey('lexeme', lexemeId, skill))),
  )
}
