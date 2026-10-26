import { describe, expect, it } from 'vitest'
import { detectPitch, downsample, rms } from './yin'

const RATE = 16000

/** Sinusoïde pure, le cas d'école. */
function sine(hz: number, length: number, rate = RATE, amplitude = 0.5): Float32Array {
  const out = new Float32Array(length)
  for (let i = 0; i < length; i += 1) {
    out[i] = amplitude * Math.sin((2 * Math.PI * hz * i) / rate)
  }
  return out
}

/** Signal plus proche d'une voix : fondamentale et harmoniques décroissantes. */
function voiced(hz: number, length: number, rate = RATE): Float32Array {
  const out = new Float32Array(length)
  for (let i = 0; i < length; i += 1) {
    const t = i / rate
    out[i] =
      0.5 * Math.sin(2 * Math.PI * hz * t) +
      0.3 * Math.sin(4 * Math.PI * hz * t) +
      0.15 * Math.sin(6 * Math.PI * hz * t)
  }
  return out
}

function noise(length: number): Float32Array {
  const out = new Float32Array(length)
  for (let i = 0; i < length; i += 1) out[i] = (Math.random() - 0.5) * 0.2
  return out
}

describe('detectPitch', () => {
  it('retrouve la hauteur d’une sinusoïde', () => {
    for (const hz of [100, 150, 220, 330]) {
      const result = detectPitch(sine(hz, 2048), RATE)
      expect(result.hz, `${String(hz)} Hz`).toBeCloseTo(hz, 0)
      expect(result.confidence).toBeGreaterThan(0.9)
    }
  })

  it('retrouve la fondamentale malgré les harmoniques', () => {
    // Le piège classique : sans la normalisation cumulée, l'algorithme
    // choisirait l'octave au lieu de la fondamentale.
    const result = detectPitch(voiced(120, 2048), RATE)
    expect(result.hz).toBeCloseTo(120, 0)
  })

  it('reste précis à un hertz près', () => {
    const result = detectPitch(sine(187, 2048), RATE)
    expect(Math.abs((result.hz ?? 0) - 187)).toBeLessThan(1)
  })

  it('ne trouve rien dans du silence', () => {
    expect(detectPitch(new Float32Array(2048), RATE).hz).toBeNull()
  })

  it('ne trouve rien dans du bruit', () => {
    // Un souffle ne doit pas produire une hauteur : mieux vaut une trame
    // vide qu'une valeur inventée.
    const resultats = Array.from({ length: 10 }, () => detectPitch(noise(2048), RATE))
    const trouvees = resultats.filter((r) => r.hz !== null)
    expect(trouvees.length).toBeLessThanOrEqual(2)
  })

  it('refuse une trame trop courte', () => {
    // À 60 Hz minimum, il faut 534 échantillons par période : une trame de
    // 256 ne peut rien affirmer.
    expect(detectPitch(sine(100, 256), RATE).hz).toBeNull()
  })

  it('respecte les bornes de fréquence', () => {
    const horsBornes = detectPitch(sine(500, 2048), RATE, { minHz: 60, maxHz: 400 })
    expect(horsBornes.hz).toBeNull()
  })

  it('suit un réglage de bornes plus large', () => {
    const result = detectPitch(sine(500, 4096), RATE, { minHz: 60, maxHz: 800 })
    expect(result.hz).toBeCloseTo(500, 0)
  })
})

describe('downsample', () => {
  it('réduit la longueur dans le bon rapport', () => {
    expect(downsample(new Float32Array(48000), 48000, 16000)).toHaveLength(16000)
  })

  it('conserve la hauteur du signal', () => {
    // C'est tout l'enjeu : diviser le coût de calcul par neuf sans perdre la
    // fondamentale.
    const reduit = downsample(sine(200, 48000, 48000), 48000, 16000)
    expect(detectPitch(reduit, 16000).hz).toBeCloseTo(200, 0)
  })

  it('ne touche à rien si la cadence ne baisse pas', () => {
    const original = sine(200, 1024)
    expect(downsample(original, 16000, 16000)).toBe(original)
  })
})

describe('cas limites', () => {
  it('accepte un seuil plus strict', () => {
    // Un seuil très bas rejette les trames dont le creux n'est pas net.
    const strict = detectPitch(noise(2048), RATE, { threshold: 0.02 })
    expect(strict.hz).toBeNull()
  })

  it('rend une confiance comprise entre 0 et 1', () => {
    for (const frame of [sine(150, 2048), voiced(200, 2048), noise(2048)]) {
      const result = detectPitch(frame, RATE)
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
    }
  })

  it('ne trouve rien dans un signal continu sans oscillation', () => {
    const constant = new Float32Array(2048).fill(0.5)
    expect(detectPitch(constant, RATE).hz).toBeNull()
  })

  it('sous-échantillonne un signal très court sans planter', () => {
    expect(downsample(new Float32Array(3), 48000, 16000)).toHaveLength(1)
  })

  it('sous-échantillonne un signal vide', () => {
    expect(downsample(new Float32Array(0), 48000, 16000)).toHaveLength(0)
  })
})

describe('rms', () => {
  it('vaut zéro sur du silence', () => {
    expect(rms(new Float32Array(1024))).toBe(0)
  })

  it('croît avec l’amplitude', () => {
    expect(rms(sine(200, 1024, RATE, 0.8))).toBeGreaterThan(
      rms(sine(200, 1024, RATE, 0.2)),
    )
  })

  it('donne la valeur efficace connue d’une sinusoïde', () => {
    // Une sinusoïde d'amplitude A a pour valeur efficace A/√2.
    expect(rms(sine(200, 16000, RATE, 1))).toBeCloseTo(1 / Math.SQRT2, 2)
  })
})
