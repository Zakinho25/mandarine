/**
 * Générateur pseudo-aléatoire déterministe (mulberry32).
 *
 * `Math.random` ne se rejoue pas : un choix de distracteurs impossible à
 * reproduire serait aussi impossible à tester. Toutes les fonctions du domaine
 * qui tirent au sort reçoivent donc un générateur en paramètre.
 */
export type Random = () => number

export function seededRandom(seed: number): Random {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Graine numérique dérivée d'un texte (FNV-1a).
 *
 * Permet d'ancrer un tirage sur l'identité d'une carte : les distracteurs
 * restent les mêmes pendant qu'on y réfléchit, et changent à la révision
 * suivante.
 */
export function hashString(text: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}

/** Mélange une liste sans la modifier (Fisher-Yates). */
export function shuffle<T>(items: readonly T[], random: Random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    const a = result[i]
    const b = result[j]
    if (a === undefined || b === undefined) continue
    result[i] = b
    result[j] = a
  }
  return result
}
