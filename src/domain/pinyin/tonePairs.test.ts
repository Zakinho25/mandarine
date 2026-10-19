import { describe, expect, it } from 'vitest'
import {
  availablePairs,
  groupByTonePair,
  nearbyPairs,
  pairKey,
  pairLabel,
  TONE_PAIRS,
  type PairCandidate,
} from './tonePairs'

function word(id: string, pinyinNum: string): PairCandidate {
  return { id, pinyinNum }
}

describe('TONE_PAIRS', () => {
  it('compte bien vingt combinaisons', () => {
    // Quatre tons pleins en première syllabe, cinq possibilités en seconde
    // puisque le ton neutre n'existe qu'en seconde position.
    expect(TONE_PAIRS).toHaveLength(20)
  })

  it('n’a aucun doublon', () => {
    const keys = TONE_PAIRS.map(([a, b]) => pairKey(a, b))
    expect(new Set(keys).size).toBe(20)
  })

  it('ne met jamais le ton neutre en première syllabe', () => {
    expect(TONE_PAIRS.every(([first]) => first !== 5)).toBe(true)
  })
})

describe('pairLabel', () => {
  it('nomme le ton neutre plutôt que de l’appeler 5', () => {
    expect(pairLabel(3, 5)).toBe('3 · neutre')
    expect(pairLabel(2, 4)).toBe('2 · 4')
  })
})

describe('groupByTonePair', () => {
  it('range les mots par combinaison', () => {
    const groups = groupByTonePair([
      word('nihao', 'ni3 hao3'),
      word('henhao', 'hen3 hao3'),
      word('xuexi', 'xue2 xi2'),
    ])
    expect(groups.get('3-3')?.map((w) => w.id)).toEqual(['nihao', 'henhao'])
    expect(groups.get('2-2')?.map((w) => w.id)).toEqual(['xuexi'])
  })

  it('range les mots à seconde syllabe neutre', () => {
    expect(groupByTonePair([word('baba', 'ba4 ba5')]).get('4-5')).toHaveLength(1)
  })

  it('écarte ce qui n’a pas exactement deux syllabes', () => {
    const groups = groupByTonePair([
      word('ai', 'ai4'),
      word('tushuguan', 'tu2 shu1 guan3'),
      word('haowanr', 'hao3 wan2 r5'),
    ])
    expect(groups.size).toBe(0)
  })

  it('écarte une première syllabe au ton neutre', () => {
    // `5-3` n'est pas une des vingt paires enseignées.
    expect(groupByTonePair([word('bizarre', 'de5 hao3')]).size).toBe(0)
  })

  it('accepte une liste vide', () => {
    expect(groupByTonePair([]).size).toBe(0)
  })
})

describe('nearbyPairs', () => {
  it('ne retient que les paires différant d’un seul ton', () => {
    const voisines = nearbyPairs('2-4')
    expect(voisines).toContain('2-3') // même premier ton
    expect(voisines).toContain('1-4') // même second ton
    expect(voisines).not.toContain('1-3') // les deux changent : trop facile
    expect(voisines).not.toContain('2-4') // la paire elle-même
  })

  it('compte le bon nombre de voisines', () => {
    // 4 premiers tons et 5 seconds : 4 voisines par le second, 3 par le premier.
    expect(nearbyPairs('3-3')).toHaveLength(7)
  })

  it('traite le ton neutre comme les autres', () => {
    expect(nearbyPairs('4-5')).toContain('4-1')
    expect(nearbyPairs('4-1')).toContain('4-5')
  })

  it('renvoie une liste vide sur une clé invalide', () => {
    expect(nearbyPairs('')).toEqual([])
  })
})

describe('availablePairs', () => {
  it('ne retient que les combinaisons qui ont un exemple', () => {
    const groups = groupByTonePair([word('nihao', 'ni3 hao3'), word('xuexi', 'xue2 xi2')])
    expect(availablePairs(groups).sort()).toEqual(['2-2', '3-3'])
  })

  it('conserve l’ordre canonique des paires', () => {
    const groups = groupByTonePair([
      word('a', 'ba4 ba5'),
      word('b', 'ni3 hao3'),
      word('c', 'xue2 xi2'),
    ])
    expect(availablePairs(groups)).toEqual(['2-2', '3-3', '4-5'])
  })
})
