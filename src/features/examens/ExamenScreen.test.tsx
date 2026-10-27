import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { vivierDeTest } from '@/domain/examen/fixture'
import {
  definitionDe,
  type Longueur,
  type Section,
} from '@/domain/examen/format'
import { genererExamen, itemsDe, type Item } from '@/domain/examen/generation'

/**
 * Déroulé d'un examen blanc, de l'écran d'accueil au bilan.
 *
 * Le vivier est synthétique : ce test porte sur la conduite de l'épreuve —
 * chronomètre par section, navigation, correction — pas sur la qualité du
 * contenu, qui a ses propres tests dans `scripts/data/`.
 */

const SEED = 5
const LEVEL = 1
const LONGUEUR: Longueur = 'court'

const VIVIER = vivierDeTest({ level: LEVEL })
const enregistrerResultat = vi.fn(async () => undefined)

vi.mock('@/data/examens', () => ({
  construireVivier: async () => VIVIER,
  enregistrerResultat: async (...args: unknown[]) =>
    enregistrerResultat(...(args as [])),
  listerResultats: async () => [],
}))

vi.mock('@/data/content', () => ({ loadLexemeMap: async () => new Map() }))

vi.mock('@/data/cards', () => ({ recordListening: async () => undefined }))

vi.mock('@/data/grammaire', () => ({
  loadGrammaireIndex: async () => ({
    format: 'mandarine-grammaire',
    version: 1,
    count: 0,
    contentStatus: 'auto_checked',
    points: [],
  }),
}))

vi.mock('@/data/speech', () => ({
  detectSpeech: async () => ({ supported: true, voice: null, problem: null }),
  speak: () => {},
  stopSpeaking: () => {},
}))

const { ExamenScreen } = await import('./ExamenScreen')

/** Le même examen que celui que l'écran va fabriquer : mêmes graine et vivier. */
const EXAMEN = genererExamen(VIVIER, {
  level: LEVEL,
  longueur: LONGUEUR,
  seed: SEED,
  creeA: '2026-03-01T10:00:00.000Z',
})

function itemsDeSection(section: Section): readonly Item[] {
  return EXAMEN.parties
    .filter((partie) => definitionDe(partie.id).section === section)
    .flatMap((partie) => partie.items)
}

function texteDuBon(item: Item): string {
  const choix = item.choix.find((candidat) => candidat.id === item.bonne)
  return choix?.fr ?? choix?.zh ?? ''
}

function renderScreen() {
  return render(
    <MemoryRouter
      initialEntries={[`/examens/${String(LEVEL)}/${LONGUEUR}/${String(SEED)}`]}
    >
      <Routes>
        <Route path="/examens/:level/:longueur/:seed" element={<ExamenScreen />} />
      </Routes>
    </MemoryRouter>,
  )
}

async function attendreIntro(titre: string): Promise<void> {
  await waitFor(
    () => {
      expect(screen.getByRole('heading', { level: 1, name: titre })).toBeInTheDocument()
    },
    { timeout: 5000 },
  )
}

type Utilisateur = ReturnType<typeof userEvent.setup>

/** Répond à tous les items d'une section, juste ou faux selon le prédicat. */
async function passerSection(
  user: Utilisateur,
  section: Section,
  juste: (index: number) => boolean,
): Promise<void> {
  await user.click(screen.getByRole('button', { name: 'Démarrer le chrono' }))
  const items = itemsDeSection(section)

  for (const [index, item] of items.entries()) {
    if (juste(index)) {
      await user.click(screen.getByRole('button', { name: texteDuBon(item) }))
    }
    const dernier = index + 1 >= items.length
    await user.click(
      screen.getByRole('button', {
        name: dernier ? 'Terminer cette épreuve' : 'Suivante',
      }),
    )
  }
}

beforeEach(() => {
  enregistrerResultat.mockClear()
})

describe('ExamenScreen', () => {
  it('annonce l’épreuve et son chrono avant de la lancer', async () => {
    renderScreen()
    await attendreIntro('Compréhension orale')
    expect(
      screen.getByText(/12 questions, \d+:\d\d au compteur/),
    ).toBeInTheDocument()
    // Le chrono ne doit pas avoir commencé avant que l'utilisateur le décide.
    expect(screen.getByRole('button', { name: 'Démarrer le chrono' })).toBeEnabled()
  })

  it('prévient quand aucune voix chinoise n’est installée', async () => {
    // La machine de développement n'en a pas, et c'est le cas que l'écran
    // doit annoncer avant de lancer le chrono plutôt qu'au milieu de
    // l'épreuve.
    renderScreen()
    await attendreIntro('Compréhension orale')
    expect(screen.getByText(/Aucune voix chinoise/)).toBeInTheDocument()
  })

  it('pose la première question une fois le chrono lancé', async () => {
    const user = userEvent.setup()
    renderScreen()
    await attendreIntro('Compréhension orale')
    await user.click(screen.getByRole('button', { name: 'Démarrer le chrono' }))

    expect(screen.getByText('Question 1 sur 12')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Précédente' })).toBeDisabled()
  })

  it('enchaîne sur la seconde épreuve, avec son propre chrono', async () => {
    const user = userEvent.setup()
    renderScreen()
    await attendreIntro('Compréhension orale')
    await passerSection(user, 'ecoute', () => false)

    await attendreIntro('Compréhension écrite')
    expect(screen.getByText(/Le pinyin est masqué/)).toBeInTheDocument()
  }, 30_000)

  it('donne 100 % à un sans-faute et le dit', async () => {
    const user = userEvent.setup()
    renderScreen()
    await attendreIntro('Compréhension orale')
    await passerSection(user, 'ecoute', () => true)
    await attendreIntro('Compréhension écrite')
    await passerSection(user, 'lecture', () => true)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Bilan' })).toBeInTheDocument()
    })
    expect(screen.getByText('100 %')).toBeInTheDocument()
    expect(screen.getByText('Au-dessus du seuil')).toBeInTheDocument()
    expect(enregistrerResultat).toHaveBeenCalledTimes(1)
  }, 60_000)

  it('compte les questions sans réponse comme fausses et les signale', async () => {
    const user = userEvent.setup()
    renderScreen()
    await attendreIntro('Compréhension orale')
    await passerSection(user, 'ecoute', () => false)
    await attendreIntro('Compréhension écrite')
    await passerSection(user, 'lecture', () => false)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Bilan' })).toBeInTheDocument()
    })
    expect(screen.getByText('0 %')).toBeInTheDocument()
    expect(screen.getByText('En dessous du seuil')).toBeInTheDocument()
    expect(
      screen.getByText(/questions laissées sans réponse/),
    ).toBeInTheDocument()
  }, 60_000)

  it('redit dans le bilan que le score n’est pas une note officielle', async () => {
    const user = userEvent.setup()
    renderScreen()
    await attendreIntro('Compréhension orale')
    await passerSection(user, 'ecoute', () => true)
    await attendreIntro('Compréhension écrite')
    await passerSection(user, 'lecture', () => true)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Bilan' })).toBeInTheDocument()
    })
    expect(
      screen.getByText(/n’est pas une note officielle/),
    ).toBeInTheDocument()
  }, 60_000)

  it('revoit les questions ratées avec la bonne réponse', async () => {
    const user = userEvent.setup()
    renderScreen()
    await attendreIntro('Compréhension orale')
    // Une seule bonne réponse, la première : le bilan doit lister les onze
    // autres avec ce qu'il fallait répondre.
    await passerSection(user, 'ecoute', (index) => index === 0)
    await attendreIntro('Compréhension écrite')
    await passerSection(user, 'lecture', () => false)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'Bilan' })).toBeInTheDocument()
    })
    expect(screen.getByText('Revoir les questions ratées')).toBeInTheDocument()
    const rates = itemsDe(EXAMEN).length - 1
    expect(screen.getAllByText(/^La bonne :/)).toHaveLength(rates)
  }, 60_000)
})
