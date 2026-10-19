import { stripTone } from './pinyin/index'

/**
 * Recherche dans le vocabulaire.
 *
 * Le corpus tient en mille entrées : un parcours linéaire est instantané, et
 * aucun index ni bibliothèque n'est nécessaire. Ce qui compte n'est pas la
 * vitesse mais la **tolérance** — on doit pouvoir taper `ni hao` sans
 * diacritique ni chiffre de ton, ou `etudier` sans accent, et trouver.
 */

/** Ce dont la recherche a besoin ; `Lexeme` le satisfait structurellement. */
export interface Searchable {
  readonly simplified: string
  readonly traditional: string | null
  readonly pinyinNum: string
  readonly pinyinMark: string
  readonly glossFr: readonly string[]
}

/**
 * Forme comparable d'un texte français ou latin : minuscules, sans accent,
 * sans espace ni ponctuation. `étudier` et `Etudier` se rejoignent, et
 * `nihao` trouve `nǐ hǎo`.
 */
export function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9一-鿿]/g, '')
}

/** `true` si le mot correspond à la requête. Une requête vide accepte tout. */
export function matches(item: Searchable, query: string): boolean {
  const needle = fold(query)
  if (needle.length === 0) return true

  if (item.simplified.includes(query.trim())) return true
  if (item.traditional !== null && item.traditional.includes(query.trim())) return true

  // Le pinyin se cherche sans ton : on tape rarement les chiffres ou les
  // diacritiques, et jamais sur un clavier de téléphone.
  if (fold(stripTone(item.pinyinNum)).includes(needle)) return true
  if (fold(item.pinyinMark).includes(needle)) return true

  return item.glossFr.some((gloss) => fold(gloss).includes(needle))
}

/** Filtre une liste, en préservant son ordre. */
export function search<T extends Searchable>(items: readonly T[], query: string): T[] {
  const trimmed = query.trim()
  if (trimmed.length === 0) return [...items]
  return items.filter((item) => matches(item, trimmed))
}
