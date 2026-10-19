import { describe, expect, it } from 'vitest'
import { fold, matches, search, type Searchable } from './search'

const nihao: Searchable = {
  simplified: '你好',
  traditional: '你好',
  pinyinNum: 'ni3 hao3',
  pinyinMark: 'nǐhǎo',
  glossFr: ['bonjour', 'salut'],
}

const xuexi: Searchable = {
  simplified: '学习',
  traditional: '學習',
  pinyinNum: 'xue2 xi2',
  pinyinMark: 'xuéxí',
  glossFr: ['étudier', 'apprendre'],
}

describe('fold', () => {
  it('retire accents, casse et ponctuation', () => {
    expect(fold('Étudier')).toBe('etudier')
    expect(fold('nǐ hǎo !')).toBe('nihao')
    expect(fold('  ')).toBe('')
  })

  it('conserve les caractères chinois', () => {
    expect(fold('学习')).toBe('学习')
  })
})

describe('matches', () => {
  it('trouve par caractères', () => {
    expect(matches(nihao, '你好')).toBe(true)
    expect(matches(nihao, '你')).toBe(true)
    expect(matches(xuexi, '學習')).toBe(true)
  })

  it('trouve par pinyin sans ton ni diacritique', () => {
    // C'est le cas d'usage réel : personne ne tape les chiffres de ton.
    expect(matches(nihao, 'nihao')).toBe(true)
    expect(matches(nihao, 'ni hao')).toBe(true)
    expect(matches(xuexi, 'xuexi')).toBe(true)
  })

  it('trouve par pinyin accentué', () => {
    expect(matches(xuexi, 'xué')).toBe(true)
  })

  it('trouve par définition française, accent ou non', () => {
    expect(matches(xuexi, 'étudier')).toBe(true)
    expect(matches(xuexi, 'etudier')).toBe(true)
    expect(matches(nihao, 'SALUT')).toBe(true)
  })

  it('rejette ce qui ne correspond pas', () => {
    expect(matches(nihao, 'manger')).toBe(false)
    expect(matches(xuexi, 'zzz')).toBe(false)
  })

  it('accepte tout sur une requête vide', () => {
    expect(matches(nihao, '')).toBe(true)
    expect(matches(nihao, '   ')).toBe(true)
  })
})

describe('search', () => {
  it('préserve l’ordre de la liste', () => {
    expect(search([nihao, xuexi], 'r').map((item) => item.simplified)).toEqual([
      '你好',
      '学习',
    ])
  })

  it('renvoie la liste entière sur une requête vide', () => {
    expect(search([nihao, xuexi], '')).toHaveLength(2)
  })

  it('renvoie une liste vide sans correspondance', () => {
    expect(search([nihao, xuexi], 'introuvable')).toEqual([])
  })
})
