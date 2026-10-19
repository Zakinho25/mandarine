import { describe, expect, it } from 'vitest'
import { pickChineseVoice, type VoiceLike } from './speech'

function voice(lang: string, name: string): VoiceLike {
  return { lang, name }
}

describe('pickChineseVoice', () => {
  it('préfère le mandarin de Chine continentale', () => {
    const voices = [
      voice('fr-FR', 'Amélie'),
      voice('zh-TW', 'Meijia'),
      voice('zh-CN', 'Xiaoxiao'),
    ]
    expect(pickChineseVoice(voices)?.name).toBe('Xiaoxiao')
  })

  it('accepte les étiquettes de langue avec un tiret bas', () => {
    // Certains navigateurs écrivent zh_CN au lieu de zh-CN.
    expect(pickChineseVoice([voice('zh_CN', 'Huihui')])?.name).toBe('Huihui')
  })

  it('accepte les étiquettes étendues', () => {
    expect(pickChineseVoice([voice('cmn-Hans-CN', 'Tingting')])?.name).toBe('Tingting')
    expect(pickChineseVoice([voice('zh-Hans', 'Li-mu')])?.name).toBe('Li-mu')
  })

  it('se rabat sur une autre voix chinoise plutôt que rien', () => {
    expect(pickChineseVoice([voice('zh-HK', 'Sinji')])?.name).toBe('Sinji')
  })

  it('ne confond pas le chinois avec une autre langue', () => {
    expect(pickChineseVoice([voice('fr-FR', 'Amélie'), voice('ja-JP', 'Kyoko')])).toBeNull()
  })

  it('renvoie null sur une liste vide', () => {
    expect(pickChineseVoice([])).toBeNull()
  })
})
