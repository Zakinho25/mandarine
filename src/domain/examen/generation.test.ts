import { describe, expect, it } from 'vitest'
import { vivierDeTest } from './fixture'
import { dureeSection, PARTIES, partiesDe } from './format'
import { genererExamen, itemsDe, restreindre, TROU, type Examen } from './generation'

const CREE_A = '2026-03-01T10:00:00.000Z'

function examen(seed = 1, longueur: 'court' | 'complet' = 'complet', level = 1): Examen {
  return genererExamen(vivierDeTest({ level }), {
    level,
    longueur,
    seed,
    creeA: CREE_A,
  })
}

describe('genererExamen', () => {
  it('remplit les six parties', () => {
    const resultat = examen()
    expect(resultat.parties).toHaveLength(6)
    for (const partie of resultat.parties) {
      expect(partie.items.length, partie.id).toBeGreaterThan(0)
      expect(partie.manquants, partie.id).toBe(0)
    }
  })

  it('respecte le nombre d’items annoncé', () => {
    for (const longueur of ['court', 'complet'] as const) {
      const resultat = examen(1, longueur)
      for (const partie of resultat.parties) {
        const attendu = PARTIES.find((def) => def.id === partie.id)?.items[longueur]
        expect(partie.items.length, `${partie.id} ${longueur}`).toBe(attendu)
      }
    }
  })

  it('se rejoue à l’identique avec la même graine', () => {
    expect(examen(42)).toEqual(examen(42))
  })

  it('donne un examen différent avec une autre graine', () => {
    const a = itemsDe(examen(1)).map((item) => item.bonne)
    const b = itemsDe(examen(2)).map((item) => item.bonne)
    expect(a).not.toEqual(b)
  })

  it('n’emploie jamais deux fois la même source', () => {
    // Retrouver la même phrase dans deux parties donnerait une bonne réponse
    // gratuite à qui l'a déjà vue. La garantie porte sur la source, pas sur
    // la bonne réponse : deux phrases différentes peuvent légitimement faire
    // un trou sur le même mot.
    const sources = itemsDe(examen(7)).map((item) => item.source)
    expect(new Set(sources).size).toBe(sources.length)
  })

  it('trace chaque item jusqu’à sa source', () => {
    const vivier = vivierDeTest()
    const connues = new Set([
      ...vivier.mots.map((mot) => mot.id),
      ...vivier.phrases.map((phrase) => phrase.id),
      ...vivier.echanges.map((echange) => echange.id),
      ...vivier.passages.map((passage) => passage.id),
    ])
    for (const item of itemsDe(examen(7))) {
      expect(connues, item.id).toContain(item.source)
    }
  })

  it('place toujours la bonne réponse parmi les choix', () => {
    for (const item of itemsDe(examen(13))) {
      expect(
        item.choix.map((choix) => choix.id),
        item.id,
      ).toContain(item.bonne)
    }
  })

  it('ne propose jamais deux fois le même choix', () => {
    for (const item of itemsDe(examen(13))) {
      const ids = item.choix.map((choix) => choix.id)
      expect(new Set(ids).size, item.id).toBe(ids.length)
      const textes = item.choix.map((choix) => choix.fr ?? choix.zh)
      expect(new Set(textes).size, item.id).toBe(textes.length)
    }
  })

  it('donne de l’audio à l’écoute et un énoncé à la lecture', () => {
    for (const item of itemsDe(examen(5))) {
      const section = PARTIES.find((def) => def.id === item.partie)?.section
      if (section === 'ecoute') {
        expect(item.audio, item.id).not.toBeNull()
        // Afficher l'énoncé d'un item d'écoute le rendrait lisible, donc
        // inutile.
        expect(item.enonce, item.id).toBeNull()
      } else {
        expect(item.audio, item.id).toBeNull()
        expect(item.enonce, item.id).not.toBeNull()
      }
    }
  })

  it('creuse exactement un trou par item à compléter', () => {
    const items = itemsDe(examen(9)).filter((item) => item.partie === 'lecture-trou')
    expect(items.length).toBeGreaterThan(0)
    for (const item of items) {
      const trous = (item.enonce ?? []).filter((jeton) => jeton.text === TROU)
      expect(trous, item.id).toHaveLength(1)
    }
  })

  it('rattache un item à trou à son point de grammaire quand il porte sur un marqueur', () => {
    const items = itemsDe(examen(3)).filter((item) => item.partie === 'lecture-trou')
    expect(items.some((item) => item.pointId !== null)).toBe(true)
  })

  it('ne verse pas les mots d’un passage dans ceux d’un item d’écoute', () => {
    for (const item of itemsDe(examen(11))) {
      expect(new Set(item.lexemeIds).size, item.id).toBe(item.lexemeIds.length)
    }
  })

  it('annonce les items manquants au lieu d’en inventer', () => {
    // Un vivier presque vide ne doit pas produire d'items bancals : il doit
    // produire moins d'items, et le dire.
    const maigre = genererExamen(
      vivierDeTest({ mots: 5, phrases: 2, echanges: 1, passages: 2 }),
      { level: 1, longueur: 'complet', seed: 1, creeA: CREE_A },
    )
    const total = maigre.parties.reduce((somme, partie) => somme + partie.items.length, 0)
    const manquants = maigre.parties.reduce((somme, partie) => somme + partie.manquants, 0)
    expect(total).toBeLessThan(60)
    expect(manquants).toBeGreaterThan(0)
    expect(total + manquants).toBe(60)
  })

  it('survit à un vivier vide', () => {
    const vide = genererExamen(
      { mots: [], phrases: [], echanges: [], passages: [], marqueurs: [] },
      { level: 3, longueur: 'court', seed: 1, creeA: CREE_A },
    )
    expect(itemsDe(vide)).toHaveLength(0)
    expect(vide.parties.every((partie) => partie.manquants === 4)).toBe(true)
  })
})

describe('restreindre', () => {
  it('écarte la matière au-dessus du niveau', () => {
    const melange = {
      ...vivierDeTest({ level: 3 }),
      mots: [
        ...vivierDeTest({ level: 1, mots: 3 }).mots,
        ...vivierDeTest({ level: 3, mots: 3 }).mots.map((mot) => ({
          ...mot,
          id: `${mot.id}-haut`,
        })),
      ],
    }
    const restreint = restreindre(melange, 1)
    expect(restreint.mots).toHaveLength(3)
    expect(restreint.phrases).toHaveLength(0)
  })

  it('ne garde aucun mot hors niveau dans les choix d’un examen', () => {
    const vivier = {
      ...vivierDeTest({ level: 1 }),
      mots: [
        ...vivierDeTest({ level: 1 }).mots,
        {
          id: 'interdit',
          simplified: '禁',
          pinyinNum: 'jin4',
          glossFr: ['hors niveau'],
          level: 3,
        },
      ],
    }
    const resultat = genererExamen(vivier, {
      level: 1,
      longueur: 'complet',
      seed: 21,
      creeA: CREE_A,
    })
    for (const item of itemsDe(resultat)) {
      expect(item.choix.map((choix) => choix.id), item.id).not.toContain('interdit')
    }
  })
})

describe('format', () => {
  it('répartit les parties entre les deux sections', () => {
    expect(partiesDe('ecoute')).toHaveLength(3)
    expect(partiesDe('lecture')).toHaveLength(3)
  })

  it('donne une durée plus longue à l’épreuve complète', () => {
    expect(dureeSection('ecoute', 'complet')).toBeGreaterThan(
      dureeSection('ecoute', 'court'),
    )
    expect(dureeSection('lecture', 'complet')).toBeGreaterThan(0)
  })
})
