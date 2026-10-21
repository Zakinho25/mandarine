import { describe, expect, it } from 'vitest'
import {
  computeStreak,
  daysBetween,
  estimateCompletion,
  MIN_DAYS_FOR_ESTIMATE,
  previousDay,
  type DayRecord,
} from './progress'

function jour(day: string, goalMet = true, activeMs = 600_000): DayRecord {
  return { day, activeMs, goalMet }
}

describe('previousDay', () => {
  it('recule d’un jour', () => {
    expect(previousDay('2026-03-02')).toBe('2026-03-01')
  })

  it('passe les débuts de mois et les années bissextiles', () => {
    expect(previousDay('2026-03-01')).toBe('2026-02-28')
    expect(previousDay('2024-03-01')).toBe('2024-02-29')
    expect(previousDay('2026-01-01')).toBe('2025-12-31')
  })
})

describe('daysBetween', () => {
  it('compte les jours, changement d’heure compris', () => {
    expect(daysBetween('2026-03-01', '2026-03-10')).toBe(9)
    // Le passage à l'heure d'été ne doit pas décaler le compte.
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2)
    expect(daysBetween('2026-03-10', '2026-03-10')).toBe(0)
  })
})

describe('computeStreak', () => {
  it('compte les jours consécutifs', () => {
    const days = [jour('2026-03-08'), jour('2026-03-09'), jour('2026-03-10')]
    expect(computeStreak(days, '2026-03-10')).toBe(3)
  })

  it('ne casse pas la série avant la fin de la journée', () => {
    // Si hier comptait, la série tient : la session du jour n'a pas encore eu
    // lieu, ce n'est pas un échec.
    const days = [jour('2026-03-08'), jour('2026-03-09')]
    expect(computeStreak(days, '2026-03-10')).toBe(2)
  })

  it('casse la série après deux jours sans rien', () => {
    const days = [jour('2026-03-07'), jour('2026-03-08')]
    expect(computeStreak(days, '2026-03-10')).toBe(0)
  })

  it('ignore les jours où l’objectif n’a pas été atteint', () => {
    const days = [jour('2026-03-08'), jour('2026-03-09', false), jour('2026-03-10')]
    expect(computeStreak(days, '2026-03-10')).toBe(1)
  })

  it('renvoie zéro sans aucun jour', () => {
    expect(computeStreak([], '2026-03-10')).toBe(0)
  })
})

describe('estimateCompletion', () => {
  const base = { target: 1000, today: '2026-03-30' }

  it('refuse d’estimer avant d’avoir assez de jours', () => {
    const result = estimateCompletion({
      ...base,
      days: [jour('2026-03-29'), jour('2026-03-30')],
      mastered: 20,
      firstDay: '2026-03-29',
    })
    expect(result.reason).toBe('pas_assez_de_jours')
    expect(result.date).toBeNull()
  })

  it('refuse d’estimer sans jours d’usage réels', () => {
    // Trente jours écoulés mais seulement deux sessions : la moyenne ne
    // voudrait rien dire.
    const result = estimateCompletion({
      ...base,
      days: [jour('2026-03-01'), jour('2026-03-02')],
      mastered: 10,
      firstDay: '2026-03-01',
    })
    expect(result.reason).toBe('pas_assez_de_jours')
  })

  it('projette une date quand le rythme est mesurable', () => {
    const days = Array.from({ length: 30 }, (_, i) =>
      jour(`2026-03-${String(i + 1).padStart(2, '0')}`),
    )
    const result = estimateCompletion({
      ...base,
      days,
      mastered: 100,
      firstDay: '2026-03-01',
    })

    expect(result.reason).toBe('ok')
    // 100 mots en 30 jours, soit 3,33 par jour : il reste 900 mots, donc
    // 270 jours, ce qui tombe fin décembre 2026.
    expect(result.date).toBe('2026-12-25')
    expect(result.perWeek).toBeCloseTo(23.3, 1)
  })

  it('signale un rythme nul plutôt qu’une date absurde', () => {
    const days = Array.from({ length: 30 }, (_, i) =>
      jour(`2026-03-${String(i + 1).padStart(2, '0')}`, false, 60_000),
    )
    const result = estimateCompletion({
      ...base,
      days,
      mastered: 0,
      firstDay: '2026-03-01',
    })
    expect(result.reason).toBe('rythme_nul')
    expect(result.date).toBeNull()
  })

  it('reconnaît un objectif déjà atteint', () => {
    const result = estimateCompletion({
      ...base,
      days: [],
      mastered: 1000,
      firstDay: '2026-01-01',
    })
    expect(result.reason).toBe('objectif_atteint')
  })

  it('exige le seuil annoncé, pas un de moins', () => {
    const jours = Array.from({ length: MIN_DAYS_FOR_ESTIMATE }, (_, i) =>
      jour(`2026-03-${String(i + 1).padStart(2, '0')}`),
    )
    const avecSeuil = estimateCompletion({
      days: jours,
      today: `2026-03-${String(MIN_DAYS_FOR_ESTIMATE).padStart(2, '0')}`,
      mastered: 50,
      target: 1000,
      firstDay: '2026-03-01',
    })
    expect(avecSeuil.reason).toBe('ok')
  })
})
