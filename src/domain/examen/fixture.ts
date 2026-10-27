import type {
  EchangeSource,
  Jeton,
  MotSource,
  PassageSource,
  PhraseSource,
  Vivier,
} from './generation'

/**
 * Vivier synthétique pour les tests.
 *
 * Il est fabriqué, et c'est volontaire : un vivier tiré du contenu réel
 * rendrait les tests dépendants d'une régénération de données, et un échec
 * ne dirait plus si la faute est dans l'algorithme ou dans le contenu.
 *
 * Ce fichier n'est utilisé que par les tests. Il reste dans `src/domain`
 * parce qu'il ne dépend de rien d'autre que du domaine.
 */

const SYLLABES = ['ma', 'shi', 'xue', 'hao', 'lai', 'kan', 'chi', 'zuo', 'tian', 'nian']

function mot(index: number, level: number): MotSource {
  const syllabe = SYLLABES[index % SYLLABES.length] ?? 'ma'
  const ton = (index % 4) + 1
  return {
    id: `mot-${String(index)}`,
    simplified: `词${String(index)}`,
    pinyinNum: `${syllabe}${String(ton)}`,
    glossFr: [`sens ${String(index)}`],
    level,
  }
}

function jetons(mots: readonly MotSource[]): Jeton[] {
  return mots.map((entry) => ({ text: entry.simplified, lexemeId: entry.id }))
}

export interface FixtureOptions {
  readonly mots?: number
  readonly phrases?: number
  readonly echanges?: number
  readonly passages?: number
  /** Niveau attribué à toute la matière. */
  readonly level?: number
}

export function vivierDeTest(options: FixtureOptions = {}): Vivier {
  const level = options.level ?? 1
  const nbMots = options.mots ?? 40
  const nbPhrases = options.phrases ?? 30
  const nbEchanges = options.echanges ?? 24
  const nbPassages = options.passages ?? 20

  const mots = Array.from({ length: nbMots }, (_, index) => mot(index, level))

  // Deux marqueurs connus, pour que les items à trou aient de quoi se
  // disputer.
  const marqueurs = [mots[0]?.simplified, mots[1]?.simplified, mots[2]?.simplified]
    .filter((graphie): graphie is string => graphie !== undefined)

  const phrases = Array.from({ length: nbPhrases }, (_, index): PhraseSource => {
    const pointId = index % 2 === 0 ? `point-${String(index % 5)}` : null
    // Une phrase qui illustre un point contient l'un de ses marqueurs : c'est
    // le cas réel, et sans ça les items à trou ne porteraient jamais sur la
    // grammaire.
    const choisis = [
      ...(pointId === null ? [] : [mots[index % marqueurs.length]]),
      mots[index % nbMots],
      mots[(index + 1) % nbMots],
      mots[(index + 2) % nbMots],
    ].filter((entry): entry is MotSource => entry !== undefined)
    return {
      id: `phrase-${String(index)}`,
      level,
      zh: choisis.map((entry) => entry.simplified).join(''),
      fr: `traduction ${String(index)}`,
      tokens: jetons(choisis),
      pointId,
      markers: pointId === null ? [] : marqueurs,
    }
  })

  const echanges = Array.from({ length: nbEchanges }, (_, index): EchangeSource => {
    const base = (index * 3) % nbMots
    const prendre = (decalage: number): PhraseSource => {
      const entry = mots[(base + decalage) % nbMots]
      const retenus = entry === undefined ? [] : [entry]
      return {
        id: `replique-${String(index)}-${String(decalage)}`,
        level,
        zh: `句${String(index)}_${String(decalage)}`,
        fr: `réplique ${String(index)}.${String(decalage)}`,
        tokens: jetons(retenus),
        pointId: null,
        markers: [],
      }
    }
    return {
      id: `echange-${String(index)}`,
      level,
      amorce: prendre(0),
      bonne: prendre(1),
      mauvaises: [prendre(2), prendre(3)],
    }
  })

  const passages = Array.from({ length: nbPassages }, (_, index): PassageSource => {
    const choisis = Array.from({ length: 5 }, (_, offset) => mots[(index + offset) % nbMots])
      .filter((entry): entry is MotSource => entry !== undefined)
    return {
      id: `passage-${String(index)}`,
      level,
      texteId: `texte-${String(index % 4)}`,
      fr: `résumé ${String(index)}`,
      tokens: jetons(choisis),
    }
  })

  return { mots, phrases, echanges, passages, marqueurs }
}
