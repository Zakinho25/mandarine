import { describe, expect, it } from 'vitest'
import { center, extractContour, normalize, resampleContour } from './contour'
import { evaluate, POINTS, referenceCurve } from './references'

const RATE = 16000

/**
 * Fabrique un signal dont la hauteur suit une suite de paliers, interpolés :
 * c'est l'équivalent synthétique d'une syllabe tenue avec un contour donné.
 */
function glide(levels: readonly number[], seconds = 1, rate = RATE): Float32Array {
  const length = Math.floor(seconds * rate)
  const out = new Float32Array(length)
  let phase = 0

  for (let i = 0; i < length; i += 1) {
    const position = (i / (length - 1)) * (levels.length - 1)
    const low = Math.floor(position)
    const high = Math.min(levels.length - 1, low + 1)
    const ratio = position - low
    const hz = (levels[low] ?? 100) + ratio * ((levels[high] ?? 100) - (levels[low] ?? 100))

    phase += (2 * Math.PI * hz) / rate
    out[i] = 0.5 * Math.sin(phase) + 0.25 * Math.sin(2 * phase)
  }
  return out
}

/** Hauteurs en hertz correspondant aux niveaux de Chao, pour une voix à 150 Hz. */
function chaoHz(...levels: number[]): number[] {
  return levels.map((level) => 150 * 2 ** (((level - 3) * 3) / 12))
}

describe('extractContour', () => {
  it('suit une hauteur constante', () => {
    const points = extractContour(glide([150, 150]), RATE)
    expect(points.length).toBeGreaterThan(20)
    for (const point of points) expect(point.hz).toBeCloseTo(150, 0)
  })

  it('suit une montée', () => {
    const points = extractContour(glide([120, 200]), RATE)
    const first = points[0]?.hz ?? 0
    const last = points[points.length - 1]?.hz ?? 0
    expect(last).toBeGreaterThan(first + 50)
  })

  it('ne renvoie rien sur du silence', () => {
    expect(extractContour(new Float32Array(RATE), RATE)).toEqual([])
  })

  it('ne renvoie rien sur un signal trop court', () => {
    expect(extractContour(new Float32Array(200), RATE)).toEqual([])
  })

  it('place les points entre 0 et 1', () => {
    for (const point of extractContour(glide([150, 150]), RATE)) {
      expect(point.t).toBeGreaterThanOrEqual(0)
      expect(point.t).toBeLessThanOrEqual(1)
    }
  })
})

describe('normalize', () => {
  it('centre la courbe sur sa propre moyenne', () => {
    const contour = normalize(extractContour(glide([120, 200]), RATE))
    const moyenne =
      contour.points.reduce((sum, point) => sum + point.semitones, 0) /
      contour.points.length
    expect(moyenne).toBeCloseTo(0, 5)
  })

  it('rend la forme indépendante du locuteur', () => {
    // Une voix grave et une voix aiguë qui font le même geste doivent donner
    // la même courbe normalisée. C'est tout l'intérêt de l'opération.
    const grave = resampleContour(normalize(extractContour(glide([100, 160]), RATE)), 8)
    const aigue = resampleContour(normalize(extractContour(glide([200, 320]), RATE)), 8)

    for (let i = 0; i < 8; i += 1) {
      expect(grave[i] ?? 0, `point ${String(i)}`).toBeCloseTo(aigue[i] ?? 0, 0)
    }
  })

  it('accepte une courbe vide', () => {
    expect(normalize([]).points).toEqual([])
  })
})

describe('resampleContour', () => {
  it('rend exactement le nombre de points demandé', () => {
    const contour = normalize(extractContour(glide([150, 150]), RATE))
    expect(resampleContour(contour, 16)).toHaveLength(16)
  })

  it('conserve le sens de la variation', () => {
    const montant = resampleContour(normalize(extractContour(glide([120, 200]), RATE)), 8)
    expect(montant[7] ?? 0).toBeGreaterThan(montant[0] ?? 0)

    const descendant = resampleContour(
      normalize(extractContour(glide([200, 120]), RATE)),
      8,
    )
    expect(descendant[7] ?? 0).toBeLessThan(descendant[0] ?? 0)
  })
})

describe('center', () => {
  it('ramène la moyenne à zéro', () => {
    const centre = center([1, 2, 3])
    expect(centre).toEqual([-1, 0, 1])
  })

  it('accepte une liste vide', () => {
    expect(center([])).toEqual([])
  })
})

describe('referenceCurve', () => {
  it('rend le nombre de points demandé', () => {
    expect(referenceCurve(2, POINTS)).toHaveLength(POINTS)
  })

  it('décrit le premier ton comme plat', () => {
    const plat = referenceCurve(1, POINTS)
    expect(Math.max(...plat) - Math.min(...plat)).toBeCloseTo(0, 5)
  })

  it('décrit le deuxième ton comme montant', () => {
    const montant = referenceCurve(2, POINTS)
    expect(montant[POINTS - 1] ?? 0).toBeGreaterThan(montant[0] ?? 0)
  })

  it('décrit le quatrième ton comme descendant', () => {
    const descendant = referenceCurve(4, POINTS)
    expect(descendant[POINTS - 1] ?? 0).toBeLessThan(descendant[0] ?? 0)
  })

  it('décrit le troisième ton comme creusé', () => {
    // Le creux est la signature du troisième ton : le milieu doit passer
    // sous les deux extrémités.
    const creux = referenceCurve(3, POINTS)
    const milieu = Math.min(...creux.slice(4, 10))
    expect(milieu).toBeLessThan(creux[0] ?? 0)
    expect(milieu).toBeLessThan(creux[POINTS - 1] ?? 0)
  })
})

describe('evaluate', () => {
  function produire(levels: number[]): ReturnType<typeof normalize> {
    return normalize(extractContour(glide(chaoHz(...levels)), RATE))
  }

  it('reconnaît chaque ton produit correctement', () => {
    const attendus: [number[], 1 | 2 | 3 | 4][] = [
      [[5, 5], 1],
      [[3, 5], 2],
      [[2, 1, 4], 3],
      [[5, 1], 4],
    ]
    for (const [levels, tone] of attendus) {
      const result = evaluate(produire(levels), tone)
      expect(result.usable, `ton ${String(tone)}`).toBe(true)
      expect(result.bestTone, `ton ${String(tone)}`).toBe(tone)
      expect(result.verdict, `ton ${String(tone)}`).toBe('juste')
      expect(result.score, `ton ${String(tone)}`).toBeGreaterThan(70)
    }
  })

  it('note bas une production qui ne correspond pas', () => {
    // Un quatrième ton produit alors qu'on attendait un deuxième : la forme
    // est exactement inverse.
    const result = evaluate(produire([5, 1]), 2)
    expect(result.bestTone).toBe(4)
    expect(result.verdict).toBe('a_retravailler')
    expect(result.score).toBeLessThan(30)
  })

  it('distingue un contour approchant d’un contour faux', () => {
    // Un troisième ton face à un deuxième attendu : les deux remontent, la
    // confusion est réelle et mérite autre chose qu'un zéro.
    const result = evaluate(produire([2, 1, 4]), 2)
    expect(result.verdict).toBe('approchant')
  })

  it('refuse d’évaluer un silence', () => {
    const result = evaluate(normalize([]), 1)
    expect(result.usable).toBe(false)
    expect(result.probleme).toBe('silence')
    expect(result.score).toBe(0)
  })

  it('refuse d’évaluer un enregistrement trop court', () => {
    const court = normalize(extractContour(glide([150, 150], 0.1), RATE))
    const result = evaluate(court, 1)
    expect(result.usable).toBe(false)
    expect(result.probleme).toBe('trop_court')
  })

  it('rend une courbe exploitable pour l’affichage', () => {
    const result = evaluate(produire([3, 5]), 2)
    expect(result.curve).toHaveLength(POINTS)
  })
})

/**
 * Cas dégénérés. Les contours sont construits à la main : passer par un
 * signal audio pour provoquer un cas limite serait long et peu fiable.
 */
describe('cas limites', () => {
  function contour(semitones: number[]): ReturnType<typeof normalize> {
    return {
      centerHz: 150,
      points: semitones.map((value, index) => ({
        t: index / Math.max(1, semitones.length - 1),
        semitones: value,
      })),
    }
  }

  it('refuse une courbe dont l’étendue est impossible', () => {
    // Deux octaves sur une syllabe n'existent pas : c'est une erreur
    // d'octave ou un bruit, pas une voix.
    const result = evaluate(contour([-20, 0, 20, 0, -20, 0, 20, 10]), 1)
    expect(result.usable).toBe(false)
    expect(result.probleme).toBe('instable')
    // La courbe reste fournie, pour que l'utilisateur voie ce qui a été mesuré.
    expect(result.curve.length).toBeGreaterThan(0)
  })

  it('accepte une courbe parfaitement plate', () => {
    const result = evaluate(contour(Array.from({ length: 20 }, () => 0)), 1)
    expect(result.usable).toBe(true)
    expect(result.bestTone).toBe(1)
    expect(result.verdict).toBe('juste')
  })

  it('rééchantillonne une courbe réduite à un point', () => {
    expect(resampleContour(contour([3]), 5)).toEqual([3, 3, 3, 3, 3])
  })

  it('rééchantillonne une courbe vide sans planter', () => {
    expect(resampleContour(contour([]), 5)).toEqual([])
  })

  it('garde les extrémités quand le rognage ne laisse rien', () => {
    // Avec deux points seulement, rogner 10 % de chaque côté viderait la
    // courbe : on retombe alors sur les points bruts.
    expect(resampleContour(contour([0, 6]), 3)).toHaveLength(3)
  })

  it('décrit le ton neutre comme plat et ne le note pas', () => {
    const neutre = referenceCurve(5, POINTS)
    expect(Math.max(...neutre) - Math.min(...neutre)).toBeCloseTo(0, 5)
    // Il ne figure pas parmi les tons évalués : aucune distance ne lui est
    // attribuée.
    const result = evaluate(contour(Array.from({ length: 20 }, () => 0)), 1)
    expect(result.distances[5]).toBeUndefined()
  })
})
