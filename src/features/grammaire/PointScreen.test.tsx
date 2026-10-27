import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Déroulé de l'exercice de remise en ordre, du mélange jusqu'au verdict.
 *
 * Le contenu est remplacé par une fiche fabriquée : le test porte sur
 * l'exercice, pas sur la grammaire. Une fiche réelle ferait dépendre ce test
 * d'une régénération de données, et un échec ne dirait plus où est la faute.
 */

const MORCEAUX = ['我', '昨天', '买了', '两本书'] as const

const POINT = {
  id: 'le-accompli',
  level: 1,
  categorie: 'aspect',
  titre: 'Le 了 de l’accompli',
  markers: ['了'],
  resume: 'Après le verbe, il marque l’achèvement.',
  explication: ['Premier paragraphe.', 'Second paragraphe.'],
  piege: 'La négation fait tomber le 了.',
  exemples: [
    {
      fr: 'J’ai mangé.',
      tokens: [
        { text: '我', lexemeId: 'wo' },
        { text: '吃了', lexemeId: null },
      ],
    },
    {
      fr: 'Il a acheté deux livres.',
      tokens: [{ text: '他', lexemeId: null }],
    },
  ],
  ordre: {
    morceaux: MORCEAUX.map((text) => ({ text, tokens: [{ text, lexemeId: null }] })),
    fr: 'Hier, j’ai acheté deux livres.',
    acceptes: ['我昨天买了两本书', '昨天我买了两本书'],
    tokens: MORCEAUX.map((text) => ({ text, lexemeId: null })),
  },
}

const recordOrdre = vi.fn(async () => undefined)

vi.mock('@/data/grammaire', () => ({
  loadGrammaireIndex: async () => ({
    format: 'mandarine-grammaire',
    version: 1,
    count: 1,
    contentStatus: 'auto_checked',
    points: [{ id: POINT.id, level: 1, categorie: 'aspect', titre: POINT.titre, markers: POINT.markers, resume: POINT.resume }],
  }),
  loadGrammaireNiveau: async () => ({
    format: 'mandarine-grammaire-niveau',
    version: 1,
    level: 1,
    contentStatus: 'auto_checked',
    count: 1,
    points: [POINT],
  }),
}))

vi.mock('@/data/points', () => ({
  recordOrdre: async (...args: unknown[]) => recordOrdre(...(args as [])),
}))

vi.mock('@/data/content', () => ({
  loadLexemeMap: async () => new Map(),
}))

vi.mock('@/data/speech', () => ({
  detectSpeech: async () => ({ supported: true, voice: null, problem: null }),
  speak: () => {},
  stopSpeaking: () => {},
}))

const { PointScreen } = await import('./PointScreen')

function renderScreen() {
  return render(
    <MemoryRouter initialEntries={[`/grammaire/${POINT.id}`]}>
      <Routes>
        <Route path="/grammaire/:id" element={<PointScreen />} />
      </Routes>
    </MemoryRouter>,
  )
}

/** Clique les morceaux dans l'ordre demandé, en les prenant dans le vivier. */
async function placer(user: ReturnType<typeof userEvent.setup>, ordre: readonly string[]) {
  for (const texte of ordre) {
    await user.click(screen.getByRole('button', { name: `Placer ${texte}` }))
  }
}

beforeEach(() => {
  recordOrdre.mockClear()
})

describe('PointScreen', () => {
  it('affiche la fiche, son piège et ses exemples', async () => {
    renderScreen()
    await waitFor(
      () => {
        expect(screen.getByText(POINT.titre)).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
    expect(screen.getByText(POINT.piege)).toBeInTheDocument()
    expect(screen.getByText('Premier paragraphe.')).toBeInTheDocument()
    expect(screen.getByText('J’ai mangé.')).toBeInTheDocument()
  })

  it('propose les morceaux mélangés, jamais déjà dans l’ordre', async () => {
    renderScreen()
    await waitFor(
      () => {
        expect(screen.getByText(POINT.titre)).toBeInTheDocument()
      },
      { timeout: 5000 },
    )
    const proposes = screen
      .getAllByRole('button', { name: /^Placer / })
      .map((bouton) => bouton.textContent)
    expect(proposes).toHaveLength(MORCEAUX.length)
    expect(proposes.join('')).not.toBe(POINT.ordre.acceptes[0])
  })

  it('accepte l’ordre canonique', async () => {
    const user = userEvent.setup()
    renderScreen()
    await waitFor(
      () => {
        expect(screen.getByText(POINT.titre)).toBeInTheDocument()
      },
      { timeout: 5000 },
    )

    await placer(user, MORCEAUX)
    await user.click(screen.getByRole('button', { name: 'Vérifier' }))

    expect(screen.getByText('C’est l’ordre juste.')).toBeInTheDocument()
    expect(recordOrdre).toHaveBeenCalledWith(POINT.id, true)
  })

  it('accepte un ordre alternatif déclaré', async () => {
    const user = userEvent.setup()
    renderScreen()
    await waitFor(
      () => {
        expect(screen.getByText(POINT.titre)).toBeInTheDocument()
      },
      { timeout: 5000 },
    )

    await placer(user, ['昨天', '我', '买了', '两本书'])
    await user.click(screen.getByRole('button', { name: 'Vérifier' }))

    expect(screen.getByText('C’est l’ordre juste.')).toBeInTheDocument()
  })

  it('refuse un ordre faux et situe la première erreur', async () => {
    const user = userEvent.setup()
    renderScreen()
    await waitFor(
      () => {
        expect(screen.getByText(POINT.titre)).toBeInTheDocument()
      },
      { timeout: 5000 },
    )

    await placer(user, ['买了', '我', '昨天', '两本书'])
    await user.click(screen.getByRole('button', { name: 'Vérifier' }))

    expect(screen.getByText('Ce n’est pas encore ça.')).toBeInTheDocument()
    expect(
      screen.getByText('Le premier morceau mal placé est en position 1.'),
    ).toBeInTheDocument()
    expect(recordOrdre).toHaveBeenCalledWith(POINT.id, false)
  })

  it('n’autorise la vérification qu’une fois tous les morceaux placés', async () => {
    const user = userEvent.setup()
    renderScreen()
    await waitFor(
      () => {
        expect(screen.getByText(POINT.titre)).toBeInTheDocument()
      },
      { timeout: 5000 },
    )

    expect(screen.getByRole('button', { name: 'Vérifier' })).toBeDisabled()
    await placer(user, MORCEAUX.slice(0, 2))
    expect(screen.getByRole('button', { name: 'Vérifier' })).toBeDisabled()
    await placer(user, MORCEAUX.slice(2))
    expect(screen.getByRole('button', { name: 'Vérifier' })).toBeEnabled()
  })

  it('permet de retirer un morceau déjà placé', async () => {
    const user = userEvent.setup()
    renderScreen()
    await waitFor(
      () => {
        expect(screen.getByText(POINT.titre)).toBeInTheDocument()
      },
      { timeout: 5000 },
    )

    await placer(user, ['我'])
    await user.click(
      screen.getByRole('button', { name: 'Retirer 我, en position 1' }),
    )
    expect(screen.getByRole('button', { name: 'Placer 我' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Vérifier' })).toBeDisabled()
  })
})
