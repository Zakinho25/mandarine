import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Lexeme } from '@/data/content'

/**
 * La carte d'écoute, avec une voix.
 *
 * Elle ne peut pas être vérifiée dans le navigateur de développement : cette
 * machine n'a pas de voix chinoise installée, et c'est justement le cas que
 * l'application traite en mettant ces cartes de côté. Le seul moyen d'éprouver
 * l'autre branche est de simuler la voix.
 *
 * La branche sans voix n'est pas éprouvée ici : `useSpeech` met sa détection
 * en cache au niveau du module, donc elle ne peut pas varier d'un test à
 * l'autre dans un même fichier. Ce que garantit l'application, c'est que ces
 * cartes ne sont pas proposées du tout sans voix, et c'est `skillsRevisables`
 * qui le prouve, dans les tests de la file.
 */

const speak = vi.fn()
const VOIX = { name: 'Voix de test', lang: 'zh-CN' }

vi.mock('@/data/speech', () => ({
  detectSpeech: async () => ({ supported: true, voice: VOIX, problem: null }),
  speak: (...args: unknown[]) => speak(...(args as [])),
  stopSpeaking: () => {},
}))

const { Carte } = await import('./Carte')

function mot(id: string, simplified: string, pinyinNum: string, gloss: string): Lexeme {
  return {
    id,
    simplified,
    traditional: null,
    pinyinNum,
    pinyinMark: pinyinNum,
    pos: [],
    hsk2025: 1,
    hsk2021: null,
    glossFr: [gloss],
    contentStatus: 'auto_checked',
    glossApprox: false,
    freqRank: 1,
    unit: 'essentiels',
  }
}

const CIBLE = mot('学习-xue2xi2', '学习', 'xue2 xi2', 'étudier')
const POOL: Lexeme[] = [
  CIBLE,
  mot('学生-xue2sheng1', '学生', 'xue2 sheng1', 'élève'),
  mot('雪-xue3', '雪', 'xue3', 'neige'),
  mot('学校-xue2xiao4', '学校', 'xue2 xiao4', 'école'),
  mot('休息-xiu1xi2', '休息', 'xiu1 xi2', 'se reposer'),
]

const onAnswered = vi.fn()

function rendre() {
  return render(
    <Carte
      cardId="lexeme:学习-xue2xi2:audio_fr"
      skill="audio_fr"
      lexeme={CIBLE}
      pool={POOL}
      onAnswered={onAnswered}
    />,
  )
}

beforeEach(() => {
  speak.mockClear()
  onAnswered.mockClear()
})

describe('carte d’écoute', () => {
  it('prononce le mot dès l’arrivée', async () => {
    rendre()
    await waitFor(() => {
      expect(speak).toHaveBeenCalledWith('学习', expect.anything())
    })
  })

  it('ne montre pas le caractère avant la réponse', async () => {
    // C'est tout l'exercice : afficher 学习 en ferait une carte de
    // reconnaissance avec du son en décoration.
    rendre()
    await waitFor(() => {
      expect(screen.getByText('Qu’as-tu entendu ?')).toBeInTheDocument()
    })
    expect(screen.queryByText('学习')).not.toBeInTheDocument()
  })

  it('propose quatre sens, dont le bon', async () => {
    rendre()
    await waitFor(() => {
      expect(screen.getByText('étudier')).toBeInTheDocument()
    })
    const choix = screen.getAllByRole('button').filter((bouton) => {
      const texte = bouton.textContent ?? ''
      return POOL.some((entree) => entree.glossFr[0] === texte)
    })
    expect(choix).toHaveLength(4)
  })

  it('ne rejoue le mot que sur demande, jamais en boucle', async () => {
    const user = userEvent.setup()
    rendre()
    await waitFor(() => {
      expect(speak).toHaveBeenCalledTimes(1)
    })

    await user.click(screen.getByRole('button', { name: 'Réécouter le mot' }))
    expect(speak).toHaveBeenCalledTimes(2)
  })

  it('révèle le caractère une fois la réponse donnée', async () => {
    const user = userEvent.setup()
    rendre()
    await waitFor(() => {
      expect(screen.getByText('étudier')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'étudier' }))
    expect(screen.getByText('学习')).toBeInTheDocument()
  })

  it('suggère « correct » quand la réponse est juste', async () => {
    const user = userEvent.setup()
    rendre()
    await waitFor(() => {
      expect(screen.getByText('étudier')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'étudier' }))
    await user.click(screen.getByRole('button', { name: /Correct/i }))

    expect(onAnswered).toHaveBeenCalledWith(
      expect.objectContaining({ note: 'correct', answer: CIBLE.id }),
    )
  })

  it('enregistre la mauvaise réponse telle qu’elle a été donnée', async () => {
    const user = userEvent.setup()
    rendre()
    await waitFor(() => {
      expect(screen.getByText('élève')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: 'élève' }))
    await user.click(screen.getByRole('button', { name: /Encore/i }))

    expect(onAnswered).toHaveBeenCalledWith(
      expect.objectContaining({ note: 'encore', answer: '学生-xue2sheng1' }),
    )
  })
})
