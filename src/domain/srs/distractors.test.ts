import { describe, expect, it } from 'vitest'
import { seededRandom } from '../random'
import {
  pickDistractors,
  sharesMeaning,
  similarity,
  tonePattern,
  type DistractorItem,
} from './distractors'

function item(
  id: string,
  simplified: string,
  pinyinNum: string,
  ...glossFr: string[]
): DistractorItem {
  return { id, simplified, pinyinNum, glossFr }
}

const XUEXI = item('xuexi', '学习', 'xue2 xi2', 'étudier', 'apprendre')
const XUESHENG = item('xuesheng', '学生', 'xue2 sheng1', 'élève', 'étudiant')
const SHIJIAN = item('shijian', '时间', 'shi2 jian1', 'temps', 'durée')
const TUSHUGUAN = item('tushuguan', '图书馆', 'tu2 shu1 guan3', 'bibliothèque')
const NIHAO = item('nihao', '你好', 'ni3 hao3', 'bonjour')
const APPRENDRE = item('xuedao', '学到', 'xue2 dao4', 'apprendre')

describe('tonePattern', () => {
  it('décrit la suite des tons', () => {
    expect(tonePattern('ni3 hao3')).toBe('3-3')
    expect(tonePattern('xue2 xi2')).toBe('2-2')
    expect(tonePattern('ba4 ba5')).toBe('4-5')
  })
})

describe('sharesMeaning', () => {
  it('repère deux mots qui partagent un sens', () => {
    // 学到 veut aussi dire « apprendre » : l'opposer à 学习 rendrait la
    // mauvaise réponse défendable.
    expect(sharesMeaning(XUEXI, APPRENDRE)).toBe(true)
  })

  it('ignore les accents et la casse', () => {
    expect(sharesMeaning(XUEXI, item('x', 'x', 'x1', 'ETUDIER'))).toBe(true)
  })

  it('n’en voit pas là où il n’y en a pas', () => {
    expect(sharesMeaning(XUEXI, SHIJIAN)).toBe(false)
  })
})

describe('similarity', () => {
  it('rapproche les mots qui partagent un caractère', () => {
    expect(similarity(XUEXI, XUESHENG)).toBeGreaterThan(similarity(XUEXI, SHIJIAN))
  })

  it('rapproche les mots de même schéma tonal', () => {
    const sameTones = item('a', '时间', 'xie2 ci2', 'autre chose')
    const otherTones = item('b', '别的', 'bie2 de5', 'autre chose aussi')
    expect(similarity(XUEXI, sameTones)).toBeGreaterThan(similarity(XUEXI, otherTones))
  })

  it('éloigne les mots de longueur et de son différents', () => {
    expect(similarity(NIHAO, TUSHUGUAN)).toBeLessThan(similarity(NIHAO, XUESHENG))
  })

  it('refuse un mot d’être son propre distracteur', () => {
    expect(similarity(XUEXI, XUEXI)).toBe(-1)
  })
})

describe('pickDistractors', () => {
  const pool = [XUESHENG, SHIJIAN, TUSHUGUAN, NIHAO, APPRENDRE]

  it('rend le nombre demandé', () => {
    const picked = pickDistractors(XUEXI, pool, seededRandom(1), { count: 3 })
    expect(picked).toHaveLength(3)
  })

  it('n’inclut jamais le mot cible', () => {
    const picked = pickDistractors(XUEXI, [...pool, XUEXI], seededRandom(2), { count: 4 })
    expect(picked.map((p) => p.id)).not.toContain('xuexi')
  })

  it('écarte les mots qui partagent un sens avec la cible', () => {
    const picked = pickDistractors(XUEXI, pool, seededRandom(3), { count: 4 })
    expect(picked.map((p) => p.id)).not.toContain('xuedao')
  })

  it('privilégie les mots proches quand le vivier est serré', () => {
    // Avec un seul distracteur demandé et un vivier étroit, on doit obtenir
    // le mot le plus confondable, pas le plus éloigné.
    const picked = pickDistractors(XUEXI, [TUSHUGUAN, XUESHENG], seededRandom(4), {
      count: 1,
      poolFactor: 1,
    })
    expect(picked[0]?.id).toBe('xuesheng')
  })

  it('se rejoue à l’identique avec la même graine', () => {
    const a = pickDistractors(XUEXI, pool, seededRandom(7), { count: 3 })
    const b = pickDistractors(XUEXI, pool, seededRandom(7), { count: 3 })
    expect(a.map((p) => p.id)).toEqual(b.map((p) => p.id))
  })

  it('varie d’une graine à l’autre', () => {
    const seeds = [1, 2, 3, 4, 5, 6].map((seed) =>
      pickDistractors(XUEXI, pool, seededRandom(seed), { count: 2 })
        .map((p) => p.id)
        .join(','),
    )
    expect(new Set(seeds).size).toBeGreaterThan(1)
  })

  it('ne renvoie pas plus que ce que le vivier permet', () => {
    const picked = pickDistractors(XUEXI, [XUESHENG], seededRandom(9), { count: 3 })
    expect(picked).toHaveLength(1)
  })
})
