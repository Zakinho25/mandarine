import { shuffle, type Random } from '../random'

/**
 * Exercice de remise en ordre d'une phrase.
 *
 * C'est le format de l'épreuve d'écriture du HSK : on donne quelques
 * morceaux, l'élève les range. Tout est pur ici — le tirage reçoit son
 * générateur, donc chaque cas de figure est reproductible dans un test.
 */

export interface Morceau {
  /** Position d'origine, qui identifie le morceau même après mélange. */
  readonly id: number
  readonly text: string
}

export interface OrdreSource {
  readonly morceaux: readonly string[]
  /** Phrases acceptées, la première étant l'ordre canonique. */
  readonly acceptes: readonly string[]
}

export function assembler(places: readonly Morceau[]): string {
  return places.map((morceau) => morceau.text).join('')
}

/**
 * Mélange les morceaux pour poser l'exercice.
 *
 * Un mélange qui tombe sur la solution ne donne rien à faire : on retire
 * jusqu'à obtenir autre chose, et si le hasard s'obstine on décale d'un cran.
 * La boucle est bornée, parce qu'une phrase dont tous les ordres sont acceptés
 * ne doit pas bloquer l'application.
 */
export function melanger(source: OrdreSource, random: Random): Morceau[] {
  const morceaux = source.morceaux.map((text, id): Morceau => ({ id, text }))
  const acceptes = new Set(source.acceptes)

  for (let essai = 0; essai < 10; essai += 1) {
    const tire = shuffle(morceaux, random)
    if (!acceptes.has(assembler(tire))) return tire
  }

  const decale = [...morceaux.slice(1), ...morceaux.slice(0, 1)]
  return acceptes.has(assembler(decale)) ? [...morceaux].reverse() : decale
}

export interface Resultat {
  readonly juste: boolean
  readonly phrase: string
  /**
   * Rang du premier morceau mal placé par rapport à l'ordre canonique, à
   * partir de 1 ; `null` quand la réponse est juste. Sert à montrer où
   * regarder plutôt qu'à donner la solution.
   */
  readonly premierEcart: number | null
}

export function verifier(places: readonly Morceau[], source: OrdreSource): Resultat {
  const phrase = assembler(places)
  if (source.acceptes.includes(phrase)) {
    return { juste: true, phrase, premierEcart: null }
  }

  // L'écart est mesuré contre l'ordre canonique, le premier de la liste :
  // c'est celui que la fiche enseigne.
  let ecart: number | null = null
  for (const [index, morceau] of places.entries()) {
    if (morceau.id !== index) {
      ecart = index + 1
      break
    }
  }

  return { juste: false, phrase, premierEcart: ecart }
}

/** Déplace un morceau d'une position à une autre, sans modifier l'entrée. */
export function deplacer(
  places: readonly Morceau[],
  depuis: number,
  vers: number,
): Morceau[] {
  const morceau = places[depuis]
  if (morceau === undefined) return [...places]
  const cible = Math.max(0, Math.min(places.length - 1, vers))

  const reste = [...places.slice(0, depuis), ...places.slice(depuis + 1)]
  return [...reste.slice(0, cible), morceau, ...reste.slice(cible)]
}
