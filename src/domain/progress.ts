/**
 * Calculs du tableau de bord.
 *
 * Deux règles se tiennent derrière tout ce fichier :
 *
 *  - on ne projette rien tant qu'on n'a pas de quoi projeter. Une date
 *    d'arrivée au HSK 3 calculée sur trois jours d'usage serait un chiffre
 *    inventé avec une décimale ;
 *  - on dit **pourquoi** on ne peut pas répondre, au lieu d'afficher un tiret.
 */

export interface DayRecord {
  /** Jour local, `AAAA-MM-JJ`. */
  readonly day: string
  readonly activeMs: number
  readonly goalMet: boolean
}

/** Jours d'affilée où l'objectif a été atteint, en finissant aujourd'hui ou hier. */
export function computeStreak(days: readonly DayRecord[], today: string): number {
  const met = new Set(days.filter((day) => day.goalMet).map((day) => day.day))
  if (met.size === 0) return 0

  // La série reste vivante si hier comptait : on ne la casse pas parce que la
  // session du jour n'a pas encore eu lieu.
  let cursor = met.has(today) ? today : previousDay(today)
  if (!met.has(cursor)) return 0

  let streak = 0
  while (met.has(cursor)) {
    streak += 1
    cursor = previousDay(cursor)
  }
  return streak
}

export function previousDay(day: string): string {
  const date = new Date(`${day}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() - 1)
  return date.toISOString().slice(0, 10)
}

export function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T12:00:00Z`).getTime()
  const b = new Date(`${to}T12:00:00Z`).getTime()
  return Math.round((b - a) / 86_400_000)
}

/** Nombre de jours d'activité, sur la fenêtre donnée. */
export function activeDays(
  days: readonly DayRecord[],
  today: string,
  window: number,
): number {
  return days.filter(
    (day) => day.activeMs > 0 && daysBetween(day.day, today) >= 0 && daysBetween(day.day, today) < window,
  ).length
}

export const MIN_DAYS_FOR_ESTIMATE = 14

export type EstimateReason =
  | 'pas_assez_de_jours'
  | 'rythme_nul'
  | 'objectif_atteint'
  | 'ok'

export interface Estimate {
  readonly reason: EstimateReason
  /** Date estimée, `AAAA-MM-JJ`. `null` dès que la raison n'est pas `ok`. */
  readonly date: string | null
  /** Mots maîtrisés par semaine, sur la fenêtre observée. */
  readonly perWeek: number
  /** Jours d'usage déjà observés. */
  readonly observedDays: number
}

export interface EstimateInput {
  readonly days: readonly DayRecord[]
  readonly today: string
  readonly mastered: number
  readonly target: number
  /** Jour de la première activité enregistrée. */
  readonly firstDay: string | null
}

/**
 * Estime la date d'atteinte de l'objectif, d'après le rythme réel.
 *
 * Le rythme est mesuré sur les mots **maîtrisés** rapportés au nombre de jours
 * écoulés depuis le début, pas sur une moyenne glissante de révisions : ce
 * qu'on veut projeter, c'est l'apprentissage durable, pas l'activité.
 */
export function estimateCompletion(input: EstimateInput): Estimate {
  const { days, today, mastered, target, firstDay } = input

  if (mastered >= target) {
    return { reason: 'objectif_atteint', date: null, perWeek: 0, observedDays: 0 }
  }

  const observedDays = firstDay === null ? 0 : daysBetween(firstDay, today) + 1
  const used = activeDays(days, today, 9999)

  if (firstDay === null || observedDays < MIN_DAYS_FOR_ESTIMATE || used < 5) {
    return { reason: 'pas_assez_de_jours', date: null, perWeek: 0, observedDays }
  }

  const perDay = mastered / observedDays
  const perWeek = perDay * 7

  if (perDay <= 0) {
    return { reason: 'rythme_nul', date: null, perWeek: 0, observedDays }
  }

  const remaining = target - mastered
  const daysLeft = Math.ceil(remaining / perDay)
  const date = new Date(`${today}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + daysLeft)

  return {
    reason: 'ok',
    date: date.toISOString().slice(0, 10),
    perWeek: Math.round(perWeek * 10) / 10,
    observedDays,
  }
}

export const ESTIMATE_MESSAGES: Record<EstimateReason, string> = {
  pas_assez_de_jours: `Il faut au moins ${String(MIN_DAYS_FOR_ESTIMATE)} jours d’usage pour estimer quoi que ce soit.`,
  rythme_nul: 'Aucun mot maîtrisé pour l’instant : rien à projeter.',
  objectif_atteint: 'Objectif atteint.',
  ok: '',
}
