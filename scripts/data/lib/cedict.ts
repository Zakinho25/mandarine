/**
 * Lecteur du format CEDICT, utilisé tel quel par CFDICT.
 *
 * Une ligne ressemble à :
 *   愛 爱 [ai4] /amour/aimer/affection/être amateur de/
 *
 * soit : traditionnel, simplifié, pinyin numéroté entre crochets, puis les
 * sens séparés par des barres obliques. Les lignes commençant par `#` sont
 * des commentaires.
 */
export interface CedictEntry {
  readonly traditional: string
  readonly simplified: string
  /** Pinyin numéroté tel que fourni, par exemple `ai4 hao4`. */
  readonly pinyinNum: string
  readonly definitions: readonly string[]
}

const LINE_RE = /^(\S+)\s+(\S+)\s+\[([^\]]*)\]\s+\/(.*)\/\s*$/

export function parseCedict(text: string): CedictEntry[] {
  const entries: CedictEntry[] = []

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (line.length === 0 || line.startsWith('#')) continue

    const match = LINE_RE.exec(line)
    if (match === null) continue

    const [, traditional, simplified, pinyinNum, body] = match
    if (
      traditional === undefined ||
      simplified === undefined ||
      pinyinNum === undefined ||
      body === undefined
    ) {
      continue
    }

    const definitions = body
      .split('/')
      .map((part) => part.trim())
      .filter((part) => part.length > 0)

    if (definitions.length === 0) continue

    entries.push({ traditional, simplified, pinyinNum, definitions })
  }

  return entries
}

/**
 * Découpe la clé CEDICT de ivankra (`愛|爱[ai4 hao4]`) en ses morceaux.
 * C'est elle qui nous donne gratuitement le pinyin numéroté, forme canonique
 * du projet, sans avoir à redécouper des diacritiques collés.
 */
export function parseCedictKey(
  key: string,
): { traditional: string; simplified: string; pinyinNum: string } | undefined {
  const match = /^([^|[]+)\|([^[]+)\[([^\]]*)\]$/.exec(key.trim())
  if (match === null) return undefined

  const [, traditional, simplified, pinyinNum] = match
  if (traditional === undefined || simplified === undefined || pinyinNum === undefined) {
    return undefined
  }
  return { traditional, simplified, pinyinNum }
}
