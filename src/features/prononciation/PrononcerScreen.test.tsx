import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Déroulé complet de l'exercice de prononciation, du clic sur « Enregistrer »
 * jusqu'au verdict.
 *
 * Ce test existe parce qu'il ne peut pas être fait autrement : la machine de
 * développement n'a pas de micro utilisable, et aucun passage dans le
 * navigateur ne pourrait couvrir ce chemin. On remplace donc l'enregistrement
 * par un signal synthétique dont on connaît le contour, et on vérifie que
 * l'analyse le reconnaît.
 */

const RATE = 16000

/** Signal dont la hauteur suit les paliers donnés, en hertz. */
function glide(levels: readonly number[], seconds = 1.2): Float32Array {
  const length = Math.floor(seconds * RATE)
  const out = new Float32Array(length)
  let phase = 0
  for (let i = 0; i < length; i += 1) {
    const position = (i / (length - 1)) * (levels.length - 1)
    const low = Math.floor(position)
    const high = Math.min(levels.length - 1, low + 1)
    const ratio = position - low
    const hz = (levels[low] ?? 150) + ratio * ((levels[high] ?? 150) - (levels[low] ?? 150))
    phase += (2 * Math.PI * hz) / RATE
    out[i] = 0.5 * Math.sin(phase) + 0.25 * Math.sin(2 * phase)
  }
  return out
}

/** Hauteurs correspondant aux niveaux de Chao pour une voix centrée sur 150 Hz. */
const chao = (...levels: number[]): number[] =>
  levels.map((level) => 150 * 2 ** (((level - 3) * 3) / 12))

let prochainSignal: Float32Array = glide(chao(3, 5))
const recordListening = vi.fn(async () => {})

vi.mock('@/data/micro', () => ({
  MicroError: class MicroError extends Error {},
  MICRO_MESSAGES: {},
  startRecording: async () => ({
    stop: async () => ({
      samples: prochainSignal,
      sampleRate: RATE,
      durationMs: 1200,
    }),
    cancel: () => {
      /* rien à libérer dans un test */
    },
  }),
}))

vi.mock('@/data/cards', () => ({
  recordListening: async (...args: unknown[]) => recordListening(...(args as [])),
}))

vi.mock('@/data/speech', () => ({
  detectSpeech: async () => ({ supported: true, voice: null, problem: null }),
  speak: () => {},
  stopSpeaking: () => {},
}))

const { PrononcerScreen } = await import('./PrononcerScreen')

function renderScreen() {
  return render(
    <MemoryRouter>
      <PrononcerScreen />
    </MemoryRouter>,
  )
}

async function enregistrer(user: ReturnType<typeof userEvent.setup>): Promise<void> {
  await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
  await waitFor(
    () => {
      expect(screen.getByRole('button', { name: 'Arrêter' })).toBeInTheDocument()
    },
    { timeout: 5000 },
  )
  await user.click(screen.getByRole('button', { name: 'Arrêter' }))
}

beforeEach(() => {
  recordListening.mockClear()
  prochainSignal = glide(chao(3, 5))
})

describe('exercice de prononciation', () => {
  it('reconnaît un contour juste', async () => {
    const user = userEvent.setup()
    renderScreen()

    // Le deuxième ton, montant, correspond au signal synthétique.
    await user.click(screen.getByRole('button', { name: /2.*ton/ }))
    await enregistrer(user)

    expect(await screen.findByText(/Contour juste/)).toBeInTheDocument()
    expect(screen.getByText(/c’est bien celui qui était visé/)).toBeInTheDocument()
  })

  it('signale un ton différent de celui qui était visé', async () => {
    const user = userEvent.setup()
    // On produit un quatrième ton, descendant, alors que le deuxième est visé.
    prochainSignal = glide(chao(5, 1))
    renderScreen()

    await user.click(screen.getByRole('button', { name: /2.*ton/ }))
    await enregistrer(user)

    expect(await screen.findByText(/Contour à retravailler/)).toBeInTheDocument()
    expect(screen.getByText(/alors que le 2e était visé/)).toBeInTheDocument()
  })

  it('refuse d’analyser un enregistrement muet', async () => {
    const user = userEvent.setup()
    prochainSignal = new Float32Array(RATE)
    renderScreen()
    await enregistrer(user)

    expect(await screen.findByText(/Rien n’a été entendu/)).toBeInTheDocument()
  })

  it('refuse d’analyser un enregistrement trop court', async () => {
    const user = userEvent.setup()
    prochainSignal = glide(chao(5, 5), 0.08)
    renderScreen()
    await enregistrer(user)

    expect(await screen.findByText(/trop court/)).toBeInTheDocument()
  })

  it('compte le temps passé comme du travail d’écoute', async () => {
    const user = userEvent.setup()
    renderScreen()
    await enregistrer(user)

    await waitFor(() => {
      expect(recordListening).toHaveBeenCalled()
    })
  })

  it('efface le résultat quand on change de ton', async () => {
    // Sans cela, le verdict du ton précédent resterait affiché sous le
    // nouveau contour, ce qui serait trompeur.
    const user = userEvent.setup()
    renderScreen()

    await user.click(screen.getByRole('button', { name: /2.*ton/ }))
    await enregistrer(user)
    expect(await screen.findByText(/Contour juste/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /4.*ton/ }))
    expect(screen.queryByText(/Contour juste/)).not.toBeInTheDocument()
  })
})
