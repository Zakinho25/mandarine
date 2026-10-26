import type { Tone } from '../pinyin/toneMarks'
import { center, resampleContour, type NormalizedContour } from './contour'

/**
 * Contours de référence des quatre tons.
 *
 * ### D'où ils viennent
 *
 * De la notation de Chao, qui décrit chaque ton par une suite de hauteurs sur
 * une échelle de 1 (grave) à 5 (aigu) : le premier ton est 55, le deuxième 35,
 * le troisième 214, le quatrième 51.
 *
 * ### Pourquoi calculés plutôt que mesurés
 *
 * Mesurer un contour demanderait un enregistrement de référence. La synthèse
 * vocale du navigateur ne rend pas de fichier audio exploitable, et acheter
 * des enregistrements sort du budget. Ces contours sont donc **idéalisés** :
 * ils donnent la forme juste, pas les micro-variations d'une voix réelle.
 * C'est suffisant pour dire à un débutant que son troisième ton ne redescend
 * pas, et insuffisant pour juger un niveau avancé. L'application le dit.
 */

/** Une marche de l'échelle de Chao vaut trois demi-tons. */
const STEP_SEMITONES = 3

function chao(...levels: number[]): number[] {
  return center(levels.map((level) => (level - 3) * STEP_SEMITONES))
}

export const TONE_CHAO: Record<Tone, readonly number[]> = {
  1: [5, 5],
  2: [3, 5],
  3: [2, 1, 4],
  4: [5, 1],
  // Le ton neutre n'a pas de contour propre : sa hauteur dépend de la syllabe
  // précédente. Il n'est pas évalué ici.
  5: [3, 3],
}

export const TONE_SHAPES: Record<Tone, readonly string[]> = {
  1: ['Haut et plat', 'Tiens la note sans bouger.'],
  2: ['Montant', 'Pars du milieu et monte franchement.'],
  3: ['Descendant puis montant', 'Creuse d’abord, remonte ensuite. C’est le creux qui compte.'],
  4: ['Descendant', 'Pars du haut et laisse tomber d’un coup.'],
  5: ['Neutre', 'Bref et sans hauteur propre : non évalué.'],
}

/** Les tons que l'exercice évalue. Le ton neutre en est exclu. */
export const SCORED_TONES: readonly Tone[] = [1, 2, 3, 4]

/** Contour de référence, recentré et rééchantillonné en `count` points. */
export function referenceCurve(tone: Tone, count: number): number[] {
  const levels = chao(...(TONE_CHAO[tone] as number[]))
  if (levels.length === 0) return []
  if (levels.length === 1) return Array.from({ length: count }, () => levels[0] ?? 0)

  return Array.from({ length: count }, (_, index) => {
    const position = (index / (count - 1)) * (levels.length - 1)
    const low = Math.floor(position)
    const high = Math.min(levels.length - 1, low + 1)
    const ratio = position - low
    return (levels[low] ?? 0) + ratio * ((levels[high] ?? 0) - (levels[low] ?? 0))
  })
}

export type Probleme = 'trop_court' | 'silence' | 'instable'

export type Verdict = 'juste' | 'approchant' | 'a_retravailler'

/**
 * Seuils d'écart quadratique moyen, en demi-tons.
 *
 * Mesurés sur des contours synthétiques parfaits : une production juste reste
 * sous 1,1 demi-ton, une production de ton différent dépasse 1,4. La marge est
 * mince, et c'est pourquoi l'application **annonce d'abord le ton reconnu**,
 * puis un verdict en trois mots. Un score à deux chiffres donnerait une
 * précision que la mesure n'a pas.
 */
export const SEUIL_JUSTE = 1.2
export const SEUIL_APPROCHANT = 2.2

export const VERDICT_LABELS: Record<Verdict, string> = {
  juste: 'Contour juste',
  approchant: 'Contour approchant',
  a_retravailler: 'Contour à retravailler',
}

export interface Evaluation {
  readonly usable: boolean
  readonly probleme: Probleme | null
  /** Ton auquel la production ressemble le plus. */
  readonly bestTone: Tone | null
  /** Écart quadratique moyen en demi-tons, pour chaque ton. */
  readonly distances: Partial<Record<Tone, number>>
  /** Note sur 100 face au ton attendu, indicative. */
  readonly score: number
  readonly verdict: Verdict | null
  /** Courbe produite, recentrée et rééchantillonnée. */
  readonly curve: readonly number[]
}

export const PROBLEME_MESSAGES: Record<Probleme, string> = {
  trop_court:
    'Enregistrement trop court ou trop haché pour être analysé. Tiens la syllabe une bonne seconde.',
  silence:
    'Rien n’a été entendu. Vérifie que le micro est autorisé et parle plus près.',
  instable:
    'La hauteur mesurée part dans tous les sens. C’est souvent un bruit de fond : essaie dans un endroit plus calme.',
}

export const POINTS = 16

/**
 * Compare une production au ton attendu.
 *
 * On mesure la **forme** et rien d'autre : les deux courbes sont recentrées
 * sur leur propre moyenne avant comparaison, puisque le registre d'un
 * locuteur n'a aucune raison de coïncider avec celui d'un autre.
 */
export function evaluate(contour: NormalizedContour, expected: Tone): Evaluation {
  const empty: Evaluation = {
    usable: false,
    probleme: 'silence',
    bestTone: null,
    distances: {},
    score: 0,
    verdict: null,
    curve: [],
  }

  if (contour.points.length === 0) return empty
  if (contour.points.length < 6) return { ...empty, probleme: 'trop_court' }

  const curve = center(resampleContour(contour, POINTS))
  if (curve.length < POINTS) return { ...empty, probleme: 'trop_court' }

  // Une étendue démesurée signale presque toujours une erreur d'octave ou un
  // bruit, pas une voix : deux octaves sur une syllabe n'existent pas.
  const spread = Math.max(...curve) - Math.min(...curve)
  if (spread > 24) return { ...empty, probleme: 'instable', curve }

  const distances: Partial<Record<Tone, number>> = {}
  for (const tone of SCORED_TONES) {
    const reference = referenceCurve(tone, POINTS)
    const sum = curve.reduce((total, value, index) => {
      const delta = value - (reference[index] ?? 0)
      return total + delta * delta
    }, 0)
    distances[tone] = Math.sqrt(sum / POINTS)
  }

  const bestTone = SCORED_TONES.reduce((best, tone) =>
    (distances[tone] ?? Infinity) < (distances[best] ?? Infinity) ? tone : best,
  )

  const target = distances[expected] ?? Infinity
  // Quatre demi-tons d'écart quadratique moyen, c'est un contour sans rapport
  // avec celui qu'on attendait.
  const score = Math.round(100 * Math.max(0, 1 - target / 4))
  const verdict: Verdict =
    target < SEUIL_JUSTE
      ? 'juste'
      : target < SEUIL_APPROCHANT
        ? 'approchant'
        : 'a_retravailler'

  return { usable: true, probleme: null, bestTone, distances, score, verdict, curve }
}
