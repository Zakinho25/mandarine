import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Le bandeau dépend d'un module virtuel fourni par le greffon PWA, qui
 * n'existe qu'au build. On le remplace donc ici pour pouvoir éprouver les
 * deux états qui comptent : rien à signaler, et mise à jour disponible.
 */

let besoin = false
const setBesoin = vi.fn((valeur: boolean) => {
  besoin = valeur
})
const mettreAJour = vi.fn(async () => undefined)

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [besoin, setBesoin],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: mettreAJour,
  }),
}))

const { BandeauMiseAJour } = await import('./BandeauMiseAJour')

beforeEach(() => {
  besoin = false
  setBesoin.mockClear()
  mettreAJour.mockClear()
})

describe('BandeauMiseAJour', () => {
  it('ne s’affiche pas tant qu’il n’y a rien de neuf', () => {
    const { container } = render(<BandeauMiseAJour />)
    expect(container).toBeEmptyDOMElement()
  })

  it('annonce la nouvelle version sans la forcer', () => {
    besoin = true
    render(<BandeauMiseAJour />)

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText('Une nouvelle version est prête.')).toBeInTheDocument()
    // La crainte légitime devant un bouton de mise à jour, levée d'avance.
    expect(screen.getByText('Ta progression est conservée.')).toBeInTheDocument()
    expect(mettreAJour).not.toHaveBeenCalled()
  })

  it('bascule quand on le demande', async () => {
    besoin = true
    const user = userEvent.setup()
    render(<BandeauMiseAJour />)

    await user.click(screen.getByRole('button', { name: 'Mettre à jour' }))
    expect(mettreAJour).toHaveBeenCalledWith(true)
  })

  it('se laisse écarter', async () => {
    besoin = true
    const user = userEvent.setup()
    render(<BandeauMiseAJour />)

    await user.click(screen.getByRole('button', { name: 'Plus tard' }))
    expect(setBesoin).toHaveBeenCalledWith(false)
    expect(mettreAJour).not.toHaveBeenCalled()
  })
})
