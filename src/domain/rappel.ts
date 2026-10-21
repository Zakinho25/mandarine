/**
 * Rappel quotidien, sous forme d'événement d'agenda.
 *
 * ### Pourquoi pas une notification
 *
 * Une application web ne peut pas programmer une notification pour plus tard :
 * l'API Notification n'affiche quelque chose que si la page tourne déjà, ce
 * qui ne sert à rien pour un rappel. Les notifications différées passent par
 * l'API Push, qui exige un service de push et un serveur détenant des clés.
 * Ce projet n'a ni serveur ni budget, et sur iPhone le push web demande en
 * plus que l'application soit installée.
 *
 * Un fichier d'agenda contourne tout cela : l'utilisateur l'ouvre une fois,
 * son téléphone crée un événement quotidien avec une alerte, et c'est le
 * système qui le rappelle. Gratuit, hors ligne, et il fonctionne même si
 * l'application n'est jamais rouverte.
 */

export interface ReminderOptions {
  /** Heure locale, 0 à 23. */
  readonly hour: number
  /** Minute locale, 0 à 59. */
  readonly minute: number
  readonly goalMinutes: number
  /** Premier jour, `AAAA-MM-JJ`. */
  readonly startDate: string
  /** Identifiant stable de l'événement, pour pouvoir le remplacer. */
  readonly uid?: string
}

/** Échappe les caractères réservés d'une valeur texte iCalendar. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/**
 * Replie les lignes à 75 octets, comme l'exige la RFC 5545.
 *
 * Les agendas qui tolèrent les lignes longues sont la majorité, pas la
 * totalité : un accent mal placé suffit à faire rejeter le fichier.
 */
function foldLine(line: string): string {
  const encoder = new TextEncoder()
  if (encoder.encode(line).length <= 75) return line

  const out: string[] = []
  let current = ''
  let bytes = 0

  for (const character of line) {
    const size = encoder.encode(character).length
    // 74 octets pour la première ligne, les suivantes étant préfixées d'une
    // espace qui compte dans la limite.
    if (bytes + size > (out.length === 0 ? 75 : 74)) {
      out.push(current)
      current = ''
      bytes = 0
    }
    current += character
    bytes += size
  }
  if (current.length > 0) out.push(current)

  return out.join('\r\n ')
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

/** Construit le fichier iCalendar du rappel quotidien. */
export function buildReminderIcs(options: ReminderOptions): string {
  const { hour, minute, goalMinutes, startDate } = options
  const date = startDate.replace(/-/g, '')
  const uid = options.uid ?? `mandarine-rappel-${date}`

  const summary = `Chinois : ${String(goalMinutes)} minutes`
  const description =
    'Séance quotidienne de chinois dans Mandarine. ' +
    'Les révisions dues d’abord, les nouveaux mots ensuite.'

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mandarine//Rappel quotidien//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    // Heure flottante, sans fuseau : l'événement se déclenche à l'heure
    // locale de l'appareil, où qu'il soit.
    `DTSTART:${date}T${pad(hour)}${pad(minute)}00`,
    `DURATION:PT${String(goalMinutes)}M`,
    'RRULE:FREQ=DAILY',
    `SUMMARY:${escapeText(summary)}`,
    `DESCRIPTION:${escapeText(description)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'TRIGGER:PT0M',
    `DESCRIPTION:${escapeText(summary)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  // La RFC impose CRLF, et certains agendas refusent un simple LF.
  return `${lines.map((line) => foldLine(line)).join('\r\n')}\r\n`
}

export function reminderFileName(): string {
  return 'mandarine-rappel-quotidien.ics'
}

/** `19:30` devient `{ hour: 19, minute: 30 }`. `undefined` si la forme est mauvaise. */
export function parseTime(value: string): { hour: number; minute: number } | undefined {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (match === null) return undefined

  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return undefined

  return { hour, minute }
}
