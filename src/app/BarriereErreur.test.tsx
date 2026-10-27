import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BarriereErreur } from './BarriereErreur'

/**
 * La barrière n'est utile que le jour où elle sert, et ce jour-là personne ne
 * sera là pour la tester à la main. D'où ces tests : ils provoquent les deux
 * pannes qu'elle doit distinguer.
 */

const recharger = vi.fn()

function Casse({ message }: { readonly message: string }): never {
  throw new Error(message)
}

function rendre(message: string) {
  return render(
    <BarriereErreur>
      <Casse message={message} />
    </BarriereErreur>,
  )
}

beforeEach(() => {
  recharger.mockClear()
  sessionStorage.clear()
  // React signale toute erreur attrapée par une barrière : ici c'est voulu,
  // et le bruit masquerait de vraies erreurs dans la sortie des tests.
  vi.spyOn(console, 'error').mockImplementation(() => {})
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...window.location, reload: recharger },
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('BarriereErreur', () => {
  it('laisse passer ce qui fonctionne', () => {
    render(
      <BarriereErreur>
        <p>Tout va bien</p>
      </BarriereErreur>,
    )
    expect(screen.getByText('Tout va bien')).toBeInTheDocument()
    expect(recharger).not.toHaveBeenCalled()
  })

  it('recharge une fois quand un écran n’a pas pu être téléchargé', () => {
    rendre('Failed to fetch dynamically imported module: /assets/Ecran-abc.js')

    expect(recharger).toHaveBeenCalledTimes(1)
    expect(
      screen.getByRole('heading', { name: 'Cet écran n’a pas pu être chargé' }),
    ).toBeInTheDocument()
  })

  it('reconnaît aussi la formulation de Safari', () => {
    rendre('Importing a module script failed.')
    expect(recharger).toHaveBeenCalledTimes(1)
  })

  it('ne recharge pas deux fois de suite', () => {
    // Le garde-fou qui évite la boucle : sans lui, un fichier définitivement
    // absent ferait tourner la page en rond.
    sessionStorage.setItem('mandarine:recharge-apres-echec', '2026-03-01T10:00:00.000Z')
    rendre('Failed to fetch dynamically imported module: /assets/Ecran-abc.js')

    expect(recharger).not.toHaveBeenCalled()
    expect(screen.getByText(/n’a rien changé/)).toBeInTheDocument()
  })

  it('affiche un vrai défaut sans recharger', () => {
    rendre('Cannot read properties of undefined')

    expect(recharger).not.toHaveBeenCalled()
    expect(
      screen.getByRole('heading', { name: 'Quelque chose a cassé' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Cannot read properties of undefined')).toBeInTheDocument()
  })

  it('rassure sur la progression quand l’application casse', () => {
    rendre('Cannot read properties of undefined')
    expect(screen.getByText(/progression n’est pas touchée/)).toBeInTheDocument()
  })

  it('laisse toujours de quoi repartir', () => {
    rendre('Cannot read properties of undefined')
    expect(
      screen.getByRole('button', { name: 'Recharger l’application' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: 'Revenir au tableau de bord' }),
    ).toBeInTheDocument()
  })

  it('annonce la panne aux lecteurs d’écran', () => {
    rendre('Cannot read properties of undefined')
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})
