/**
 * Décomposition des caractères, au format IDS.
 *
 * Un caractère chinois se décrit par une expression préfixée : 好 s'écrit
 * `⿰女子`, qui se lit « 女 et 子 côte à côte ». L'opérateur dit comment les
 * parties s'assemblent, les opérandes sont des caractères — eux-mêmes
 * décomposables.
 *
 * Savoir qu'un caractère est fait de deux morceaux connus change tout pour un
 * débutant : 好 cesse d'être un dessin arbitraire de six traits pour devenir
 * « une femme et un enfant ».
 */

/** Opérateurs à deux opérandes. */
const BINARY = '⿰⿱⿴⿵⿶⿷⿸⿹⿺⿻'
/** Opérateurs à trois opérandes. */
const TERNARY = '⿲⿳'

/** Marqueur de composant inconnu dans les données source. */
export const UNKNOWN_PART = '？'

export const IDS_DESCRIPTIONS: Readonly<Record<string, string>> = {
  '⿰': 'côte à côte',
  '⿱': 'l’un au-dessus de l’autre',
  '⿲': 'trois parties côte à côte',
  '⿳': 'trois parties superposées',
  '⿴': 'l’un entoure l’autre',
  '⿵': 'entouré par le haut',
  '⿶': 'entouré par le bas',
  '⿷': 'entouré par la gauche',
  '⿸': 'entouré par le haut et la gauche',
  '⿹': 'entouré par le haut et la droite',
  '⿺': 'entouré par la gauche et le bas',
  '⿻': 'imbriqués',
}

export type IdsNode =
  | { readonly kind: 'leaf'; readonly char: string }
  | { readonly kind: 'unknown' }
  | {
      readonly kind: 'compound'
      readonly operator: string
      readonly parts: readonly IdsNode[]
    }

export function isIdsOperator(character: string): boolean {
  return BINARY.includes(character) || TERNARY.includes(character)
}

function arity(operator: string): number {
  return TERNARY.includes(operator) ? 3 : 2
}

/**
 * Analyse une expression IDS.
 *
 * Renvoie `undefined` si l'expression est incomplète ou mal formée : les
 * données source contiennent des décompositions partielles, et afficher un
 * arbre inventé serait pire que ne rien afficher.
 */
export function parseIds(ids: string): IdsNode | undefined {
  const characters = [...ids]
  let position = 0

  function next(): IdsNode | undefined {
    const character = characters[position]
    if (character === undefined) return undefined
    position += 1

    if (character === UNKNOWN_PART) return { kind: 'unknown' }
    if (!isIdsOperator(character)) return { kind: 'leaf', char: character }

    const parts: IdsNode[] = []
    for (let i = 0; i < arity(character); i += 1) {
      const part = next()
      if (part === undefined) return undefined
      parts.push(part)
    }
    return { kind: 'compound', operator: character, parts }
  }

  const tree = next()
  // Une expression bien formée consomme exactement tous les caractères.
  return tree !== undefined && position === characters.length ? tree : undefined
}

/** Composants visibles de l'arbre, dans l'ordre d'écriture. */
export function leaves(node: IdsNode): string[] {
  if (node.kind === 'leaf') return [node.char]
  if (node.kind === 'unknown') return []
  return node.parts.flatMap((part) => leaves(part))
}

/**
 * Composants du premier niveau seulement.
 *
 * C'est ce qu'on montre à l'apprenant : 想 se décompose en 相 et 心, pas
 * directement en 木, 目 et 心. Descendre d'un cran à la fois est ce qui rend
 * la décomposition lisible.
 */
export function topLevelParts(node: IdsNode): string[] {
  if (node.kind !== 'compound') return []
  return node.parts.flatMap((part) =>
    part.kind === 'leaf' ? [part.char] : part.kind === 'unknown' ? [] : leaves(part),
  )
}

/** `true` si le caractère n'est pas décomposable en parties plus simples. */
export function isAtomic(node: IdsNode | undefined, character: string): boolean {
  if (node === undefined) return true
  if (node.kind === 'unknown') return true
  return node.kind === 'leaf' && node.char === character
}
