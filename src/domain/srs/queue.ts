import { isDue, type SrsState } from './scheduler'
import type { CardSkill } from './cards'

/**
 * Composition de la session du jour.
 *
 * Deux principes, tous deux tirés du cahier des charges :
 *
 *  - **les révisions dues passent avant les nouveautés.** Apprendre un mot de
 *    plus pendant qu'on en oublie trois est une perte sèche ;
 *  - **on plafonne les nouveaux mots, pas les révisions.** Le nombre de
 *    révisions est la conséquence de ce qu'on a appris les jours précédents ;
 *    le seul levier honnête est d'en introduire moins aujourd'hui.
 */

export interface QueueCard {
  readonly key: string
  readonly targetId: string
  readonly skill: CardSkill
  readonly state: SrsState
  readonly suspended?: boolean
}

export interface SessionOptions {
  readonly now: string
  /** Nombre maximal de **mots** nouveaux introduits, pas de cartes. */
  readonly maxNewWords: number
  /** Plafond de sécurité sur la longueur totale de la session. */
  readonly maxCards?: number
}

export interface SessionPlan {
  readonly cards: readonly QueueCard[]
  readonly dueCount: number
  readonly newWordCount: number
  /** Révisions dues laissées de côté par le plafond de sécurité. */
  readonly postponed: number
}

/**
 * Évite deux cartes du même mot à la suite.
 *
 * Répondre « bonjour » puis devoir écrire `ni3 hao3` dans la foulée ne teste
 * plus la mémoire : la réponse est encore à l'écran de l'esprit. On intercale
 * donc, sans jamais refuser une carte — l'ordre est un confort, pas une règle.
 */
function spread(cards: readonly QueueCard[]): QueueCard[] {
  const groups = new Map<string, QueueCard[]>()
  for (const card of cards) {
    const group = groups.get(card.targetId)
    if (group === undefined) groups.set(card.targetId, [card])
    else group.push(card)
  }

  const result: QueueCard[] = []
  let previous: string | undefined

  while (result.length < cards.length) {
    // On sert toujours le mot auquel il reste le plus de cartes. Prendre
    // simplement « la première qui diffère » épuise la variété trop tôt et
    // laisse les doublons s'accumuler à la fin.
    let chosen: string | undefined
    let best = 0
    for (const [targetId, group] of groups) {
      if (group.length === 0 || targetId === previous) continue
      if (group.length > best) {
        best = group.length
        chosen = targetId
      }
    }

    if (chosen === undefined) {
      // Il ne reste que des cartes du mot précédent : on les ajoute telles
      // quelles. L'intercalage est un confort, pas une raison d'écarter une
      // carte due.
      const rest = previous === undefined ? undefined : groups.get(previous)
      if (rest !== undefined) result.push(...rest.splice(0))
      break
    }

    const group = groups.get(chosen)
    const next = group?.shift()
    if (next === undefined) break
    result.push(next)
    previous = chosen
  }

  return result
}

export function buildSession(
  cards: readonly QueueCard[],
  options: SessionOptions,
): SessionPlan {
  const active = cards.filter((card) => card.suspended !== true)

  const due = active
    .filter((card) => card.state.state !== 0 && isDue(card.state, options.now))
    // La plus en retard d'abord : c'est celle qui risque le plus d'être oubliée.
    .sort((a, b) => (a.state.due < b.state.due ? -1 : a.state.due > b.state.due ? 1 : 0))

  const maxCards = options.maxCards ?? Number.POSITIVE_INFINITY
  const keptDue = due.slice(0, maxCards)

  // Les nouveaux mots arrivent dans l'ordre où l'appelant les fournit, qui est
  // l'ordre du parcours. On compte les mots, pas les cartes : un mot apporte
  // autant de cartes qu'il a de compétences actives.
  const introduced = new Set<string>()
  const fresh: QueueCard[] = []

  for (const card of active) {
    if (card.state.state !== 0) continue
    if (keptDue.length + fresh.length >= maxCards) break
    if (!introduced.has(card.targetId)) {
      if (introduced.size >= options.maxNewWords) continue
      introduced.add(card.targetId)
    }
    fresh.push(card)
  }

  return {
    // Les deux segments sont intercalés séparément : mélanger l'ensemble
    // ferait remonter les nouveautés, qui ont plus de cartes par mot, devant
    // des révisions dues. Un mot dû n'étant jamais neuf, la jonction entre les
    // deux segments ne crée pas de répétition.
    cards: [...spread(keptDue), ...spread(fresh)],
    dueCount: keptDue.length,
    newWordCount: introduced.size,
    postponed: due.length - keptDue.length,
  }
}
