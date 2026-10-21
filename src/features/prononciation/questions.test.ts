import { describe, expect, it } from 'vitest'
import type { Lexeme } from '@/data/content'
import { TONE_SETS } from '@/data/prononciation'
import { seededRandom } from '@/domain/random'
import { buildPairQuestions, buildToneQuestions, ROUND_LENGTH } from './questions'

function lexeme(id: string, simplified: string, pinyinNum: string): Lexeme {
  return {
    id,
    simplified,
    traditional: null,
    pinyinNum,
    pinyinMark: '',
    pos: [],
    hsk2025: 1,
    hsk2021: null,
    glossFr: ['sens'],
    contentStatus: 'auto_checked',
    glossApprox: false,
    freqRank: null,
    unit: 'divers',
  }
}

const POOL: Lexeme[] = [
  lexeme('a', '妈妈', 'ma1 ma5'),
  lexeme('b', '学习', 'xue2 xi2'),
  lexeme('c', '你好', 'ni3 hao3'),
  lexeme('d', '再见', 'zai4 jian4'),
  lexeme('e', '中国', 'zhong1 guo2'),
  lexeme('f', '老师', 'lao3 shi1'),
  lexeme('g', '时间', 'shi2 jian1'),
  lexeme('h', '可以', 'ke3 yi3'),
  lexeme('i', '东西', 'dong1 xi5'),
  lexeme('j', '爸爸', 'ba4 ba5'),
]

describe('buildToneQuestions', () => {
  const questions = buildToneQuestions(TONE_SETS, seededRandom(1))

  it('produit une série complète', () => {
    expect(questions).toHaveLength(ROUND_LENGTH)
  })

  it('propose toujours les quatre tons', () => {
    // Si les propositions variaient, on pourrait répondre par élimination
    // sans rien entendre.
    for (const question of questions) {
      expect(question.options).toEqual(['1', '2', '3', '4'])
    }
  })

  it('contient toujours la bonne réponse', () => {
    for (const question of questions) {
      expect(question.options).toContain(question.answer)
    }
  })

  it('donne un caractère réel à faire lire', () => {
    // La synthèse vocale lit des caractères, pas du pinyin : sans caractère,
    // la question est muette.
    for (const question of questions) {
      expect(question.character.length).toBeGreaterThan(0)
      expect(question.pinyinNum).toContain(question.answer)
    }
  })

  it('se rejoue à l’identique avec la même graine', () => {
    const again = buildToneQuestions(TONE_SETS, seededRandom(1))
    expect(again.map((q) => q.character)).toEqual(questions.map((q) => q.character))
  })
})

describe('buildPairQuestions', () => {
  const questions = buildPairQuestions(POOL, seededRandom(42))

  it('produit une série complète', () => {
    expect(questions).toHaveLength(ROUND_LENGTH)
  })

  it('contient toujours la bonne réponse, une seule fois', () => {
    for (const question of questions) {
      expect(question.options).toContain(question.answer)
      expect(question.options.filter((o) => o === question.answer)).toHaveLength(1)
    }
  })

  it('ne propose jamais deux fois la même combinaison', () => {
    for (const question of questions) {
      expect(new Set(question.options).size).toBe(question.options.length)
    }
  })

  it('ne propose que des combinaisons voisines', () => {
    // Chaque proposition ne doit différer de la bonne réponse que d'un ton :
    // sinon la seconde syllabe devient inutile à écouter.
    for (const question of questions) {
      const [a, b] = question.answer.split('-')
      for (const option of question.options) {
        if (option === question.answer) continue
        const [x, y] = option.split('-')
        expect((x === a) !== (y === b), `${question.answer} vs ${option}`).toBe(true)
      }
    }
  })

  it('n’utilise que des mots de deux syllabes', () => {
    for (const question of questions) {
      expect(question.pinyinNum.split(' ')).toHaveLength(2)
    }
  })

  it('ne produit rien sans vocabulaire', () => {
    expect(buildPairQuestions([], seededRandom(1))).toEqual([])
  })

  it('reste honnête avec un vocabulaire trop pauvre', () => {
    // Un seul mot : aucune voisine disponible, mais la bonne réponse doit
    // toujours figurer dans les propositions.
    const maigre = buildPairQuestions([lexeme('x', '你好', 'ni3 hao3')], seededRandom(3), 2)
    for (const question of maigre) {
      expect(question.options).toContain(question.answer)
    }
  })
})
