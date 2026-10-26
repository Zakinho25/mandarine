import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { ContentFile, ContentIndex, Lexeme } from '../../src/data/content.ts'
import type { Texte, TextesIndex } from '../../src/data/textes.ts'
import { isHanzi } from '../../src/domain/segmentation.ts'
import { TEXTES } from './textes.ts'

/**
 * Les textes générés sont testés comme du code.
 *
 * La vérification la plus importante est celle du vocabulaire : un texte de
 * niveau 1 qui emploierait un mot de niveau 3 mettrait le lecteur en échec
 * sans qu'il comprenne pourquoi.
 */

function read<T>(path: string): T {
  return JSON.parse(readFileSync(`public/content/${path}`, 'utf8')) as T
}

const index = read<TextesIndex>('textes/index.json')
const textes = index.textes.map((summary) => read<Texte>(`textes/${summary.id}.json`))

const contentIndex = read<ContentIndex>('index.json')
const lexemes = new Map<string, Lexeme>(
  contentIndex.levels
    .flatMap((level) => read<ContentFile>(level.file).lexemes)
    .map((lexeme) => [lexeme.id, lexeme]),
)

describe('index des textes', () => {
  it('référence autant de textes que la source en déclare', () => {
    expect(index.count).toBe(TEXTES.length)
    expect(textes).toHaveLength(TEXTES.length)
  })

  it('n’a aucun identifiant en double', () => {
    const ids = index.textes.map((texte) => texte.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('compte des mots cohérents avec les fichiers', () => {
    for (const summary of index.textes) {
      const texte = textes.find((t) => t.id === summary.id)
      const mots = texte?.paragraphs
        .flatMap((p) => p.tokens)
        .filter((token) => isHanzi(token.text.charAt(0))).length
      expect(mots, summary.id).toBe(summary.words)
    }
  })
})

describe('contenu des textes', () => {
  it('n’emploie que le vocabulaire du niveau annoncé', () => {
    // La vérification centrale du jalon : le script de génération échoue déjà
    // si elle casse, ce test garantit qu'on ne livre pas un fichier périmé.
    const fautes: string[] = []
    for (const texte of textes) {
      for (const token of texte.paragraphs.flatMap((p) => p.tokens)) {
        if (token.lexemeId === null) continue
        const lexeme = lexemes.get(token.lexemeId)
        if (lexeme === undefined) {
          fautes.push(`${texte.id} : ${token.text} introuvable au lexique`)
        } else if (lexeme.hsk2025 > texte.level) {
          fautes.push(
            `${texte.id} (HSK ${String(texte.level)}) : ${token.text} est HSK ${String(lexeme.hsk2025)}`,
          )
        }
      }
    }
    expect(fautes).toEqual([])
  })

  it('attribue un mot à chaque caractère chinois', () => {
    const orphelins: string[] = []
    for (const texte of textes) {
      for (const token of texte.paragraphs.flatMap((p) => p.tokens)) {
        if (isHanzi(token.text.charAt(0)) && token.lexemeId === null) {
          orphelins.push(`${texte.id} : ${token.text}`)
        }
      }
    }
    expect(orphelins).toEqual([])
  })

  it('permet de reconstituer le texte source à l’identique', () => {
    // Le lecteur réaffiche les jetons un par un : s'ils ne recollent pas, le
    // texte montré n'est plus celui qui a été rédigé.
    for (const source of TEXTES) {
      const texte = textes.find((t) => t.id === source.id)
      expect(texte, source.id).toBeDefined()
      source.paragraphs.forEach((paragraph, index) => {
        const recollé = texte?.paragraphs[index]?.tokens
          .map((token) => token.text)
          .join('')
        expect(recollé, `${source.id} §${String(index + 1)}`).toBe(paragraph.zh)
      })
    }
  })

  it('traduit chaque paragraphe', () => {
    for (const texte of textes) {
      for (const [index, paragraph] of texte.paragraphs.entries()) {
        expect(paragraph.fr.trim().length, `${texte.id} §${String(index + 1)}`).toBeGreaterThan(0)
      }
    }
  })

  it('annonce un statut honnête', () => {
    // Le vocabulaire est vérifié, le naturel de la langue ne l'est pas :
    // `reviewed_human` serait un mensonge tant qu'aucun natif n'a relu.
    for (const texte of textes) {
      expect(texte.contentStatus, texte.id).toBe('auto_checked')
    }
  })
})
