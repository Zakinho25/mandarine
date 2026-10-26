import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Déroulé d'un exercice d'écoute, de bout en bout.
 *
 * Ce test existe parce qu'il ne peut pas être fait autrement : l'exercice est
 * verrouillé tant qu'aucune voix chinoise n'est disponible, et la machine de
 * développement n'en a pas. On simule donc la voix et on vérifie l'enchaînement
 * complet — ce qu'aucun passage dans le navigateur ne pourrait couvrir ici.
 */

const speak = vi.fn()
const recordListening = vi.fn(async () => {})

vi.mock('@/data/speech', () => ({
  detectSpeech: async () => ({
    supported: true,
    voice: { lang: 'zh-CN', name: 'Voix de test' },
    problem: null,
  }),
  speak: (...args: unknown[]) => {
    speak(...args)
  },
  stopSpeaking: () => {},
}))

vi.mock('@/data/cards', () => ({
  recordListening: async (...args: unknown[]) => recordListening(...(args as [])),
}))

vi.mock('@/data/content', () => ({
  loadIndex: async () => ({
    levels: [{ level: 1, file: 'hsk-1.json', count: 2, cumulative: 2 }],
  }),
  // Chaque combinaison du jeu d'essai doit avoir au moins une voisine, sinon
  // l'exercice ne peut proposer que la bonne réponse — et le test dépendrait
  // du tirage. 再见 (4-4) a été écarté pour cette raison : il est isolé ici.
  loadLevel: async () => ({
    lexemes: [
      ['nihao', '你好', 'ni3 hao3', 'bonjour'],
      ['xuexi', '学习', 'xue2 xi2', 'étudier'],
      ['laoshi', '老师', 'lao3 shi1', 'professeur'],
      ['meiyou', '没有', 'mei2 you3', 'ne pas avoir'],
      ['women', '我们', 'wo3 men5', 'nous'],
      ['shijian', '时间', 'shi2 jian1', 'temps'],
    ].map(([id, simplified, pinyinNum, gloss]) => ({
      id,
      simplified,
      pinyinNum,
      pinyinMark: '',
      glossFr: [gloss],
    })),
  }),
}))

const { EcouteScreen } = await import('./EcouteScreen')

function renderScreen() {
  return render(
    <MemoryRouter>
      <EcouteScreen />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  speak.mockClear()
  recordListening.mockClear()
})

describe('exercice d’écoute', () => {
  it('déroule une série entière et compte le temps passé', async () => {
    const user = userEvent.setup()
    renderScreen()

    const start = await screen.findByRole('button', { name: /Un ton/ })
    await waitFor(
      () => {
        expect(start).toBeEnabled()
      },
      // Le demarrage de jsdom depasse parfois la seconde sur une machine
      // chargee : l'attente par defaut rendait ce test instable en CI.
      { timeout: 5000 },
    )
    await user.click(start)

    // On ne voit jamais le caractère avant d'avoir répondu : sinon l'exercice
    // se résout à l'œil et plus à l'oreille.
    expect(screen.getByText('Quel ton entends-tu ?')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Suivant' })).not.toBeInTheDocument()

    for (let question = 0; question < 10; question += 1) {
      const options = screen.getAllByRole('button', { name: /ton/ })
      const choice = options.find((button) => /1er|2e|3e|4e/.test(button.textContent ?? ''))
      expect(choice, `question ${String(question + 1)}`).toBeDefined()
      if (choice === undefined) break

      await user.click(choice)

      const last = question === 9
      const next = await screen.findByRole('button', {
        name: last ? 'Terminer' : 'Suivant',
      })
      await user.click(next)
    }

    expect(await screen.findByText(/Série terminée/)).toBeInTheDocument()
    expect(recordListening).toHaveBeenCalledTimes(1)
  })

  it('fait entendre le mot au moment où la réponse est révélée', async () => {
    const user = userEvent.setup()
    renderScreen()

    const start = await screen.findByRole('button', { name: /Un ton/ })
    await waitFor(
      () => {
        expect(start).toBeEnabled()
      },
      // Le demarrage de jsdom depasse parfois la seconde sur une machine
      // chargee : l'attente par defaut rendait ce test instable en CI.
      { timeout: 5000 },
    )
    await user.click(start)

    expect(speak).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: /1er ton/ }))
    expect(speak).toHaveBeenCalled()
  })

  it('propose le bouton de réécoute dès la question posée', async () => {
    const user = userEvent.setup()
    renderScreen()

    const start = await screen.findByRole('button', { name: /Un ton/ })
    await waitFor(
      () => {
        expect(start).toBeEnabled()
      },
      // Le demarrage de jsdom depasse parfois la seconde sur une machine
      // chargee : l'attente par defaut rendait ce test instable en CI.
      { timeout: 5000 },
    )
    await user.click(start)

    const replay = screen.getByRole('button', { name: 'Réécouter' })
    await user.click(replay)
    expect(speak).toHaveBeenCalledTimes(1)
  })

  it('attend le vocabulaire avant d’autoriser l’exercice de paires', async () => {
    renderScreen()
    const pairs = await screen.findByRole('button', { name: /Deux tons/ })

    // Le vocabulaire arrive de façon asynchrone : le bouton ne doit s'activer
    // qu'une fois les mots disponibles, sinon la série serait vide.
    await waitFor(
      () => {
        expect(pairs).toBeEnabled()
      },
      { timeout: 5000 },
    )

    const user = userEvent.setup()
    await user.click(pairs)
    expect(screen.getByText('Quelle suite de tons ?')).toBeInTheDocument()

    const options = within(screen.getByRole('list')).getAllByRole('button')
    expect(options.length).toBeGreaterThanOrEqual(2)
  })
})
