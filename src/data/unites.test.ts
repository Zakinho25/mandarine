import { describe, expect, it } from 'vitest'
import { assignUnit, DIVERS_ID, matchesKeyword, UNITES, type Unite } from './unites'

function mot(simplified: string, glossFr: string[], pos: string[] = []) {
  return { simplified, glossFr, pos: pos.map((label) => ({ label })) }
}

describe('matchesKeyword', () => {
  it('respecte les frontières de mots', () => {
    // Le piège qui a motivé cette fonction : « jour » trouvait « bonjour »,
    // et 你好 se retrouvait classé dans l'unité du calendrier.
    expect(matchesKeyword('bonjour, salut', 'jour')).toBe(false)
    expect(matchesKeyword('un jour de plus', 'jour')).toBe(true)
    expect(matchesKeyword('grand, vaste', 'an')).toBe(false)
  })

  it('tolère le pluriel', () => {
    expect(matchesKeyword('des legumes verts', 'legume')).toBe(true)
    expect(matchesKeyword('les vetements', 'vetement')).toBe(true)
  })

  it('ignore accents et majuscules', () => {
    expect(matchesKeyword('etudier a l ecole', 'école')).toBe(true)
  })

  it('refuse un mot-clé vide', () => {
    expect(matchesKeyword('bonjour', '')).toBe(false)
    expect(matchesKeyword('bonjour', '   ')).toBe(false)
  })
})

describe('assignUnit', () => {
  it('place un mot listé explicitement, quelle que soit sa définition', () => {
    expect(assignUnit(mot('的', ['particule possessive']))).toBe('outils')
    expect(assignUnit(mot('是', ['être, oui']))).toBe('essentiels')
  })

  it('classe par la définition quand aucune liste ne s’applique', () => {
    expect(assignUnit(mot('苹果', ['pomme']))).toBe('nourriture')
    expect(assignUnit(mot('医院', ['hôpital']))).toBe('lieux')
  })

  it('fait passer le thème avant la classe grammaticale', () => {
    // 快 est un adverbe, mais « rapide » le range avec ce qui décrit, pas
    // avec les mots de degré.
    const unite = assignUnit(mot('快', ['rapide, vite'], ['adverbe']))
    expect(unite).not.toBe(DIVERS_ID)
  })

  it('utilise la classe grammaticale en dernier recours', () => {
    expect(assignUnit(mot('XX', ['zzzz'], ['classificateur']))).toBe('classificateurs')
  })

  it('range dans « divers » plutôt que de se tromper', () => {
    // Un mot mal rangé est plus trompeur qu'un mot non rangé.
    expect(assignUnit(mot('某', ['zzzz', 'yyyy']))).toBe(DIVERS_ID)
  })

  it('respecte l’ordre des unités fourni', () => {
    const units: Unite[] = [
      { id: 'a', title: 'A', goal: '', keywords: ['pomme'] },
      { id: 'b', title: 'B', goal: '', keywords: ['pomme'] },
    ]
    expect(assignUnit(mot('苹果', ['pomme']), units)).toBe('a')
  })
})

describe('table des unités', () => {
  it('n’a aucun identifiant en double', () => {
    const ids = UNITES.map((unit) => unit.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('n’utilise pas l’identifiant réservé aux non classés', () => {
    expect(UNITES.map((unit) => unit.id)).not.toContain(DIVERS_ID)
  })

  it('donne à chaque unité un titre et un but', () => {
    for (const unit of UNITES) {
      expect(unit.title.length, unit.id).toBeGreaterThan(0)
      expect(unit.goal.length, unit.id).toBeGreaterThan(0)
    }
  })

  it('donne à chaque unité au moins un critère', () => {
    for (const unit of UNITES) {
      const criteres =
        (unit.words?.length ?? 0) + (unit.keywords?.length ?? 0) + (unit.pos?.length ?? 0)
      expect(criteres, unit.id).toBeGreaterThan(0)
    }
  })
})
