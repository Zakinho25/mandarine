/**
 * Détection de hauteur par l'algorithme YIN.
 *
 * (de Cheveigné et Kawahara, 2002.) C'est l'algorithme que le cahier des
 * charges nomme, et il est bien adapté : robuste sur la voix, sans
 * apprentissage, et assez simple pour tenir en TypeScript pur et se tester
 * sur des signaux synthétiques.
 *
 * ### Les quatre étapes
 *
 *  1. **Fonction de différence** : à quel point le signal ressemble-t-il à
 *     lui-même décalé de τ échantillons.
 *  2. **Normalisation cumulée** : divise par la moyenne des différences
 *     précédentes. C'est ce qui évite de choisir systématiquement τ = 0.
 *  3. **Seuil absolu** : on prend le premier creux sous le seuil, pas le plus
 *     profond. Sans cela, l'algorithme confond régulièrement la fondamentale
 *     avec son octave.
 *  4. **Interpolation parabolique** : affine le minimum entre deux
 *     échantillons, sans quoi la précision plafonne à quelques hertz.
 */

export interface PitchOptions {
  /** Hauteur la plus basse recherchée, en hertz. */
  readonly minHz?: number
  /** Hauteur la plus haute recherchée, en hertz. */
  readonly maxHz?: number
  /**
   * Seuil du creux. Plus il est bas, plus l'algorithme est exigeant : il
   * rejette davantage de trames mais se trompe moins.
   */
  readonly threshold?: number
}

export interface PitchResult {
  /** Fréquence fondamentale en hertz, `null` si aucune n'est fiable. */
  readonly hz: number | null
  /**
   * Confiance entre 0 et 1. C'est `1 - d'(τ)` : la profondeur du creux
   * retenu. Une voyelle tenue dépasse 0,9, un souffle reste sous 0,5.
   */
  readonly confidence: number
}

const DEFAULTS = { minHz: 60, maxHz: 400, threshold: 0.15 } as const

/**
 * Hauteur d'une trame de signal.
 *
 * La trame doit contenir au moins deux périodes de la plus basse fréquence
 * recherchée : à 60 Hz et 16 kHz, cela fait 534 échantillons. Une trame plus
 * courte renvoie `null` plutôt qu'une valeur inventée.
 */
export function detectPitch(
  frame: Float32Array,
  sampleRate: number,
  options: PitchOptions = {},
): PitchResult {
  const minHz = options.minHz ?? DEFAULTS.minHz
  const maxHz = options.maxHz ?? DEFAULTS.maxHz
  const threshold = options.threshold ?? DEFAULTS.threshold

  const tauMin = Math.max(2, Math.floor(sampleRate / maxHz))
  const tauMax = Math.ceil(sampleRate / minHz)
  /**
   * On cherche une octave plus haut que la borne annoncée, sans accepter ce
   * qu'on y trouve.
   *
   * Un signal périodique à 500 Hz l'est aussi à 250 Hz : en démarrant à
   * `tauMin`, l'algorithme manquerait la vraie période et renverrait
   * tranquillement la moitié. En regardant plus bas, on détecte le cas et on
   * déclare la trame hors plage, ce qui est la seule réponse honnête.
   */
  const tauFloor = Math.max(2, Math.floor(sampleRate / (maxHz * 2)))

  // Il faut pouvoir comparer la trame à elle-même décalée de tauMax.
  if (frame.length < tauMax * 2) return { hz: null, confidence: 0 }

  const half = Math.floor(frame.length / 2)
  const difference = new Float32Array(tauMax + 1)

  for (let tau = tauFloor; tau <= tauMax; tau += 1) {
    let sum = 0
    for (let i = 0; i < half; i += 1) {
      const delta = (frame[i] ?? 0) - (frame[i + tau] ?? 0)
      sum += delta * delta
    }
    difference[tau] = sum
  }

  // Normalisation cumulée.
  const normalized = new Float32Array(tauMax + 1)
  normalized[0] = 1
  let running = 0
  for (let tau = 1; tau <= tauMax; tau += 1) {
    running += difference[tau] ?? 0
    normalized[tau] = running === 0 ? 1 : ((difference[tau] ?? 0) * tau) / running
  }

  // Premier creux sous le seuil, en descendant jusqu'au fond de ce creux.
  let chosen = -1
  for (let tau = tauFloor; tau <= tauMax; tau += 1) {
    if ((normalized[tau] ?? 1) < threshold) {
      let best = tau
      while (best + 1 <= tauMax && (normalized[best + 1] ?? 1) < (normalized[best] ?? 1)) {
        best += 1
      }
      chosen = best
      break
    }
  }

  if (chosen === -1) return { hz: null, confidence: 0 }
  // La vraie période est plus courte que ce qu'on accepte : signal trop aigu.
  if (chosen < tauMin) return { hz: null, confidence: 0 }

  // Interpolation parabolique autour du minimum.
  const previous = normalized[chosen - 1] ?? normalized[chosen] ?? 1
  const current = normalized[chosen] ?? 1
  const next = normalized[chosen + 1] ?? current
  const denominator = 2 * (2 * current - next - previous)
  const shift = denominator === 0 ? 0 : (next - previous) / denominator
  const tau = chosen + shift

  const hz = sampleRate / tau
  if (hz < minHz || hz > maxHz) return { hz: null, confidence: 0 }

  return { hz, confidence: Math.max(0, Math.min(1, 1 - current)) }
}

/**
 * Sous-échantillonne un signal, par moyenne glissante.
 *
 * YIN coûte O(fenêtre × τmax) par trame : à 48 kHz, chercher jusqu'à 60 Hz
 * demande presque un million d'opérations par trame. À 16 kHz, c'est neuf
 * fois moins, et la voix n'y perd rien — sa fondamentale ne dépasse jamais
 * 400 Hz. La moyenne sert de filtre anti-repliement sommaire mais suffisant.
 */
export function downsample(
  samples: Float32Array,
  from: number,
  to: number,
): Float32Array {
  if (to >= from) return samples

  const ratio = from / to
  const length = Math.floor(samples.length / ratio)
  const out = new Float32Array(length)

  for (let i = 0; i < length; i += 1) {
    const start = Math.floor(i * ratio)
    const end = Math.min(samples.length, Math.floor((i + 1) * ratio))
    let sum = 0
    for (let j = start; j < end; j += 1) sum += samples[j] ?? 0
    out[i] = end > start ? sum / (end - start) : 0
  }

  return out
}

/** Énergie efficace d'une trame, pour écarter le silence avant tout calcul. */
export function rms(frame: Float32Array): number {
  let sum = 0
  for (const sample of frame) sum += sample * sample
  return Math.sqrt(sum / Math.max(1, frame.length))
}
