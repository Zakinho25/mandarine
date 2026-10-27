import { seededRandom, shuffle, type Random } from '../random'
import { pickDistractors, type DistractorItem } from '../srs/distractors'
import { PARTIES, type Longueur, type PartieId } from './format'

/**
 * Fabrication d'un examen blanc à partir de la matière déjà vérifiée.
 *
 * Aucun item n'est écrit à la main : tout est construit à partir du
 * vocabulaire du syllabus, des exemples de grammaire, des dialogues et des
 * textes de lecture. Trois conséquences, toutes voulues :
 *
 *  - rien de protégé n'est reproduit, puisque rien ne vient d'un sujet réel ;
 *  - chaque item est traçable jusqu'à sa source vérifiée ;
 *  - deux examens ne se ressemblent pas, et le même numéro se rejoue à
 *    l'identique.
 *
 * Quand la matière manque pour remplir une partie, la partie est plus courte
 * et le dit. Inventer un item pour atteindre le compte annoncé serait la
 * seule manière de se tromper durablement sur son niveau.
 */

export interface Jeton {
  readonly text: string
  /** `null` pour la ponctuation, les noms propres et le trou à combler. */
  readonly lexemeId: string | null
}

/** Marque le mot à trouver dans un item à trou. */
export const TROU = '＿＿＿'

export interface MotSource extends DistractorItem {
  readonly level: number
}

export interface PhraseSource {
  readonly id: string
  readonly level: number
  readonly zh: string
  readonly fr: string
  readonly tokens: readonly Jeton[]
  /** Point de grammaire dont cette phrase est l'exemple, s'il y en a un. */
  readonly pointId: string | null
  /** Mots-clés du point : ce sont eux qu'on cache en priorité. */
  readonly markers: readonly string[]
}

export interface EchangeSource {
  readonly id: string
  readonly level: number
  /** Ce que dit l'interlocuteur. */
  readonly amorce: PhraseSource
  readonly bonne: PhraseSource
  /** Réponses maladroites écrites pour ce tour de dialogue. */
  readonly mauvaises: readonly PhraseSource[]
}

export interface PassageSource {
  readonly id: string
  readonly level: number
  /** Texte d'origine, pour préférer des distracteurs du même sujet. */
  readonly texteId: string
  readonly fr: string
  readonly tokens: readonly Jeton[]
}

export interface Vivier {
  readonly mots: readonly MotSource[]
  readonly phrases: readonly PhraseSource[]
  readonly echanges: readonly EchangeSource[]
  readonly passages: readonly PassageSource[]
  /** Tous les marqueurs de grammaire du niveau, viviers des trous. */
  readonly marqueurs: readonly string[]
}

export interface Choix {
  readonly id: string
  readonly zh: string | null
  readonly fr: string | null
}

export interface Item {
  readonly id: string
  readonly partie: PartieId
  /** Texte prononcé par la synthèse vocale ; `null` pour la lecture. */
  readonly audio: string | null
  /** Énoncé affiché ; `null` quand il faut d'abord écouter. */
  readonly enonce: readonly Jeton[] | null
  readonly choix: readonly Choix[]
  readonly bonne: string
  /** Mots en jeu, pour nourrir les révisions en cas d'erreur. */
  readonly lexemeIds: readonly string[]
  readonly pointId: string | null
  /**
   * Identifiant de la source vérifiée d'où l'item sort : mot du syllabus,
   * exemple de grammaire, tour de dialogue, paragraphe de lecture. Sert à
   * garantir qu'aucune source ne resserve dans le même examen, et à remonter
   * d'un item douteux jusqu'à son contenu d'origine.
   */
  readonly source: string
}

export interface Partie {
  readonly id: PartieId
  readonly items: readonly Item[]
  /** Items qu'on n'a pas pu fabriquer faute de matière. */
  readonly manquants: number
}

export interface Examen {
  readonly id: string
  readonly seed: number
  readonly level: number
  readonly longueur: Longueur
  readonly creeA: string
  readonly parties: readonly Partie[]
}

function glose(mot: DistractorItem): string {
  return mot.glossFr.slice(0, 2).join(', ')
}

/** Texte réellement affiché pour une proposition. */
function affiche(choix: Choix): string {
  return choix.fr ?? choix.zh ?? ''
}

/**
 * Assemble les propositions d'un item en écartant les doublons visibles.
 *
 * Deux mots distincts peuvent s'afficher pareil : 这 et 那个 se glosent tous
 * deux « ce, cet ». L'item devient alors insoluble, et c'est l'élève qui en
 * paie le prix. La règle d'équité de `sharesMeaning` ne suffit pas : elle
 * compare chaque candidat à la bonne réponse, pas les candidats entre eux.
 *
 * Rend la bonne réponse suivie d'au plus `combien` distracteurs distincts, le
 * tout mélangé. Aux appelants de refuser l'item s'il en manque.
 */
function construireChoix(
  bon: Choix,
  candidats: readonly Choix[],
  combien: number,
  random: Random,
): Choix[] {
  const retenus: Choix[] = [bon]
  const vus = new Set<string>([affiche(bon)])
  const ids = new Set<string>([bon.id])

  for (const candidat of candidats) {
    if (retenus.length > combien) break
    const texte = affiche(candidat)
    if (texte === '' || vus.has(texte) || ids.has(candidat.id)) continue
    retenus.push(candidat)
    vus.add(texte)
    ids.add(candidat.id)
  }

  return shuffle(retenus, random)
}

/** Mots communs à deux phrases : sert à écarter les distracteurs trop lointains. */
function communs(a: PhraseSource, b: PhraseSource): number {
  const ids = new Set(a.tokens.map((jeton) => jeton.lexemeId).filter((id) => id !== null))
  return b.tokens.filter((jeton) => jeton.lexemeId !== null && ids.has(jeton.lexemeId))
    .length
}

function lexemesDe(...phrases: readonly PhraseSource[]): string[] {
  const ids = new Set<string>()
  for (const phrase of phrases) {
    for (const jeton of phrase.tokens) {
      if (jeton.lexemeId !== null) ids.add(jeton.lexemeId)
    }
  }
  return [...ids]
}

/**
 * Tire `combien` éléments sans jamais reprendre une source déjà utilisée
 * ailleurs dans l'examen.
 */
function tirer<T extends { readonly id: string }>(
  pool: readonly T[],
  utilises: Set<string>,
  combien: number,
  random: Random,
): T[] {
  const libres = pool.filter((entry) => !utilises.has(entry.id))
  const choisis = shuffle(libres, random).slice(0, combien)
  for (const entry of choisis) utilises.add(entry.id)
  return choisis
}

function partieVide(id: PartieId, vises: number): Partie {
  return { id, items: [], manquants: vises }
}

function assembler(id: PartieId, items: readonly Item[], vises: number): Partie {
  return { id, items, manquants: Math.max(0, vises - items.length) }
}

/** Partie 1 d'écoute : entendre un mot, en choisir le sens. */
function ecouteMot(vivier: Vivier, vises: number, random: Random, utilises: Set<string>) {
  const cibles = tirer(vivier.mots, utilises, vises, random)

  const items = cibles.flatMap((mot, index): Item[] => {
    // On demande plus de distracteurs qu'il n'en faut : ceux qui s'affichent
    // comme un autre seront écartés, et il doit en rester assez.
    const distracteurs = pickDistractors(mot, vivier.mots, random, { count: 8 })
    const choix = construireChoix(
      { id: mot.id, zh: null, fr: glose(mot) },
      distracteurs.map((candidat) => ({
        id: candidat.id,
        zh: null,
        fr: glose(candidat),
      })),
      3,
      random,
    )
    // Un item à moins de trois propositions ne teste rien.
    if (choix.length < 3) return []

    return [
      {
        id: `ecoute-mot-${String(index)}`,
        partie: 'ecoute-mot',
        audio: mot.simplified,
        enonce: null,
        choix,
        bonne: mot.id,
        lexemeIds: [mot.id],
        pointId: null,
        source: mot.id,
      },
    ]
  })

  return assembler('ecoute-mot', items, vises)
}

/** Partie 2 d'écoute : entendre une phrase, en choisir le sens. */
function ecoutePhrase(
  vivier: Vivier,
  vises: number,
  random: Random,
  utilises: Set<string>,
) {
  const cibles = tirer(vivier.phrases, utilises, vises, random)

  const items = cibles.flatMap((phrase, index): Item[] => {
    // Les distracteurs les plus utiles partagent du vocabulaire avec la
    // phrase : il faut comprendre pour trancher, pas seulement reconnaître
    // un mot.
    const proches = vivier.phrases
      .filter((autre) => autre.id !== phrase.id && autre.fr !== phrase.fr)
      .map((autre) => ({ autre, score: communs(phrase, autre) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((entry) => entry.autre)

    const choix = construireChoix(
      { id: phrase.id, zh: null, fr: phrase.fr },
      shuffle(proches, random).map((candidat) => ({
        id: candidat.id,
        zh: null,
        fr: candidat.fr,
      })),
      2,
      random,
    )
    if (choix.length < 3) return []

    return [
      {
        id: `ecoute-phrase-${String(index)}`,
        partie: 'ecoute-phrase',
        audio: phrase.zh,
        enonce: null,
        choix,
        bonne: phrase.id,
        lexemeIds: lexemesDe(phrase),
        pointId: phrase.pointId,
        source: phrase.id,
      },
    ]
  })

  return assembler('ecoute-phrase', items, vises)
}

/** Partie 3 d'écoute : entendre une réplique, choisir la réponse qui convient. */
function ecouteEchange(
  vivier: Vivier,
  vises: number,
  random: Random,
  utilises: Set<string>,
) {
  const cibles = tirer(vivier.echanges, utilises, vises, random)

  const items = cibles.flatMap((echange, index): Item[] => {
    // Les réponses maladroites écrites pour ce tour font les meilleurs
    // distracteurs : elles sont plausibles par construction. Tous les tours
    // n'en ont pas deux, alors on complète avec les bonnes réponses d'autres
    // échanges plutôt que de poser un item à deux propositions.
    const appoint = vivier.echanges
      .filter((candidat) => candidat.id !== echange.id)
      .map((candidat) => candidat.bonne)

    const choix = construireChoix(
      { id: echange.bonne.id, zh: echange.bonne.zh, fr: null },
      [...echange.mauvaises, ...shuffle(appoint, random)].map((candidat) => ({
        id: candidat.id,
        zh: candidat.zh,
        fr: null,
      })),
      2,
      random,
    )
    if (choix.length < 3) return []

    return [
      {
        id: `ecoute-echange-${String(index)}`,
        partie: 'ecoute-echange',
        audio: echange.amorce.zh,
        enonce: null,
        choix,
        bonne: echange.bonne.id,
        lexemeIds: lexemesDe(echange.amorce, echange.bonne),
        pointId: null,
        source: echange.id,
      },
    ]
  })

  return assembler('ecoute-echange', items, vises)
}

/** Partie 1 de lecture : lire une phrase, choisir la réponse qui lui convient. */
function lectureReponse(
  vivier: Vivier,
  vises: number,
  random: Random,
  utilises: Set<string>,
) {
  const cibles = tirer(vivier.echanges, utilises, vises, random)

  const items = cibles.flatMap((echange, index): Item[] => {
    // Les distracteurs sont les **bonnes** réponses d'autres échanges : trois
    // phrases naturelles, dont une seule répond à celle qu'on lit. Reprendre
    // les réponses maladroites du même tour reviendrait à refaire la partie
    // d'écoute.
    const autres = vivier.echanges
      .filter((candidat) => candidat.id !== echange.id)
      .map((candidat) => candidat.bonne)
      .filter((reponse) => reponse.zh !== echange.bonne.zh)

    const choix = construireChoix(
      { id: echange.bonne.id, zh: echange.bonne.zh, fr: null },
      shuffle(autres, random).map((candidat) => ({
        id: candidat.id,
        zh: candidat.zh,
        fr: null,
      })),
      3,
      random,
    )
    if (choix.length < 3) return []

    return [
      {
        id: `lecture-reponse-${String(index)}`,
        partie: 'lecture-reponse',
        audio: null,
        enonce: echange.amorce.tokens,
        choix,
        bonne: echange.bonne.id,
        lexemeIds: lexemesDe(echange.amorce, echange.bonne),
        pointId: null,
        source: echange.id,
      },
    ]
  })

  return assembler('lecture-reponse', items, vises)
}

interface Trou {
  readonly jetons: Jeton[]
  readonly mot: MotSource
  /** Vrai quand le mot caché est un marqueur du point de grammaire. */
  readonly marqueur: boolean
}

/**
 * Choisit le mot à cacher dans une phrase.
 *
 * On cache en priorité le marqueur du point que la phrase illustre : c'est le
 * mot que la fiche enseigne, et un trou à cet endroit mesure la grammaire
 * plutôt que le vocabulaire. À défaut, n'importe quel mot connu fait l'affaire.
 */
function creuser(
  phrase: PhraseSource,
  mots: ReadonlyMap<string, MotSource>,
  random: Random,
): Trou | undefined {
  const candidats = phrase.tokens
    .map((jeton, index) => ({ jeton, index }))
    .filter((entry) => entry.jeton.lexemeId !== null && mots.has(entry.jeton.lexemeId))

  const marqueurs = candidats.filter((entry) =>
    phrase.markers.includes(entry.jeton.text),
  )
  const vivier = marqueurs.length > 0 ? marqueurs : candidats
  const choisi = shuffle(vivier, random)[0]
  if (choisi === undefined) return undefined

  const mot = mots.get(choisi.jeton.lexemeId ?? '')
  if (mot === undefined) return undefined

  return {
    jetons: phrase.tokens.map((jeton, index) =>
      index === choisi.index ? { text: TROU, lexemeId: null } : jeton,
    ),
    mot,
    marqueur: marqueurs.length > 0,
  }
}

/** Partie 2 de lecture : compléter une phrase par le mot qui manque. */
function lectureTrou(
  vivier: Vivier,
  vises: number,
  random: Random,
  utilises: Set<string>,
) {
  const parId = new Map(vivier.mots.map((mot) => [mot.id, mot]))
  const parGraphie = new Map(vivier.mots.map((mot) => [mot.simplified, mot]))
  const cibles = tirer(vivier.phrases, utilises, vises, random)

  const items = cibles.flatMap((phrase, index): Item[] => {
    const trou = creuser(phrase, parId, random)
    if (trou === undefined) return []

    // Un trou sur un marqueur se dispute avec d'autres marqueurs : 的 contre
    // 得 contre 地. Un trou sur un mot ordinaire se dispute avec des mots
    // proches par le son ou la graphie.
    const ordinaires = () => pickDistractors(trou.mot, vivier.mots, random, { count: 8 })
    const concurrents = trou.marqueur
      ? shuffle(
          vivier.marqueurs
            .filter((marqueur) => !phrase.markers.includes(marqueur))
            .map((marqueur) => parGraphie.get(marqueur))
            .filter((mot): mot is MotSource => mot !== undefined),
          random,
        )
      : ordinaires()

    // Quand un point emploie à lui seul presque tous les marqueurs connus, il
    // n'en reste pas assez pour s'opposer au bon. Des distracteurs ordinaires
    // font alors un item moins ciblé, mais un item quand même : mieux que
    // supprimer la question.
    const faux = concurrents.length >= 2 ? concurrents : ordinaires()

    const choix = construireChoix(
      { id: trou.mot.id, zh: trou.mot.simplified, fr: null },
      faux.map((candidat) => ({
        id: candidat.id,
        zh: candidat.simplified,
        fr: null,
      })),
      3,
      random,
    )
    if (choix.length < 3) return []

    return [
      {
        id: `lecture-trou-${String(index)}`,
        partie: 'lecture-trou',
        audio: null,
        enonce: trou.jetons,
        choix,
        bonne: trou.mot.id,
        lexemeIds: [trou.mot.id],
        pointId: trou.marqueur ? phrase.pointId : null,
        source: phrase.id,
      },
    ]
  })

  return assembler('lecture-trou', items, vises)
}

/** Partie 3 de lecture : lire un passage et dire ce qu'il raconte. */
function lecturePassage(
  vivier: Vivier,
  vises: number,
  random: Random,
  utilises: Set<string>,
) {
  const cibles = tirer(vivier.passages, utilises, vises, random)

  const items = cibles.flatMap((passage, index): Item[] => {
    // Les passages du même texte font les meilleurs distracteurs : même
    // sujet, mêmes personnages, donc il faut vraiment lire.
    const autres = vivier.passages.filter(
      (candidat) => candidat.id !== passage.id && candidat.fr !== passage.fr,
    )
    const memeTexte = autres.filter((candidat) => candidat.texteId === passage.texteId)
    const classes = [...shuffle(memeTexte, random), ...shuffle(autres, random)]

    const choix = construireChoix(
      { id: passage.id, zh: null, fr: passage.fr },
      classes.map((candidat) => ({
        id: candidat.id,
        zh: null,
        fr: candidat.fr,
      })),
      2,
      random,
    )
    if (choix.length < 3) return []

    return [
      {
        id: `lecture-passage-${String(index)}`,
        partie: 'lecture-passage',
        audio: null,
        enonce: passage.tokens,
        choix,
        bonne: passage.id,
        lexemeIds: passage.tokens
          .map((jeton) => jeton.lexemeId)
          .filter((id): id is string => id !== null),
        pointId: null,
        source: passage.id,
      },
    ]
  })

  return assembler('lecture-passage', items, vises)
}

export interface GenerationOptions {
  readonly level: number
  readonly longueur: Longueur
  readonly seed: number
  readonly creeA: string
}

/**
 * Ne garde que la matière du niveau visé et des niveaux inférieurs.
 *
 * La restriction est faite ici plutôt que dans la couche de données : c'est
 * une garantie pédagogique, et une garantie se teste. Un examen de niveau 2
 * ne doit jamais faire apparaître un mot de niveau 3, ni comme réponse ni
 * comme distracteur.
 */
export function restreindre(vivier: Vivier, level: number): Vivier {
  const mots = vivier.mots.filter((mot) => mot.level <= level)
  const graphies = new Set(mots.map((mot) => mot.simplified))
  return {
    mots,
    phrases: vivier.phrases.filter((phrase) => phrase.level <= level),
    echanges: vivier.echanges.filter((echange) => echange.level <= level),
    passages: vivier.passages.filter((passage) => passage.level <= level),
    marqueurs: vivier.marqueurs.filter((marqueur) => graphies.has(marqueur)),
  }
}

export function genererExamen(source: Vivier, options: GenerationOptions): Examen {
  const vivier = restreindre(source, options.level)
  const random = seededRandom(options.seed)

  // Un identifiant de source n'est consommé qu'une fois dans tout l'examen :
  // retrouver la même phrase à deux endroits donnerait une bonne réponse
  // gratuite.
  const mots = new Set<string>()
  const phrases = new Set<string>()
  const echanges = new Set<string>()
  const passages = new Set<string>()

  const vises = (id: PartieId): number => {
    const partie = PARTIES.find((candidat) => candidat.id === id)
    return partie?.items[options.longueur] ?? 0
  }

  const parties: Partie[] = [
    ecouteMot(vivier, vises('ecoute-mot'), random, mots),
    ecoutePhrase(vivier, vises('ecoute-phrase'), random, phrases),
    ecouteEchange(vivier, vises('ecoute-echange'), random, echanges),
    lectureReponse(vivier, vises('lecture-reponse'), random, echanges),
    lectureTrou(vivier, vises('lecture-trou'), random, phrases),
    lecturePassage(vivier, vises('lecture-passage'), random, passages),
  ]

  return {
    id: `examen-${String(options.seed)}`,
    seed: options.seed,
    level: options.level,
    longueur: options.longueur,
    creeA: options.creeA,
    parties: parties.map((partie) =>
      partie.items.length === 0 ? partieVide(partie.id, partie.manquants) : partie,
    ),
  }
}

/** Tous les items dans l'ordre des parties. */
export function itemsDe(examen: Examen): readonly Item[] {
  return examen.parties.flatMap((partie) => partie.items)
}
