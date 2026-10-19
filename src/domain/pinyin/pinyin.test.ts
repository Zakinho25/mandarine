import { describe, expect, it } from 'vitest'
import {
  annotate,
  applyToneMark,
  isStructurallyValidSyllable,
  normalizeUmlaut,
  parseSyllable,
  PinyinError,
  splitNumbered,
  stripTone,
  toDiacritics,
  toneMarkIndex,
  toneOf,
  toNumbered,
} from './index'

describe('normalizeUmlaut', () => {
  it('accepte les trois écritures du ü', () => {
    expect(normalizeUmlaut('nv')).toBe('nü')
    expect(normalizeUmlaut('nu:')).toBe('nü')
    expect(normalizeUmlaut('nü')).toBe('nü')
  })

  it('respecte la casse', () => {
    expect(normalizeUmlaut('V')).toBe('Ü')
    expect(normalizeUmlaut('U:')).toBe('Ü')
  })
})

describe('toneMarkIndex', () => {
  it('donne la priorité au a puis au e', () => {
    expect(toneMarkIndex('hao')).toBe(1) // a
    expect(toneMarkIndex('xue')).toBe(2) // e
    expect(toneMarkIndex('bei')).toBe(1) // e
  })

  it('place la marque sur le o de ou', () => {
    expect(toneMarkIndex('zhou')).toBe(2)
    expect(toneMarkIndex('you')).toBe(1)
  })

  it('retombe sur la dernière voyelle', () => {
    expect(toneMarkIndex('liu')).toBe(2) // liú
    expect(toneMarkIndex('gui')).toBe(2) // guì
    expect(toneMarkIndex('nü')).toBe(1)
  })

  it('renvoie -1 sans voyelle', () => {
    expect(toneMarkIndex('ng')).toBe(-1)
    expect(toneMarkIndex('')).toBe(-1)
  })
})

describe('applyToneMark', () => {
  it('pose les quatre tons sur la bonne voyelle', () => {
    expect(applyToneMark('ma', 1)).toBe('mā')
    expect(applyToneMark('ma', 2)).toBe('má')
    expect(applyToneMark('ma', 3)).toBe('mǎ')
    expect(applyToneMark('ma', 4)).toBe('mà')
  })

  it('laisse la syllabe nue au ton neutre', () => {
    expect(applyToneMark('ma', 5)).toBe('ma')
    expect(applyToneMark('de', 5)).toBe('de')
  })

  it('ne touche pas une syllabe sans voyelle', () => {
    expect(applyToneMark('ng', 2)).toBe('ng')
  })
})

describe('toDiacritics', () => {
  it('convertit les pièges classiques du pinyin', () => {
    // Chaque cas vérifie une branche différente de la règle de placement.
    const cases: ReadonlyArray<readonly [string, string]> = [
      ['hao3', 'hǎo'],
      ['xue2', 'xué'],
      ['liu2', 'liú'],
      ['gui4', 'guì'],
      ['zhou1', 'zhōu'],
      ['er2', 'ér'],
      ['ri4', 'rì'],
      ['ci4', 'cì'],
      ['qi1', 'qī'],
      ['ju4', 'jù'],
      ['zhi1', 'zhī'],
      ['ma5', 'ma'],
    ]
    for (const [numbered, expected] of cases) {
      expect(toDiacritics(numbered), numbered).toBe(expected)
    }
  })

  it('gère le ü sous ses trois écritures', () => {
    expect(toDiacritics('nv3')).toBe('nǚ')
    expect(toDiacritics('nu:3')).toBe('nǚ')
    expect(toDiacritics('nü3')).toBe('nǚ')
    expect(toDiacritics('lve4')).toBe('lüè')
  })

  it('préserve les majuscules, les espaces et les apostrophes', () => {
    expect(toDiacritics('ni3 hao3')).toBe('nǐ hǎo')
    expect(toDiacritics('Bei3jing1')).toBe('Běijīng')
    expect(toDiacritics("xi1'an1")).toBe("xī'ān")
    expect(toDiacritics('A1')).toBe('Ā')
  })

  it('convertit une phrase entière avec sa ponctuation', () => {
    expect(toDiacritics('ni3 jiao4 shen2me5 ming2zi5 ?')).toBe('nǐ jiào shénme míngzi ?')
  })

  it('laisse intact du texte déjà accentué', () => {
    expect(toDiacritics('nǐ hǎo')).toBe('nǐ hǎo')
  })
})

describe('toNumbered', () => {
  it('retrouve la forme numérotée', () => {
    expect(toNumbered('hǎo')).toBe('hao3')
    expect(toNumbered('nǐ hǎo')).toBe('ni3 hao3')
    expect(toNumbered('nǚ')).toBe('nü3')
    expect(toNumbered('Běi jīng')).toBe('Bei3 jing1')
  })

  it('note explicitement le ton neutre', () => {
    expect(toNumbered('ma')).toBe('ma5')
    expect(toNumbered('de')).toBe('de5')
  })

  it('refuse de deviner un découpage ambigu', () => {
    // Deux diacritiques collés : impossible de savoir où coupe la syllabe,
    // car une syllabe au ton neutre ne porte aucune marque.
    expect(() => toNumbered('nǐhǎo')).toThrow(PinyinError)
    expect(() => toNumbered('Běijīng')).toThrow(/sépare les syllabes/)
  })

  it('fait l’aller-retour sans perte', () => {
    for (const numbered of ['hao3', 'ma5', 'nü3', 'lüe4', 'zhou1', 'gui4', 'er2']) {
      expect(toNumbered(toDiacritics(numbered)), numbered).toBe(numbered)
    }
  })
})

describe('splitNumbered', () => {
  it('découpe sur les chiffres de ton', () => {
    expect(splitNumbered('ni3hao3')).toEqual(['ni3', 'hao3'])
    expect(splitNumbered('Bei3jing1')).toEqual(['Bei3', 'jing1'])
    expect(splitNumbered('ni3 hao3')).toEqual(['ni3', 'hao3'])
    expect(splitNumbered('')).toEqual([])
  })
})

describe('annotate', () => {
  it('associe chaque syllabe à son ton', () => {
    expect(annotate('ni3 hao3')).toEqual([
      { text: 'nǐ', tone: 3 },
      { text: ' ', tone: undefined },
      { text: 'hǎo', tone: 3 },
    ])
  })

  it('conserve apostrophes et ponctuation sans ton', () => {
    expect(annotate("xi1'an1 ?")).toEqual([
      { text: 'xī', tone: 1 },
      { text: "'", tone: undefined },
      { text: 'ān', tone: 1 },
      { text: ' ?', tone: undefined },
    ])
  })

  it('distingue le ton neutre', () => {
    expect(annotate('ming2zi5')).toEqual([
      { text: 'míng', tone: 2 },
      { text: 'zi', tone: 5 },
    ])
  })

  it('rend le texte original une fois recollé', () => {
    const source = 'wo3 jiao4 Ma3 li4 .'
    expect(annotate(source).map((token) => token.text).join('')).toBe(toDiacritics(source))
  })

  it('renvoie une liste vide pour une chaîne vide', () => {
    expect(annotate('')).toEqual([])
  })
})

describe('toneOf', () => {
  it('lit le chiffre de ton', () => {
    expect(toneOf('hao3')).toBe(3)
    expect(toneOf('ma1')).toBe(1)
  })

  it('suppose le ton neutre sans chiffre', () => {
    expect(toneOf('ma')).toBe(5)
  })
})

describe('stripTone', () => {
  it('retire chiffres comme diacritiques', () => {
    expect(stripTone('hao3')).toBe('hao')
    expect(stripTone('hǎo')).toBe('hao')
    expect(stripTone('nǚ')).toBe('nü')
    expect(stripTone('Běijīng')).toBe('Beijing')
  })
})

describe('parseSyllable', () => {
  it('sépare initiale et finale', () => {
    expect(parseSyllable('ni3')).toMatchObject({ initial: 'n', final: 'i', tone: 3 })
    expect(parseSyllable('zhong1')).toMatchObject({ initial: 'zh', final: 'ong' })
    expect(parseSyllable('shi4')).toMatchObject({ initial: 'sh', final: 'i' })
    expect(parseSyllable('zhuang1')).toMatchObject({ initial: 'zh', final: 'uang' })
  })

  it('applique la règle du ü après j, q, x', () => {
    // On écrit « jun » mais la finale est bien ün : c'est le piège de pinyin
    // qu'il faut expliquer à un francophone.
    expect(parseSyllable('ju4')).toMatchObject({ initial: 'j', final: 'ü' })
    expect(parseSyllable('xue2')).toMatchObject({ initial: 'x', final: 'üe' })
    expect(parseSyllable('quan2')).toMatchObject({ initial: 'q', final: 'üan' })
    expect(parseSyllable('jun1')).toMatchObject({ initial: 'j', final: 'ün' })
  })

  it('traite y et w comme des graphies, pas des initiales', () => {
    // wǒ et duǒ partagent réellement la finale uo : c'est ce qui permet de
    // fabriquer des distracteurs proches plutôt que des choix évidents.
    expect(parseSyllable('wo3')).toMatchObject({ initial: '', final: 'uo' })
    expect(parseSyllable('duo1')).toMatchObject({ initial: 'd', final: 'uo' })
    expect(parseSyllable('yi1')).toMatchObject({ initial: '', final: 'i' })
    expect(parseSyllable('yu3')).toMatchObject({ initial: '', final: 'ü' })
    expect(parseSyllable('you3')).toMatchObject({ initial: '', final: 'iu' })
    expect(parseSyllable('wei4')).toMatchObject({ initial: '', final: 'ui' })
  })

  it('reconnaît l’érhua', () => {
    expect(parseSyllable('nar4')).toMatchObject({ final: 'a', erhua: true })
    expect(parseSyllable('na4')).toMatchObject({ final: 'a', erhua: false })
  })

  it('accepte les syllabes sans initiale', () => {
    expect(parseSyllable('er2')).toMatchObject({ initial: '', final: 'er' })
    expect(parseSyllable('ang1')).toMatchObject({ initial: '', final: 'ang' })
  })

  it('rejette ce qui n’est pas une structure de syllabe', () => {
    expect(parseSyllable('')).toBeUndefined()
    expect(parseSyllable('zq')).toBeUndefined()
    expect(parseSyllable('xr')).toBeUndefined()
    expect(parseSyllable('bcd')).toBeUndefined()
  })
})

describe('isStructurallyValidSyllable', () => {
  it('accepte des syllabes réelles', () => {
    for (const syllable of ['ni3', 'hao3', 'zhong1', 'ri4', 'lüe4', 'jiong3', 'wo3']) {
      expect(isStructurallyValidSyllable(syllable), syllable).toBe(true)
    }
  })

  it('rejette les saisies impossibles', () => {
    for (const bad of ['', 'zq', 'ptk', 'xr']) {
      expect(isStructurallyValidSyllable(bad), bad).toBe(false)
    }
  })

  it('ne prétend pas vérifier l’existence réelle des syllabes', () => {
    // `zhü` est structurellement bien formé mais n'existe pas en mandarin.
    // La liste exacte des syllabes arrive avec les données du jalon 2 ;
    // ce test documente la limite pour qu'on ne s'y fie pas à tort.
    expect(isStructurallyValidSyllable('zhv3')).toBe(true)
  })
})
