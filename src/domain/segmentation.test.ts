import { describe, expect, it } from 'vitest'
import { buildLexicon, isHanzi, knownRatio, segment } from './segmentation'

const LEXIQUE = buildLexicon([
  '我', '你', '他', '是', '的', '不', '很', '在', '和', '有',
  '喜欢', '学习', '中文', '老师', '学生', '朋友', '中国', '法国',
  '不客气', '谢谢', '你好', '人', '好', '客气', '中', '国', '文',
  '图书馆', '咖啡', '今天', '天气',
])

function mots(texte: string): string[] {
  return segment(texte, LEXIQUE)
    .filter((token) => isHanzi(token.text.charAt(0)))
    .map((token) => token.text)
}

describe('isHanzi', () => {
  it('reconnaît les caractères chinois', () => {
    expect(isHanzi('我')).toBe(true)
    expect(isHanzi('中')).toBe(true)
  })

  it('rejette tout le reste', () => {
    expect(isHanzi('。')).toBe(false)
    expect(isHanzi('a')).toBe(false)
    expect(isHanzi(' ')).toBe(false)
    expect(isHanzi('1')).toBe(false)
  })
})

describe('segment', () => {
  it('préfère le mot le plus long', () => {
    // Le piège central : 不客气 doit rester un mot, pas trois caractères.
    expect(mots('不客气')).toEqual(['不客气'])
    expect(mots('我喜欢学习中文')).toEqual(['我', '喜欢', '学习', '中文'])
  })

  it('isole la ponctuation sans la perdre', () => {
    const tokens = segment('你好，我是学生。', LEXIQUE)
    expect(tokens.map((t) => t.text)).toEqual(['你好', '，', '我', '是', '学生', '。'])
  })

  it('permet de reconstituer le texte à l’identique', () => {
    // C'est ce qui autorise à réafficher le texte mot par mot sans rien
    // déplacer : le lecteur dépend entièrement de cette propriété.
    for (const texte of [
      '你好，我是学生。',
      '我喜欢中文！',
      '他在图书馆学习。',
      'HSK 3 ：今天天气很好。',
    ]) {
      expect(segment(texte, LEXIQUE).map((t) => t.text).join('')).toBe(texte)
    }
  })

  it('donne des positions exactes', () => {
    const tokens = segment('我喜欢中文', LEXIQUE)
    for (const token of tokens) {
      expect([...'我喜欢中文'].slice(token.start, token.end).join('')).toBe(token.text)
    }
  })

  it('marque les mots hors lexique', () => {
    const tokens = segment('我喜欢龘', LEXIQUE)
    const inconnu = tokens.find((t) => t.text === '龘')
    expect(inconnu?.known).toBe(false)
    expect(tokens.find((t) => t.text === '喜欢')?.known).toBe(true)
  })

  it('ne coupe pas un mot connu en caractères connus', () => {
    // 中文 existe, et 中 et 文 aussi : l'appariement maximal doit garder le mot.
    expect(mots('中文')).toEqual(['中文'])
    // Même chose pour un mot de trois caractères dont les morceaux existent.
    expect(mots('不客气')).toEqual(['不客气'])
  })

  it('gère un texte vide ou sans chinois', () => {
    expect(segment('', LEXIQUE)).toEqual([])
    expect(segment('HSK 3 !', LEXIQUE).map((t) => t.text)).toEqual(['HSK 3 !'])
  })

  it('traite les caractères isolés hors lexique', () => {
    const tokens = segment('龘龘', LEXIQUE)
    expect(tokens).toHaveLength(2)
    expect(tokens.every((t) => !t.known)).toBe(true)
  })
})

describe('knownRatio', () => {
  it('compte la part de mots connus', () => {
    expect(knownRatio(segment('我喜欢中文', LEXIQUE))).toBe(1)
  })

  it('ignore la ponctuation dans le calcul', () => {
    // Sans cela, un texte très ponctué paraîtrait moins connu qu'il ne l'est.
    expect(knownRatio(segment('你好，我是学生。', LEXIQUE))).toBe(1)
  })

  it('descend quand des mots manquent', () => {
    const ratio = knownRatio(segment('我喜欢龘', LEXIQUE))
    expect(ratio).toBeCloseTo(2 / 3, 5)
  })

  it('vaut 1 sur un texte sans chinois', () => {
    expect(knownRatio(segment('HSK 3', LEXIQUE))).toBe(1)
  })
})

describe('buildLexicon', () => {
  it('mesure le mot le plus long', () => {
    expect(buildLexicon(['我', '图书馆']).maxLength).toBe(3)
  })

  it('ignore les chaînes vides', () => {
    expect(buildLexicon(['', '我']).words.has('')).toBe(false)
  })

  it('garantit une longueur minimale de 1', () => {
    expect(buildLexicon([]).maxLength).toBe(1)
  })
})
