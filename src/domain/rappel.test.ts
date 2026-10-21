import { describe, expect, it } from 'vitest'
import { buildReminderIcs, parseTime } from './rappel'

const BASE = { hour: 19, minute: 30, goalMinutes: 20, startDate: '2026-10-21' }

describe('buildReminderIcs', () => {
  const ics = buildReminderIcs(BASE)

  it('produit un fichier iCalendar complet', () => {
    expect(ics.startsWith('BEGIN:VCALENDAR')).toBe(true)
    expect(ics.trimEnd().endsWith('END:VCALENDAR')).toBe(true)
    expect(ics).toContain('BEGIN:VEVENT')
    expect(ics).toContain('END:VEVENT')
  })

  it('place l’événement à l’heure demandée', () => {
    expect(ics).toContain('DTSTART:20261021T193000')
  })

  it('utilise une heure flottante, sans fuseau', () => {
    // Sans Z ni TZID, l'alerte se déclenche à l'heure locale de l'appareil.
    expect(ics).not.toContain('TZID')
    expect(ics).not.toMatch(/DTSTART:[0-9T]+Z/)
  })

  it('répète tous les jours et porte une alerte', () => {
    expect(ics).toContain('RRULE:FREQ=DAILY')
    expect(ics).toContain('BEGIN:VALARM')
    expect(ics).toContain('TRIGGER:PT0M')
  })

  it('reprend l’objectif quotidien dans le titre et la durée', () => {
    expect(ics).toContain('Chinois : 20 minutes')
    expect(ics).toContain('DURATION:PT20M')
  })

  it('sépare les lignes par CRLF', () => {
    // Certains agendas refusent un simple saut de ligne.
    expect(ics).toContain('\r\n')
    expect(ics.split('\r\n').length).toBeGreaterThan(10)
  })

  it('échappe les caractères réservés', () => {
    const custom = buildReminderIcs({ ...BASE, uid: 'test;avec,virgule' })
    expect(custom).toContain('UID:test;avec,virgule')

    // La description est repliée : il faut la recoller avant de l'inspecter,
    // exactement comme le fait un agenda à la lecture.
    const unfolded = custom.replace(/\r\n /g, '')
    expect(unfolded).toMatch(/DESCRIPTION:[^\r\n]*\\,/)
  })

  it('ne laisse aucune ligne dépasser 75 octets', () => {
    for (const line of ics.split('\r\n')) {
      expect(new TextEncoder().encode(line).length, line).toBeLessThanOrEqual(75)
    }
  })

  it('complète les heures à un chiffre', () => {
    expect(buildReminderIcs({ ...BASE, hour: 7, minute: 5 })).toContain(
      'DTSTART:20261021T070500',
    )
  })
})

describe('parseTime', () => {
  it('lit une heure valide', () => {
    expect(parseTime('19:30')).toEqual({ hour: 19, minute: 30 })
    expect(parseTime('07:05')).toEqual({ hour: 7, minute: 5 })
    expect(parseTime(' 9:00 ')).toEqual({ hour: 9, minute: 0 })
  })

  it('refuse une heure impossible', () => {
    expect(parseTime('24:00')).toBeUndefined()
    expect(parseTime('12:60')).toBeUndefined()
    expect(parseTime('midi')).toBeUndefined()
    expect(parseTime('')).toBeUndefined()
  })
})
