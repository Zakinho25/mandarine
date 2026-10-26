import { detectPitch, downsample, rms } from './yin'

/**
 * Courbe de hauteur d'un enregistrement.
 *
 * Le signal est découpé en trames qui se chevauchent, chacune passée à YIN.
 * Les trames trop faibles ou dont la hauteur n'est pas fiable sont écartées :
 * un contour troué vaut mieux qu'un contour inventé.
 */

export interface PitchPoint {
  /** Position dans l'enregistrement, entre 0 et 1. */
  readonly t: number
  readonly hz: number
  readonly confidence: number
}

export interface ContourOptions {
  /** Cadence de travail. 16 kHz suffit à la voix et divise le calcul par neuf. */
  readonly workingRate?: number
  readonly frameSize?: number
  readonly hop?: number
  /** Confiance minimale pour retenir une trame. */
  readonly minConfidence?: number
  /** Énergie minimale, pour écarter le silence et le souffle. */
  readonly minRms?: number
}

const DEFAULTS = {
  workingRate: 16000,
  frameSize: 1024,
  hop: 256,
  minConfidence: 0.75,
  minRms: 0.01,
} as const

export function extractContour(
  samples: Float32Array,
  sampleRate: number,
  options: ContourOptions = {},
): PitchPoint[] {
  const workingRate = options.workingRate ?? DEFAULTS.workingRate
  const frameSize = options.frameSize ?? DEFAULTS.frameSize
  const hop = options.hop ?? DEFAULTS.hop
  const minConfidence = options.minConfidence ?? DEFAULTS.minConfidence
  const minRms = options.minRms ?? DEFAULTS.minRms

  const signal = downsample(samples, sampleRate, workingRate)
  if (signal.length < frameSize) return []

  const points: PitchPoint[] = []
  const lastStart = signal.length - frameSize

  for (let start = 0; start <= lastStart; start += hop) {
    const frame = signal.subarray(start, start + frameSize)
    if (rms(frame) < minRms) continue

    const { hz, confidence } = detectPitch(frame, workingRate)
    if (hz === null || confidence < minConfidence) continue

    points.push({
      t: lastStart === 0 ? 0 : start / lastStart,
      hz,
      confidence,
    })
  }

  return points
}

export interface NormalizedContour {
  /** Hauteur en demi-tons autour de la moyenne de l'énoncé. */
  readonly points: readonly { t: number; semitones: number }[]
  /** Hauteur de référence du locuteur sur cet énoncé, en hertz. */
  readonly centerHz: number
}

/**
 * Ramène la courbe en demi-tons autour de sa propre moyenne.
 *
 * C'est ce qui rend la comparaison indépendante du locuteur : une voix à
 * 220 Hz et une voix à 110 Hz produisent la même forme une fois centrées. Ce
 * qui distingue les tons, c'est le dessin, pas la hauteur absolue.
 *
 * **Limite assumée :** sur une syllabe isolée, on n'a aucun repère du registre
 * du locuteur. Un premier ton produit trop bas ressemblera donc à un premier
 * ton correct : ce qu'on mesure, c'est sa platitude, pas sa hauteur.
 */
export function normalize(points: readonly PitchPoint[]): NormalizedContour {
  if (points.length === 0) return { points: [], centerHz: 0 }

  const logs = points.map((point) => Math.log2(point.hz))
  const mean = logs.reduce((sum, value) => sum + value, 0) / logs.length

  return {
    centerHz: 2 ** mean,
    points: points.map((point, index) => ({
      t: point.t,
      semitones: 12 * ((logs[index] ?? mean) - mean),
    })),
  }
}

/**
 * Rééchantillonne la courbe en `count` valeurs régulièrement espacées.
 *
 * Les extrémités sont rognées : l'attaque et la chute d'une syllabe portent
 * des artefacts qui n'appartiennent pas au ton.
 */
export function resampleContour(
  contour: NormalizedContour,
  count: number,
  trim = 0.1,
): number[] {
  const inner = contour.points.filter(
    (point) => point.t >= trim && point.t <= 1 - trim,
  )
  const usable = inner.length >= 2 ? inner : contour.points
  if (usable.length === 0) return []
  if (usable.length === 1) {
    return Array.from({ length: count }, () => usable[0]?.semitones ?? 0)
  }

  const first = usable[0]?.t ?? 0
  const last = usable[usable.length - 1]?.t ?? 1
  const span = last - first

  return Array.from({ length: count }, (_, index) => {
    const target = span === 0 ? first : first + (span * index) / (count - 1)

    let after = usable.findIndex((point) => point.t >= target)
    if (after <= 0) after = 1
    const before = usable[after - 1]
    const next = usable[after] ?? usable[usable.length - 1]
    if (before === undefined || next === undefined) return 0

    const width = next.t - before.t
    const ratio = width === 0 ? 0 : (target - before.t) / width
    return before.semitones + ratio * (next.semitones - before.semitones)
  })
}

/** Recentre une suite de valeurs sur sa moyenne. */
export function center(values: readonly number[]): number[] {
  if (values.length === 0) return []
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  return values.map((value) => value - mean)
}
