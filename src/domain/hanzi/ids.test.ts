import { describe, expect, it } from 'vitest'
import { isAtomic, isIdsOperator, leaves, parseIds, topLevelParts } from './ids'

describe('parseIds', () => {
  it('analyse une décomposition simple', () => {
    // 好 = 女 et 子 côte à côte.
    expect(parseIds('⿰女子')).toEqual({
      kind: 'compound',
      operator: '⿰',
      parts: [
        { kind: 'leaf', char: '女' },
        { kind: 'leaf', char: '子' },
      ],
    })
  })

  it('analyse les opérateurs à trois parties', () => {
    const tree = parseIds('⿲彳丨亍')
    expect(tree?.kind).toBe('compound')
    expect(leaves(tree ?? { kind: 'unknown' })).toEqual(['彳', '丨', '亍'])
  })

  it('analyse les décompositions imbriquées', () => {
    // 想 = (木 et 目 côte à côte) au-dessus de 心.
    const tree = parseIds('⿱⿰木目心')
    expect(leaves(tree ?? { kind: 'unknown' })).toEqual(['木', '目', '心'])
  })

  it('reconnaît un caractère non décomposable', () => {
    expect(parseIds('女')).toEqual({ kind: 'leaf', char: '女' })
  })

  it('reconnaît un composant inconnu', () => {
    expect(parseIds('？')).toEqual({ kind: 'unknown' })
    expect(parseIds('⿰女？')?.kind).toBe('compound')
  })

  it('refuse une expression incomplète', () => {
    // Un opérateur binaire sans son second opérande : mieux vaut ne rien
    // afficher qu'un arbre deviné.
    expect(parseIds('⿰女')).toBeUndefined()
    expect(parseIds('⿰')).toBeUndefined()
    expect(parseIds('')).toBeUndefined()
  })

  it('refuse une expression qui déborde', () => {
    expect(parseIds('⿰女子子')).toBeUndefined()
  })
})

describe('leaves', () => {
  it('ignore les composants inconnus', () => {
    const tree = parseIds('⿰女？')
    expect(leaves(tree ?? { kind: 'unknown' })).toEqual(['女'])
  })
})

describe('topLevelParts', () => {
  it('ne descend que d’un cran', () => {
    // 想 se montre comme 相 + 心 si les données le décrivent ainsi.
    expect(topLevelParts(parseIds('⿱相心') ?? { kind: 'unknown' })).toEqual(['相', '心'])
  })

  it('aplatit les sous-arbres pour rester lisible', () => {
    expect(topLevelParts(parseIds('⿱⿰木目心') ?? { kind: 'unknown' })).toEqual([
      '木',
      '目',
      '心',
    ])
  })

  it('ne renvoie rien pour un caractère simple', () => {
    expect(topLevelParts({ kind: 'leaf', char: '女' })).toEqual([])
  })
})

describe('isAtomic', () => {
  it('considère un caractère égal à lui-même comme indécomposable', () => {
    expect(isAtomic(parseIds('女'), '女')).toBe(true)
  })

  it('considère un composé comme décomposable', () => {
    expect(isAtomic(parseIds('⿰女子'), '好')).toBe(false)
  })

  it('traite l’absence de données comme indécomposable', () => {
    expect(isAtomic(undefined, '女')).toBe(true)
    expect(isAtomic(parseIds('？'), '女')).toBe(true)
  })
})

describe('isIdsOperator', () => {
  it('reconnaît les douze opérateurs', () => {
    for (const operator of '⿰⿱⿲⿳⿴⿵⿶⿷⿸⿹⿺⿻') {
      expect(isIdsOperator(operator), operator).toBe(true)
    }
  })

  it('ne confond pas un caractère ordinaire avec un opérateur', () => {
    expect(isIdsOperator('女')).toBe(false)
    expect(isIdsOperator('？')).toBe(false)
  })
})
