/**
 * Découpage du chinois en mots.
 *
 * Le chinois ne sépare pas ses mots par des espaces : 我喜欢学习中文 est une
 * suite de six caractères qui vaut quatre mots. Sans découpage, impossible de
 * surligner un mot, d'en afficher la définition au toucher, ou de calculer le
 * pourcentage de mots connus d'un texte.
 *
 * ### Pourquoi un segmenteur maison
 *
 * `Intl.Segmenter` sait découper le chinois, mais selon un dictionnaire
 * générique qui ne coïncide pas avec notre vocabulaire. Si le segmenteur coupe
 * 不客气 en trois alors que l'application l'enseigne comme un mot, le
 * surlignage, le compte de mots connus et l'ajout aux révisions deviennent
 * tous faux. **Le découpage doit être le même que celui qui définit ce qu'on
 * enseigne**, donc il part de notre propre lexique.
 *
 * ### L'algorithme
 *
 * Appariement maximal bidirectionnel : on découpe une fois de gauche à droite
 * en prenant à chaque pas le mot le plus long possible, une fois de droite à
 * gauche, puis on garde le meilleur des deux. C'est la méthode classique, et
 * elle est très bonne sur un lexique fermé comme le nôtre.
 */

export interface Token {
  readonly text: string
  /** Position du premier caractère dans la chaîne d'origine. */
  readonly start: number
  readonly end: number
  /** `true` si le mot figure au lexique. */
  readonly known: boolean
}

export interface Lexicon {
  /** Mots reconnus, en caractères simplifiés. */
  readonly words: ReadonlySet<string>
  /** Longueur du mot le plus long, en caractères. */
  readonly maxLength: number
}

export function buildLexicon(words: Iterable<string>): Lexicon {
  const set = new Set<string>()
  let maxLength = 1
  for (const word of words) {
    if (word.length === 0) continue
    set.add(word)
    maxLength = Math.max(maxLength, [...word].length)
  }
  return { words: set, maxLength }
}

/** `true` pour un caractère chinois (plan de base plus extension A). */
export function isHanzi(character: string): boolean {
  const code = character.codePointAt(0) ?? 0
  return (code >= 0x4e00 && code <= 0x9fff) || (code >= 0x3400 && code <= 0x4dbf)
}

interface Piece {
  readonly text: string
  readonly known: boolean
}

/** Découpe une suite de caractères chinois, de gauche à droite. */
function forward(characters: readonly string[], lexicon: Lexicon): Piece[] {
  const pieces: Piece[] = []
  let i = 0

  while (i < characters.length) {
    const limit = Math.min(lexicon.maxLength, characters.length - i)
    let taken = ''

    for (let length = limit; length >= 2; length -= 1) {
      const candidate = characters.slice(i, i + length).join('')
      if (lexicon.words.has(candidate)) {
        taken = candidate
        break
      }
    }

    if (taken === '') {
      const single = characters[i] ?? ''
      pieces.push({ text: single, known: lexicon.words.has(single) })
      i += 1
    } else {
      pieces.push({ text: taken, known: true })
      i += [...taken].length
    }
  }

  return pieces
}

/** Découpe une suite de caractères chinois, de droite à gauche. */
function backward(characters: readonly string[], lexicon: Lexicon): Piece[] {
  const pieces: Piece[] = []
  let end = characters.length

  while (end > 0) {
    const limit = Math.min(lexicon.maxLength, end)
    let taken = ''

    for (let length = limit; length >= 2; length -= 1) {
      const candidate = characters.slice(end - length, end).join('')
      if (lexicon.words.has(candidate)) {
        taken = candidate
        break
      }
    }

    if (taken === '') {
      const single = characters[end - 1] ?? ''
      pieces.unshift({ text: single, known: lexicon.words.has(single) })
      end -= 1
    } else {
      pieces.unshift({ text: taken, known: true })
      end -= [...taken].length
    }
  }

  return pieces
}

function countSingles(pieces: readonly Piece[]): number {
  return pieces.filter((piece) => [...piece.text].length === 1).length
}

function countUnknown(pieces: readonly Piece[]): number {
  return pieces.filter((piece) => !piece.known).length
}

/**
 * Choisit entre les deux découpages.
 *
 * Dans l'ordre : le moins de mots inconnus, puis le moins de mots, puis le
 * moins de caractères isolés. En cas d'égalité parfaite on garde le découpage
 * arrière, qui est statistiquement meilleur en chinois.
 */
function best(forwardPieces: Piece[], backwardPieces: Piece[]): Piece[] {
  const unknownDelta = countUnknown(forwardPieces) - countUnknown(backwardPieces)
  if (unknownDelta !== 0) return unknownDelta < 0 ? forwardPieces : backwardPieces

  if (forwardPieces.length !== backwardPieces.length) {
    return forwardPieces.length < backwardPieces.length ? forwardPieces : backwardPieces
  }

  return countSingles(forwardPieces) < countSingles(backwardPieces)
    ? forwardPieces
    : backwardPieces
}

/**
 * Découpe un texte en mots et en fragments non chinois.
 *
 * La ponctuation, les espaces et les caractères latins sont rendus tels quels,
 * dans leur propre jeton, pour que le texte puisse être réaffiché à
 * l'identique.
 */
export function segment(text: string, lexicon: Lexicon): Token[] {
  const characters = [...text]
  const tokens: Token[] = []

  let index = 0
  while (index < characters.length) {
    const character = characters[index] ?? ''

    if (!isHanzi(character)) {
      // On agrège les caractères non chinois consécutifs : ponctuation,
      // espaces, chiffres.
      let end = index
      while (end < characters.length && !isHanzi(characters[end] ?? '')) end += 1
      tokens.push({
        text: characters.slice(index, end).join(''),
        start: index,
        end,
        known: false,
      })
      index = end
      continue
    }

    let end = index
    while (end < characters.length && isHanzi(characters[end] ?? '')) end += 1
    const run = characters.slice(index, end)

    let offset = index
    for (const piece of best(forward(run, lexicon), backward(run, lexicon))) {
      const length = [...piece.text].length
      tokens.push({ text: piece.text, start: offset, end: offset + length, known: piece.known })
      offset += length
    }
    index = end
  }

  return tokens
}

/** Part des mots chinois du texte qui figurent au lexique, entre 0 et 1. */
export function knownRatio(tokens: readonly Token[]): number {
  const words = tokens.filter((token) => isHanzi(token.text.charAt(0)))
  if (words.length === 0) return 1
  return words.filter((token) => token.known).length / words.length
}
