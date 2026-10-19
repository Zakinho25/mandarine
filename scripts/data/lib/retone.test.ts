import { describe, expect, it } from 'vitest'
import { retone } from './retone.ts'

describe('retone', () => {
  it('reprend le ton plein du syllabus là où le dictionnaire note un ton neutre', () => {
    expect(retone('xue2 sheng5', 'xuéshēng')).toBe('xue2 sheng1')
    expect(retone('tai4 yang5', 'tàiyáng')).toBe('tai4 yang2')
    expect(retone('guan1 xi5', 'guānxì')).toBe('guan1 xi4')
  })

  it('reprend aussi le ton neutre quand c’est le syllabus qui le donne', () => {
    expect(retone('wang3 shang4', 'wǎngshang')).toBe('wang3 shang5')
  })

  it('ne touche à rien quand les deux sources s’accordent', () => {
    expect(retone('ni3 hao3', 'nǐhǎo')).toBe('ni3 hao3')
    expect(retone('ai4', 'ài')).toBe('ai4')
  })

  it('protège le ton de citation de 一 et 不', () => {
    // Le syllabus imprime le résultat du sandhi : 一下 s'y lit `yíxià`.
    // On conserve `yi1`, et c'est la règle de sandhi qui produira `yí`.
    expect(retone('yi1 xia4', 'yíxià')).toBe('yi1 xia4')
    expect(retone('bu4 ke4 qi5', 'búkèqi')).toBe('bu4 ke4 qi5')
    // Les autres syllabes du mot restent alignées sur le syllabus.
    expect(retone('yi1 dian3 r5', 'yìdiǎnr')).toBe('yi1 dian3 r5')
  })

  it('gère le suffixe érhua', () => {
    expect(retone('hao3 wan2 r5', 'hǎowánr')).toBe('hao3 wan2 r5')
    expect(retone('mian4 tiao2 r5', 'miàntiáor')).toBe('mian4 tiao2 r5')
  })

  it('gère le ü sous ses différentes écritures', () => {
    expect(retone('nü3 er2', 'nǚér')).toBe('nü3 er2')
    expect(retone('lü4 shi1', 'lǜshī')).toBe('lü4 shi1')
  })

  it('renvoie l’entrée inchangée quand le découpage ne tombe pas juste', () => {
    // Mot différent : aucun alignement possible, on ne devine pas.
    expect(retone('ni3 hao3', 'zàijiàn')).toBe('ni3 hao3')
    expect(retone('ni3 hao3', 'nǐ')).toBe('ni3 hao3')
    expect(retone('', 'nǐhǎo')).toBe('')
  })
})
