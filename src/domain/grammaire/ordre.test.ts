import { describe, expect, it } from 'vitest'
import { seededRandom } from '../random'
import { assembler, deplacer, melanger, verifier, type Morceau } from './ordre'

const SOURCE = {
  morceaux: ['我', '昨天', '买了', '两本书'],
  acceptes: ['我昨天买了两本书', '昨天我买了两本书'],
}

function places(ids: readonly number[]): Morceau[] {
  return ids.map((id) => {
    const text = SOURCE.morceaux[id]
    if (text === undefined) throw new Error(`morceau ${String(id)} inconnu`)
    return { id, text }
  })
}

describe('melanger', () => {
  it('garde tous les morceaux', () => {
    const tire = melanger(SOURCE, seededRandom(1))
    expect([...tire].map((morceau) => morceau.id).sort()).toEqual([0, 1, 2, 3])
  })

  it('ne tombe jamais sur une réponse acceptée', () => {
    // Un exercice posé déjà résolu ne demande rien. On vérifie sur beaucoup
    // de graines, parce que c'est le hasard qu'on met à l'épreuve.
    for (let seed = 1; seed <= 200; seed += 1) {
      const tire = melanger(SOURCE, seededRandom(seed))
      expect(SOURCE.acceptes, `graine ${String(seed)}`).not.toContain(assembler(tire))
    }
  })

  it('ne boucle pas quand tous les ordres sont acceptés', () => {
    // Cas dégénéré : si la source accepte tout, le mélange doit quand même
    // rendre quelque chose plutôt que de tourner.
    const tout = { morceaux: ['一', '一', '一'], acceptes: ['一一一'] }
    expect(melanger(tout, seededRandom(3))).toHaveLength(3)
  })
})

describe('verifier', () => {
  it('accepte l’ordre canonique', () => {
    const resultat = verifier(places([0, 1, 2, 3]), SOURCE)
    expect(resultat.juste).toBe(true)
    expect(resultat.phrase).toBe('我昨天买了两本书')
    expect(resultat.premierEcart).toBeNull()
  })

  it('accepte un ordre alternatif déclaré', () => {
    // 昨天我 et 我昨天 sont tous deux corrects : refuser le second
    // apprendrait une règle fausse.
    expect(verifier(places([1, 0, 2, 3]), SOURCE).juste).toBe(true)
  })

  it('refuse un ordre faux et situe l’erreur', () => {
    const resultat = verifier(places([2, 0, 1, 3]), SOURCE)
    expect(resultat.juste).toBe(false)
    expect(resultat.premierEcart).toBe(1)
  })

  it('situe l’erreur au premier morceau mal placé, pas au dernier', () => {
    const resultat = verifier(places([0, 2, 1, 3]), SOURCE)
    expect(resultat.premierEcart).toBe(2)
  })

  it('rend la phrase assemblée même quand elle est fausse', () => {
    expect(verifier(places([3, 2, 1, 0]), SOURCE).phrase).toBe('两本书买了昨天我')
  })
})

describe('deplacer', () => {
  it('avance un morceau', () => {
    const resultat = deplacer(places([0, 1, 2, 3]), 0, 2)
    expect(resultat.map((morceau) => morceau.id)).toEqual([1, 2, 0, 3])
  })

  it('recule un morceau', () => {
    const resultat = deplacer(places([0, 1, 2, 3]), 3, 0)
    expect(resultat.map((morceau) => morceau.id)).toEqual([3, 0, 1, 2])
  })

  it('borne la cible aux extrémités', () => {
    const resultat = deplacer(places([0, 1, 2, 3]), 1, 99)
    expect(resultat.map((morceau) => morceau.id)).toEqual([0, 2, 3, 1])
  })

  it('ne modifie pas la liste reçue', () => {
    const depart = places([0, 1, 2, 3])
    deplacer(depart, 0, 3)
    expect(depart.map((morceau) => morceau.id)).toEqual([0, 1, 2, 3])
  })

  it('ignore un indice hors liste', () => {
    const resultat = deplacer(places([0, 1, 2]), 7, 0)
    expect(resultat.map((morceau) => morceau.id)).toEqual([0, 1, 2])
  })
})
