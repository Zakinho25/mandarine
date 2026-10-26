import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { ContentFile, ContentIndex, Lexeme } from '../../src/data/content.ts'
import type { Dialogue, DialoguesIndex } from '../../src/data/dialogues.ts'
import { isHanzi } from '../../src/domain/segmentation.ts'
import { DIALOGUES } from './dialogues.ts'

/**
 * Un arbre de dialogue casse plus facilement qu'un texte : un renvoi vers un
 * nœud inexistant bloquerait l'utilisateur au milieu de l'échange, et un tour
 * sans réponse juste transformerait l'exercice en piège.
 */

function read<T>(path: string): T {
  return JSON.parse(readFileSync(`public/content/${path}`, 'utf8')) as T
}

const index = read<DialoguesIndex>('dialogues/index.json')
const dialogues = index.dialogues.map((summary) =>
  read<Dialogue>(`dialogues/${summary.id}.json`),
)

const contentIndex = read<ContentIndex>('index.json')
const lexemes = new Map<string, Lexeme>(
  contentIndex.levels
    .flatMap((level) => read<ContentFile>(level.file).lexemes)
    .map((lexeme) => [lexeme.id, lexeme]),
)

describe('index des dialogues', () => {
  it('référence autant de dialogues que la source en déclare', () => {
    expect(index.count).toBe(DIALOGUES.length)
    expect(dialogues).toHaveLength(DIALOGUES.length)
  })

  it('n’a aucun identifiant en double', () => {
    const ids = index.dialogues.map((dialogue) => dialogue.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('structure des arbres', () => {
  it('démarre sur un nœud qui existe', () => {
    for (const dialogue of dialogues) {
      const ids = dialogue.nodes.map((node) => node.id)
      expect(ids, dialogue.id).toContain(dialogue.start)
    }
  })

  it('ne renvoie jamais vers un nœud inexistant', () => {
    const casses: string[] = []
    for (const dialogue of dialogues) {
      const ids = new Set(dialogue.nodes.map((node) => node.id))
      for (const node of dialogue.nodes) {
        for (const replique of node.repliques) {
          if (replique.next !== null && !ids.has(replique.next)) {
            casses.push(`${dialogue.id}/${node.id} → ${replique.next}`)
          }
        }
      }
    }
    expect(casses).toEqual([])
  })

  it('rend tous les nœuds atteignables', () => {
    const orphelins: string[] = []
    for (const dialogue of dialogues) {
      const atteints = new Set([dialogue.start])
      for (const node of dialogue.nodes) {
        for (const replique of node.repliques) {
          if (replique.next !== null) atteints.add(replique.next)
        }
      }
      for (const node of dialogue.nodes) {
        if (!atteints.has(node.id)) orphelins.push(`${dialogue.id}/${node.id}`)
      }
    }
    expect(orphelins).toEqual([])
  })

  it('propose toujours au moins une réponse juste', () => {
    // Sans cela, l'utilisateur ne peut que se tromper : l'exercice devient un
    // piège au lieu d'un entraînement.
    const pieges: string[] = []
    for (const dialogue of dialogues) {
      for (const node of dialogue.nodes) {
        if (!node.repliques.some((replique) => replique.qualite === 'juste')) {
          pieges.push(`${dialogue.id}/${node.id}`)
        }
      }
    }
    expect(pieges).toEqual([])
  })

  it('explique chaque réponse signalée comme imparfaite', () => {
    // Le bilan est la seule occasion d'apprendre quelque chose : une réponse
    // marquée maladroite sans explication ne sert à rien.
    const muettes: string[] = []
    for (const dialogue of dialogues) {
      for (const node of dialogue.nodes) {
        for (const replique of node.repliques) {
          if (replique.qualite !== 'juste' && replique.note === null) {
            muettes.push(`${dialogue.id}/${node.id}`)
          }
        }
      }
    }
    expect(muettes).toEqual([])
  })

  it('termine toujours, quel que soit le chemin suivi', () => {
    for (const dialogue of dialogues) {
      const byId = new Map(dialogue.nodes.map((node) => [node.id, node]))
      // Tous les chemins sont parcourus : avec quatre à cinq tours et trois
      // réponses, l'exploration exhaustive reste immédiate.
      const explorer = (id: string, profondeur: number): void => {
        expect(profondeur, `${dialogue.id} : chemin trop long`).toBeLessThan(20)
        const node = byId.get(id)
        expect(node, `${dialogue.id}/${id}`).toBeDefined()
        for (const replique of node?.repliques ?? []) {
          if (replique.next !== null) explorer(replique.next, profondeur + 1)
        }
      }
      explorer(dialogue.start, 0)
    }
  })
})

describe('contenu des dialogues', () => {
  it('n’emploie que le vocabulaire du niveau annoncé', () => {
    const fautes: string[] = []
    for (const dialogue of dialogues) {
      const tokens = dialogue.nodes.flatMap((node) => [
        ...node.tokens,
        ...node.repliques.flatMap((replique) => replique.tokens),
      ])
      for (const token of tokens) {
        if (token.lexemeId === null) continue
        const lexeme = lexemes.get(token.lexemeId)
        if (lexeme === undefined) {
          fautes.push(`${dialogue.id} : ${token.text} introuvable`)
        } else if (lexeme.hsk2025 > dialogue.level) {
          fautes.push(
            `${dialogue.id} (HSK ${String(dialogue.level)}) : ${token.text} est HSK ${String(lexeme.hsk2025)}`,
          )
        }
      }
    }
    expect(fautes).toEqual([])
  })

  it('permet de reconstituer chaque phrase à l’identique', () => {
    for (const source of DIALOGUES) {
      const dialogue = dialogues.find((d) => d.id === source.id)
      for (const node of source.nodes) {
        const built = dialogue?.nodes.find((n) => n.id === node.id)
        expect(
          built?.tokens.map((token) => token.text).join(''),
          `${source.id}/${node.id}`,
        ).toBe(node.zh)
        node.repliques.forEach((replique, index) => {
          expect(
            built?.repliques[index]?.tokens.map((token) => token.text).join(''),
            `${source.id}/${node.id} réponse ${String(index + 1)}`,
          ).toBe(replique.zh)
        })
      }
    }
  })

  it('laisse les noms propres sans identifiant de mot', () => {
    // Un nom propre n'est pas du vocabulaire à apprendre : il ne doit pas
    // pointer vers une entrée du lexique.
    const dialogue = dialogues.find((d) => d.id === 'hsk1-se-presenter')
    const tokens = dialogue?.nodes.flatMap((node) => node.tokens) ?? []
    const wangMing = tokens.find((token) => token.text === '王明')
    expect(wangMing?.lexemeId ?? null).toBeNull()
    expect(isHanzi(wangMing?.text.charAt(0) ?? '')).toBe(true)
  })

  it('annonce un statut honnête', () => {
    for (const dialogue of dialogues) {
      expect(dialogue.contentStatus, dialogue.id).toBe('auto_checked')
    }
  })
})
