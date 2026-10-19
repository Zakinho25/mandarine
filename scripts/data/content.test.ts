import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  isStructurallyValidSyllable,
  splitNumbered,
  toDiacritics,
} from '../../src/domain/pinyin/index.ts'
import {
  CONTENT_STATUS_LABELS,
  type ContentFile,
  type ContentIndex,
} from '../../src/data/content.ts'

/**
 * Les données générées sont traitées comme du code : elles sont testées.
 *
 * Ces vérifications tournent en CI. Si un script d'import casse une invariante
 * — un pinyin impossible, un identifiant en double, une définition vide — le
 * build échoue avant que la donnée n'atteigne l'application.
 */

function read<T>(file: string): T {
  return JSON.parse(readFileSync(`public/content/${file}`, 'utf8')) as T
}

const index = read<ContentIndex>('index.json')
const files = index.levels.map((level) => read<ContentFile>(level.file))
const all = files.flatMap((file) => file.lexemes)

/** Forme comparable : sans espaces, tirets ni apostrophes, en minuscules. */
function compact(pinyin: string): string {
  return pinyin
    .normalize('NFC')
    .toLowerCase()
    .replace(/[\s'’·\-–]/g, '')
}

describe('index du contenu', () => {
  it('déclare les trois niveaux du programme visé', () => {
    expect(index.levels.map((level) => level.level)).toEqual([1, 2, 3])
  })

  it('respecte les totaux du syllabus officiel : 300, 500, 1 000 cumulés', () => {
    // C'est la vérification qui garantit qu'on a importé le syllabus d'examen
    // de 2025 et non le standard d'enseignement de 2021, qui en donnerait 2 245.
    expect(index.levels.map((level) => level.cumulative)).toEqual([300, 500, 1000])
    expect(index.levels.map((level) => level.count)).toEqual([300, 200, 500])
  })
})

describe('fichiers de niveau', () => {
  it('annoncent un effectif conforme à leur contenu', () => {
    for (const file of files) {
      expect(file.lexemes.length, `niveau ${String(file.level)}`).toBe(file.count)
      expect(file.format).toBe('mandarine-contenu')
    }
  })

  it('transportent leur attribution', () => {
    // CFDICT est sous CC BY-SA : une donnée séparée de sa licence finit par
    // être réutilisée sans elle. L'attribution voyage donc dans le fichier.
    for (const file of files) {
      expect(file.attribution.length).toBeGreaterThan(0)
      expect(file.attribution.some((a) => a.source.includes('CFDICT'))).toBe(true)
    }
  })
})

describe('intégrité des mots', () => {
  it('n’a aucun identifiant en double', () => {
    const ids = new Set(all.map((lexeme) => lexeme.id))
    expect(ids.size).toBe(all.length)
  })

  it('a tous les champs indispensables renseignés', () => {
    for (const lexeme of all) {
      expect(lexeme.simplified.length, lexeme.id).toBeGreaterThan(0)
      expect(lexeme.pinyinNum.length, lexeme.id).toBeGreaterThan(0)
      expect(lexeme.pinyinMark.length, lexeme.id).toBeGreaterThan(0)
      expect(lexeme.glossFr.length, lexeme.id).toBeGreaterThan(0)
      for (const gloss of lexeme.glossFr) expect(gloss.trim().length).toBeGreaterThan(0)
    }
  })

  it('porte un statut de contenu reconnu', () => {
    for (const lexeme of all) {
      expect(Object.keys(CONTENT_STATUS_LABELS)).toContain(lexeme.contentStatus)
    }
  })

  it('ne contient que du pinyin structurellement possible', () => {
    const impossible: string[] = []
    for (const lexeme of all) {
      for (const syllable of splitNumbered(lexeme.pinyinNum)) {
        // `r5` est le suffixe érhua, qui n'est pas une syllabe autonome.
        if (syllable === 'r5') continue
        if (!isStructurallyValidSyllable(syllable)) {
          impossible.push(`${lexeme.simplified} (${lexeme.pinyinNum}) : ${syllable}`)
        }
      }
    }
    expect(impossible).toEqual([])
  })

  it('a un pinyin numéroté cohérent avec le pinyin imprimé, sauf sandhi', () => {
    // Le syllabus imprime le pinyin APRÈS sandhi tonal : 一下 s'y lit `yíxià`.
    // Les données stockent la forme de citation `yi1 xia4`. Tout écart doit
    // donc s'expliquer par 一 ou 不 — les deux seuls caractères qui changent
    // de ton selon leur voisin. Un écart ailleurs serait une erreur d'import.
    const unexplained: string[] = []

    for (const lexeme of all) {
      const derived = compact(toDiacritics(lexeme.pinyinNum))
      const readings = lexeme.pinyinMark.split('/').map(compact)
      if (readings.includes(derived)) continue

      if (lexeme.simplified.includes('一') || lexeme.simplified.includes('不')) continue
      unexplained.push(`${lexeme.simplified} : ${lexeme.pinyinNum} ≠ ${lexeme.pinyinMark}`)
    }

    expect(unexplained).toEqual([])
  })
})
