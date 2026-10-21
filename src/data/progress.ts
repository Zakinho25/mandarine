import {
  computeStreak,
  estimateCompletion,
  type DayRecord,
  type Estimate,
} from '@/domain/progress'
import { ACTIVE_SKILLS, cardKey } from '@/domain/srs/cards'
import { isMastered } from '@/domain/srs/scheduler'
import { allCards, allDailyStats, localDay, scheduler, todayStat } from './cards'

/**
 * Chiffres du tableau de bord.
 *
 * Un mot n'est **maîtrisé** que si toutes ses compétences actives le sont :
 * savoir reconnaître 学习 sans savoir le produire n'est pas savoir le mot. La
 * définition est affichée à l'utilisateur — un compteur dont personne ne
 * connaît la règle est un chiffre décoratif.
 */

export interface Progress {
  /** Mots rencontrés au moins une fois. */
  readonly seen: number
  /** Mots dont toutes les compétences actives sont maîtrisées. */
  readonly mastered: number
  readonly minutesToday: number
  readonly reviewsToday: number
  readonly goalMetToday: boolean
  /** Nombre de cartes dues maintenant. */
  readonly dueNow: number
  /** Jours d'affilée où l'objectif a été atteint. */
  readonly streak: number
  /** Minutes d'écoute cumulées, tous jours confondus. */
  readonly listeningMinutes: number
  readonly totalMinutes: number
  readonly estimate: Estimate
}

export async function computeProgress(
  target: number,
  goalMs: number,
  now: Date = new Date(),
): Promise<Progress> {
  const cards = await allCards()
  const stat = await todayStat(now)
  const stats = await allDailyStats()
  const iso = now.toISOString()
  const today = localDay(now)

  const byId = new Map(cards.map((card) => [card.id, card]))
  const targets = new Set(cards.map((card) => card.targetId))

  let seen = 0
  let mastered = 0

  for (const targetId of targets) {
    const skills = ACTIVE_SKILLS.map((skill) =>
      byId.get(cardKey('lexeme', targetId, skill)),
    )
    if (skills.some((card) => card !== undefined && card.reps > 0)) seen += 1
    if (
      skills.length > 0 &&
      skills.every((card) => card !== undefined && isMastered(card, iso, scheduler))
    ) {
      mastered += 1
    }
  }

  const dueNow = cards.filter(
    (card) => card.state !== 0 && card.suspendedAt === null && card.due <= iso,
  ).length

  const days: DayRecord[] = stats.map((day) => ({
    day: day.day,
    activeMs: day.activeMs,
    // Une journée ancienne enregistrée avant l'objectif courant est relue avec
    // le même critère que les autres : la cohérence prime sur l'historique.
    goalMet: day.goalMet || day.activeMs >= goalMs,
  }))
  const sorted = [...days].sort((a, b) => a.day.localeCompare(b.day))
  const firstDay = sorted[0]?.day ?? null

  return {
    seen,
    mastered,
    minutesToday: Math.round((stat?.activeMs ?? 0) / 60_000),
    reviewsToday: stat?.reviews ?? 0,
    goalMetToday: (stat?.goalMet ?? false) || (stat?.activeMs ?? 0) >= goalMs,
    dueNow,
    streak: computeStreak(days, today),
    listeningMinutes: Math.round(
      stats.reduce((sum, day) => sum + day.listeningMs, 0) / 60_000,
    ),
    totalMinutes: Math.round(stats.reduce((sum, day) => sum + day.activeMs, 0) / 60_000),
    estimate: estimateCompletion({ days, today, mastered, target, firstDay }),
  }
}

export { localDay }
