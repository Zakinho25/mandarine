import { describe, expect, it } from 'vitest'
import { checkPinyin, isAcceptable, suggestedNote } from './grading'

describe('checkPinyin', () => {
  it('accepte toutes les façons raisonnables d’écrire la bonne réponse', () => {
    for (const answer of ['ni3 hao3', 'ni3hao3', 'nǐ hǎo', 'nǐhǎo', 'NǏHǍO', ' Ni3Hao3 ']) {
      expect(checkPinyin('ni3 hao3', answer), answer).toBe('exact')
    }
  })

  it('accepte le ü sous ses trois écritures', () => {
    for (const answer of ['nü3', 'nv3', 'nu:3', 'nǚ']) {
      expect(checkPinyin('nü3', answer), answer).toBe('exact')
    }
  })

  it('n’exige pas d’écrire le ton neutre', () => {
    expect(checkPinyin('ba4 ba5', 'ba4ba')).toBe('exact')
    expect(checkPinyin('ba4 ba5', 'ba4ba5')).toBe('exact')
    expect(checkPinyin('ba4 ba5', 'bàba')).toBe('exact')
  })

  it('distingue le ton oublié du ton faux', () => {
    // La distinction porte tout le propos de l'application : oublier de noter
    // un ton n'est pas la même erreur que se tromper de ton.
    expect(checkPinyin('ni3 hao3', 'nihao')).toBe('tons_manquants')
    expect(checkPinyin('ni3 hao3', 'ni2 hao3')).toBe('tons_faux')
    expect(checkPinyin('ni3 hao3', 'nī hǎo')).toBe('tons_faux')
  })

  it('signale un ton partiellement indiqué comme un ton faux', () => {
    // Écrire un ton sur deux, c'est affirmer que le second est neutre.
    expect(checkPinyin('ni3 hao3', 'ni3hao')).toBe('tons_faux')
  })

  it('rejette un mot différent', () => {
    expect(checkPinyin('ni3 hao3', 'zai4 jian4')).toBe('faux')
    expect(checkPinyin('ni3 hao3', 'ni3')).toBe('faux')
    expect(checkPinyin('ni3 hao3', 'ni3 hao3 ma5')).toBe('faux')
    expect(checkPinyin('ni3 hao3', 'nihoa')).toBe('faux')
  })

  it('rejette une réponse vide ou une attente vide', () => {
    expect(checkPinyin('ni3 hao3', '')).toBe('faux')
    expect(checkPinyin('ni3 hao3', '   ')).toBe('faux')
    expect(checkPinyin('', 'ni3 hao3')).toBe('faux')
  })

  it('gère l’érhua', () => {
    expect(checkPinyin('hao3 wan2 r5', 'hǎowánr')).toBe('exact')
    expect(checkPinyin('hao3 wan2 r5', 'hao3wan2r')).toBe('exact')
  })
})

describe('suggestedNote', () => {
  it('relance la carte sur un ton faux', () => {
    expect(suggestedNote('tons_faux')).toBe('encore')
    expect(suggestedNote('faux')).toBe('encore')
  })

  it('propose « difficile » quand seuls les tons manquent', () => {
    expect(suggestedNote('tons_manquants')).toBe('difficile')
  })

  it('propose « correct » sur une réponse exacte', () => {
    expect(suggestedNote('exact')).toBe('correct')
  })
})

describe('isAcceptable', () => {
  it('ne compte comme réussite que l’exact et le ton oublié', () => {
    expect(isAcceptable('exact')).toBe(true)
    expect(isAcceptable('tons_manquants')).toBe(true)
    expect(isAcceptable('tons_faux')).toBe(false)
    expect(isAcceptable('faux')).toBe(false)
  })
})
