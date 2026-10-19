import { describe, expect, it } from 'vitest'
import type { ComponentGloss } from './composants'
import { resolveComponent } from './hanzi'

const GLOSSES: Record<string, ComponentGloss> = {
  女: { meaning: 'femme' },
  氵: { meaning: 'eau', note: 'Forme réduite de 水, à gauche.' },
}

const VOCABULAIRE: Record<string, string> = {
  不: 'ne… pas',
  女: 'femme (mot du vocabulaire)',
}

const chercher = (character: string): string | undefined => VOCABULAIRE[character]

describe('resolveComponent', () => {
  it('préfère la table rédigée au vocabulaire', () => {
    // Le sens d'un composant n'est pas toujours celui du mot : la table dit
    // ce que le composant apporte au caractère.
    const result = resolveComponent('女', chercher, GLOSSES)
    expect(result.meaning).toBe('femme')
    expect(result.source).toBe('composant')
  })

  it('remonte la note quand il y en a une', () => {
    expect(resolveComponent('氵', chercher, GLOSSES).note).toContain('Forme réduite')
  })

  it('se rabat sur le vocabulaire', () => {
    const result = resolveComponent('不', chercher, GLOSSES)
    expect(result.meaning).toBe('ne… pas')
    expect(result.source).toBe('vocabulaire')
  })

  it('assume de ne pas savoir', () => {
    // Inventer un sens serait pire que de n'en donner aucun.
    const result = resolveComponent('龘', chercher, GLOSSES)
    expect(result.meaning).toBeNull()
    expect(result.source).toBeNull()
  })

  it('ignore une définition vide', () => {
    const result = resolveComponent('x', () => '', GLOSSES)
    expect(result.source).toBeNull()
  })
})
