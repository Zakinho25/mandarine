import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { ContentFile, ContentIndex, Lexeme } from '../../src/data/content.ts'
import type { GrammaireIndex, NiveauGrammaire } from '../../src/data/grammaire.ts'
import { NIVEAU_1 } from './grammaire/niveau1.ts'
import { NIVEAU_2 } from './grammaire/niveau2.ts'
import { NIVEAU_3 } from './grammaire/niveau3.ts'

/**
 * Le contenu généré est traité comme du code : il est validé par des tests,
 * pas seulement par le script qui l'écrit.
 *
 * Ce que ces tests ajoutent au script de génération : la garantie de
 * reconstruction (les jetons remis bout à bout redonnent la phrase source) et
 * l'unicité des traductions, dont dépend l'équité des examens blancs.
 */

function read<T>(path: string): T {
  return JSON.parse(readFileSync(`public/content/${path}`, 'utf8')) as T
}

const SOURCES = [NIVEAU_1, NIVEAU_2, NIVEAU_3]
const index = read<GrammaireIndex>('grammaire/index.json')
const niveaux = [1, 2, 3].map((level) =>
  read<NiveauGrammaire>(`grammaire/niveau-${String(level)}.json`),
)
const points = niveaux.flatMap((fichier) => fichier.points)

const contentIndex = read<ContentIndex>('index.json')
const lexemes = new Map<string, Lexeme>(
  contentIndex.levels
    .flatMap((level) => read<ContentFile>(level.file).lexemes)
    .map((lexeme) => [lexeme.id, lexeme]),
)

describe('index de la grammaire', () => {
  it('compte autant de points que les sources en déclarent', () => {
    const attendu = SOURCES.reduce((somme, niveau) => somme + niveau.length, 0)
    expect(index.count).toBe(attendu)
    expect(points).toHaveLength(attendu)
  })

  it('n’a aucun identifiant en double', () => {
    const ids = points.map((point) => point.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('décrit chaque point du fichier de niveau', () => {
    const resumes = new Set(index.points.map((point) => point.id))
    for (const point of points) expect(resumes, point.id).toContain(point.id)
  })

  it('couvre les trois niveaux', () => {
    for (const fichier of niveaux) {
      expect(fichier.points.length, `niveau ${String(fichier.level)}`).toBeGreaterThan(0)
    }
  })

  it('annonce un contenu vérifié automatiquement, pas relu', () => {
    // Il n'y a pas de relecteur natif sur ce projet. Prétendre le contraire
    // serait la seule tromperie que l'application ne doit jamais commettre.
    expect(index.contentStatus).toBe('auto_checked')
    for (const fichier of niveaux) expect(fichier.contentStatus).toBe('auto_checked')
  })
})

describe('les points nommés par le cahier des charges sont couverts', () => {
  it.each(['了', '过', '在', '比', '把', '被', '的', '得', '地'])(
    'traite %s',
    (marqueur) => {
      expect(points.some((point) => point.markers.includes(marqueur))).toBe(true)
    },
  )

  it('traite les classificateurs', () => {
    expect(points.some((point) => point.categorie === 'mesure')).toBe(true)
  })

  it('traite les compléments de résultat et de direction', () => {
    const complements = points.filter((point) => point.categorie === 'complement')
    expect(complements.length).toBeGreaterThanOrEqual(2)
  })
})

describe('exemples', () => {
  it('se reconstruisent exactement depuis leurs jetons', () => {
    // La garantie qui compte : si le découpage perdait un caractère, la
    // phrase affichée ne serait plus celle qui a été vérifiée.
    const casses: string[] = []
    for (const niveau of SOURCES) {
      for (const source of niveau) {
        const produit = points.find((point) => point.id === source.id)
        if (produit === undefined) {
          casses.push(`${source.id} : absent de la sortie`)
          continue
        }
        for (const [i, exemple] of source.exemples.entries()) {
          const assemble = (produit.exemples[i]?.tokens ?? [])
            .map((jeton) => jeton.text)
            .join('')
          if (assemble !== exemple.zh) {
            casses.push(`${source.id}#${String(i)} : « ${assemble} » ≠ « ${exemple.zh} »`)
          }
        }
      }
    }
    expect(casses).toEqual([])
  })

  it('n’emploient aucun mot au-dessus du niveau de la fiche', () => {
    const hors: string[] = []
    for (const point of points) {
      for (const exemple of point.exemples) {
        for (const jeton of exemple.tokens) {
          if (jeton.lexemeId === null) continue
          const lexeme = lexemes.get(jeton.lexemeId)
          if (lexeme === undefined) {
            hors.push(`${point.id} : ${jeton.text} introuvable au catalogue`)
          } else if (lexeme.hsk2025 > point.level) {
            hors.push(`${point.id} : ${jeton.text} est de niveau ${String(lexeme.hsk2025)}`)
          }
        }
      }
    }
    expect(hors).toEqual([])
  })

  it('donnent au moins deux exemples par fiche', () => {
    for (const point of points) {
      expect(point.exemples.length, point.id).toBeGreaterThanOrEqual(2)
    }
  })

  it('ne répètent jamais la même traduction française', () => {
    // Deux exemples de même traduction rendraient un item d'examen insoluble :
    // deux bonnes réponses au lieu d'une.
    const vues = new Map<string, string>()
    const doublons: string[] = []
    for (const point of points) {
      for (const exemple of point.exemples) {
        const precedent = vues.get(exemple.fr)
        if (precedent !== undefined) {
          doublons.push(`« ${exemple.fr} » dans ${precedent} et ${point.id}`)
        }
        vues.set(exemple.fr, point.id)
      }
    }
    expect(doublons).toEqual([])
  })

  it('traduisent chaque exemple', () => {
    for (const point of points) {
      for (const exemple of point.exemples) {
        expect(exemple.fr.length, point.id).toBeGreaterThan(0)
      }
    }
  })
})

describe('exercice de remise en ordre', () => {
  it('a au moins trois morceaux', () => {
    for (const point of points) {
      expect(point.ordre.morceaux.length, point.id).toBeGreaterThanOrEqual(3)
    }
  })

  it('a pour première phrase acceptée la concaténation des morceaux', () => {
    for (const point of points) {
      const assemble = point.ordre.morceaux.map((morceau) => morceau.text).join('')
      expect(point.ordre.acceptes[0], point.id).toBe(assemble)
    }
  })

  it('n’accepte que des permutations exactes des morceaux', () => {
    const signature = (texte: string): string => [...texte].sort().join('')
    for (const point of points) {
      const canonique = signature(point.ordre.acceptes[0] ?? '')
      for (const accepte of point.ordre.acceptes) {
        expect(signature(accepte), `${point.id} : ${accepte}`).toBe(canonique)
      }
    }
  })

  it('n’accepte jamais deux fois la même phrase', () => {
    for (const point of points) {
      expect(new Set(point.ordre.acceptes).size, point.id).toBe(
        point.ordre.acceptes.length,
      )
    }
  })

  it('n’emploie aucun mot au-dessus du niveau', () => {
    const hors: string[] = []
    for (const point of points) {
      for (const jeton of point.ordre.tokens) {
        if (jeton.lexemeId === null) continue
        const lexeme = lexemes.get(jeton.lexemeId)
        if (lexeme !== undefined && lexeme.hsk2025 > point.level) {
          hors.push(`${point.id} : ${jeton.text}`)
        }
      }
    }
    expect(hors).toEqual([])
  })

  it('découpe les morceaux sur des frontières de mots', () => {
    // Un morceau qui coupe un mot en deux laisserait une moitié sans
    // identifiant : l'exercice demanderait de reconstituer une graphie que
    // l'élève n'a jamais vue.
    const casses: string[] = []
    for (const point of points) {
      for (const morceau of point.ordre.morceaux) {
        const inconnus = morceau.tokens.filter(
          (jeton) => jeton.lexemeId === null && /\p{Script=Han}/u.test(jeton.text),
        )
        for (const jeton of inconnus) {
          casses.push(`${point.id} : « ${morceau.text} » contient ${jeton.text}`)
        }
      }
    }
    expect(casses).toEqual([])
  })

  it('traduit la phrase à reconstituer', () => {
    for (const point of points) {
      expect(point.ordre.fr.length, point.id).toBeGreaterThan(0)
    }
  })
})

describe('rédaction des fiches', () => {
  it('donne un résumé et un piège à chaque fiche', () => {
    for (const point of points) {
      expect(point.resume.length, point.id).toBeGreaterThan(10)
      expect(point.piege.length, point.id).toBeGreaterThan(20)
      expect(point.explication.length, point.id).toBeGreaterThan(0)
    }
  })

  it('n’emploie pas de tiret cadratin dans les fiches', () => {
    // Convention de rédaction du projet, appliquée au contenu comme au code.
    const fautifs = points.filter((point) =>
      [point.resume, point.piege, ...point.explication].some((texte) =>
        texte.includes('—'),
      ),
    )
    expect(fautifs.map((point) => point.id)).toEqual([])
  })
})
