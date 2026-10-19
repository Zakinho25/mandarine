import { describe, expect, it } from 'vitest'
import {
  createScheduler,
  isDue,
  isMastered,
  MASTERY_STABILITY_DAYS,
  type SrsState,
} from './scheduler'

// Dispersion désactivée : les tests ont besoin de déterminisme.
const scheduler = createScheduler({ fuzz: false })

const T0 = '2026-01-01T08:00:00.000Z'

function days(from: string, count: number): string {
  return new Date(new Date(from).getTime() + count * 86_400_000).toISOString()
}

/** Révise une carte plusieurs fois d'affilée, à chaque échéance. */
function drill(times: number, note: 'correct' | 'facile' = 'correct'): SrsState {
  let state = scheduler.create(T0)
  let now = T0
  for (let i = 0; i < times; i += 1) {
    now = state.due > now ? state.due : now
    state = scheduler.grade(state, note, now).state
  }
  return state
}

describe('création', () => {
  it('produit une carte neuve, due immédiatement', () => {
    const state = scheduler.create(T0)
    expect(state.state).toBe(0)
    expect(state.reps).toBe(0)
    expect(state.lapses).toBe(0)
    expect(state.lastReview).toBeNull()
    expect(isDue(state, T0)).toBe(true)
  })
})

describe('notation', () => {
  it('fait sortir une carte neuve de l’état neuf', () => {
    const { state } = scheduler.grade(scheduler.create(T0), 'correct', T0)
    expect(state.state).not.toBe(0)
    expect(state.reps).toBe(1)
    expect(state.lastReview).toBe(T0)
    expect(state.due > T0).toBe(true)
  })

  it('espace de plus en plus les révisions réussies', () => {
    const intervals: number[] = []
    let state = scheduler.create(T0)
    let now = T0

    for (let i = 0; i < 6; i += 1) {
      now = state.due > now ? state.due : now
      state = scheduler.grade(state, 'correct', now).state
      intervals.push(new Date(state.due).getTime() - new Date(now).getTime())
    }

    // C'est tout l'intérêt de la répétition espacée : chaque réussite doit
    // repousser la carte plus loin que la précédente.
    const reviewPhase = intervals.slice(2)
    for (let i = 1; i < reviewPhase.length; i += 1) {
      expect(reviewPhase[i]).toBeGreaterThan(reviewPhase[i - 1] ?? 0)
    }
  })

  it('compte une rechute et rapproche la carte quand on a oublié', () => {
    const learned = drill(5)
    expect(learned.lapses).toBe(0)

    const now = learned.due
    const after = scheduler.grade(learned, 'encore', now).state

    expect(after.lapses).toBe(1)
    const interval = new Date(after.due).getTime() - new Date(now).getTime()
    const before = new Date(learned.due).getTime() - new Date(learned.lastReview ?? T0).getTime()
    expect(interval).toBeLessThan(before)
  })

  it('« facile » espace plus que « difficile »', () => {
    const base = drill(3)
    const easy = scheduler.grade(base, 'facile', base.due).state
    const hard = scheduler.grade(base, 'difficile', base.due).state
    expect(new Date(easy.due).getTime()).toBeGreaterThan(new Date(hard.due).getTime())
  })

  it('consigne l’état précédent dans le journal', () => {
    const learned = drill(3)
    const { log } = scheduler.grade(learned, 'correct', learned.due)

    expect(log.note).toBe('correct')
    expect(log.previousState).toBe(learned.state)
    expect(log.previousDue).toBe(learned.due)
    expect(log.reviewedAt).toBe(learned.due)
  })
})

describe('probabilité de rappel', () => {
  it('vaut zéro pour une carte jamais vue', () => {
    expect(scheduler.retrievability(scheduler.create(T0), T0)).toBe(0)
  })

  it('décroît avec le temps', () => {
    const state = drill(5)
    const justReviewed = scheduler.retrievability(state, state.lastReview ?? T0)
    const muchLater = scheduler.retrievability(state, days(state.due, 365))

    expect(justReviewed).toBeGreaterThan(0.9)
    expect(muchLater).toBeLessThan(justReviewed)
  })
})

describe('isDue', () => {
  it('compare les échéances sans conversion de date', () => {
    const state = { ...scheduler.create(T0), due: '2026-01-10T00:00:00.000Z' }
    expect(isDue(state, '2026-01-09T23:59:59.000Z')).toBe(false)
    expect(isDue(state, '2026-01-10T00:00:00.000Z')).toBe(true)
    expect(isDue(state, '2026-02-01T00:00:00.000Z')).toBe(true)
  })
})

describe('maîtrise', () => {
  const base = drill(5)

  it('exige stabilité ET probabilité de rappel', () => {
    const fragile: SrsState = { ...base, state: 2, stability: 3 }
    expect(isMastered(fragile, base.due, scheduler)).toBe(false)

    const solid: SrsState = {
      ...base,
      state: 2,
      stability: MASTERY_STABILITY_DAYS + 10,
      lastReview: T0,
      due: days(T0, 40),
    }
    expect(isMastered(solid, T0, scheduler)).toBe(true)
  })

  it('ne considère jamais une carte en apprentissage comme maîtrisée', () => {
    const learning: SrsState = { ...base, state: 1, stability: 100 }
    expect(isMastered(learning, base.due, scheduler)).toBe(false)
  })

  it('cesse de considérer un mot maîtrisé quand il s’est effacé', () => {
    const solid: SrsState = {
      ...base,
      state: 2,
      stability: MASTERY_STABILITY_DAYS + 10,
      lastReview: T0,
      due: days(T0, 40),
    }
    // Deux ans plus tard sans l'avoir revu, on ne peut plus l'affirmer.
    expect(isMastered(solid, days(T0, 730), scheduler)).toBe(false)
  })
})
