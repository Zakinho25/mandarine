import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  allCards,
  ensureCardsForLexemes,
  newWordsToday,
  recordReview,
} from '@/data/cards'
import { loadIndex, loadLevel, type Lexeme } from '@/data/content'
import type { CardRecord } from '@/data/types'
import { ACTIVE_SKILLS, SKILL_LABELS } from '@/domain/srs/cards'
import type { Verdict } from '@/domain/srs/grading'
import { buildSession, type QueueCard, type SessionPlan } from '@/domain/srs/queue'
import type { Note } from '@/domain/srs/scheduler'
import { useSettings } from '@/store/useSettings'
import { Carte } from './Carte'

type Phase = 'chargement' | 'pret' | 'session' | 'termine' | 'erreur'

interface Prepared {
  readonly lexemes: Map<string, Lexeme>
  readonly ordered: readonly Lexeme[]
  readonly cards: readonly CardRecord[]
  readonly introducedToday: number
  /**
   * Instant de référence de la file d'attente, figé au chargement.
   *
   * Lire l'heure pendant le rendu rendrait la session instable : le nombre de
   * cartes dues pourrait changer entre deux rendus, sans que rien ne se soit
   * passé.
   */
  readonly now: string
}

/** Mots nouveaux par jour, déduits de l'objectif quotidien. */
function dailyNewWords(goalMinutes: number): number {
  return Math.max(1, Math.round(goalMinutes / 2))
}

function formatDue(iso: string, now: Date): string {
  const minutes = Math.round((new Date(iso).getTime() - now.getTime()) / 60_000)
  if (minutes < 60) return `dans ${String(Math.max(1, minutes))} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `dans ${String(hours)} h`
  const days = Math.round(hours / 24)
  return days <= 1 ? 'demain' : `dans ${String(days)} jours`
}

export function RevisionsScreen() {
  const dailyGoalMin = useSettings((state) => state.settings.dailyGoalMin)

  const [phase, setPhase] = useState<Phase>('chargement')
  const [error, setError] = useState<string | undefined>(undefined)
  const [prepared, setPrepared] = useState<Prepared | undefined>(undefined)
  const [plan, setPlan] = useState<SessionPlan | undefined>(undefined)
  const [position, setPosition] = useState(0)
  const [tally, setTally] = useState({ done: 0, reussies: 0 })
  const [lastDueLabel, setLastDueLabel] = useState<string | undefined>(undefined)
  const shownAt = useRef<number>(0)

  const load = useCallback(async (): Promise<void> => {
    const index = await loadIndex()
    const files = await Promise.all(index.levels.map((level) => loadLevel(level.level)))
    const ordered = files.flatMap((file) => [...file.lexemes])
    const lexemes = new Map(ordered.map((lexeme) => [lexeme.id, lexeme]))

    // Les cartes sont créées pour tout le vocabulaire dès le départ. Elles
    // naissent « neuves » et n'entrent en session qu'au rythme du plafond
    // quotidien : c'est la file d'attente qui décide, pas la création.
    await ensureCardsForLexemes(ordered.map((lexeme) => lexeme.id))

    const cards = await allCards()
    const introduced = await newWordsToday()
    setPrepared({
      lexemes,
      ordered,
      cards,
      introducedToday: introduced.size,
      now: new Date().toISOString(),
    })
    setPhase('pret')
  }, [])

  useEffect(() => {
    // Chargement asynchrone : les états sont posés dans la promesse, pas
    // pendant le rendu. C'est précisément le cas que cette règle vise à
    // autoriser, mais qu'elle ne sait pas distinguer.
    // eslint-disable-next-line react/set-state-in-effect
    load().catch((cause: unknown) => {
      setError(cause instanceof Error ? cause.message : String(cause))
      setPhase('erreur')
    })
  }, [load])

  /** File d'attente, dans l'ordre du parcours pour les mots encore neufs. */
  const queue = useMemo<QueueCard[]>(() => {
    if (prepared === undefined) return []
    const byKey = new Map(prepared.cards.map((card) => [card.id, card]))
    const result: QueueCard[] = []

    for (const lexeme of prepared.ordered) {
      for (const skill of ACTIVE_SKILLS) {
        const card = byKey.get(`lexeme:${lexeme.id}:${skill}`)
        if (card === undefined) continue
        result.push({
          key: card.id,
          targetId: card.targetId,
          skill: card.skill,
          state: card,
          ...(card.suspendedAt === null ? {} : { suspended: true }),
        })
      }
    }
    return result
  }, [prepared])

  const preview = useMemo(() => {
    if (prepared === undefined) return undefined
    return buildSession(queue, {
      now: prepared.now,
      maxNewWords: Math.max(0, dailyNewWords(dailyGoalMin) - prepared.introducedToday),
    })
  }, [queue, prepared, dailyGoalMin])

  function start(): void {
    if (preview === undefined || preview.cards.length === 0) return
    setPlan(preview)
    setPosition(0)
    setTally({ done: 0, reussies: 0 })
    shownAt.current = Date.now()
    setPhase('session')
  }

  const current = plan?.cards[position]
  const lexeme = current === undefined ? undefined : prepared?.lexemes.get(current.targetId)

  async function answer(result: {
    note: Note
    verdict?: Verdict
    answer?: string
  }): Promise<void> {
    if (current === undefined || prepared === undefined) return
    const card = prepared.cards.find((item) => item.id === current.key)
    if (card === undefined) return

    const saved = await recordReview({
      card,
      note: result.note,
      now: new Date().toISOString(),
      durationMs: Date.now() - shownAt.current,
      goalMs: dailyGoalMin * 60_000,
      ...(result.verdict === undefined ? {} : { verdict: result.verdict }),
      ...(result.answer === undefined ? {} : { answer: result.answer }),
    })

    setLastDueLabel(formatDue(saved.nextDue, new Date()))
    setTally((previous) => ({
      done: previous.done + 1,
      reussies: previous.reussies + (result.note === 'encore' ? 0 : 1),
    }))

    if (plan !== undefined && position + 1 < plan.cards.length) {
      setPosition(position + 1)
      shownAt.current = Date.now()
    } else {
      setPhase('termine')
      // Les cartes replanifiées sont relues pour que le prochain décompte
      // reflète la session qui vient de se terminer.
      const refreshed = await allCards()
      const introduced = await newWordsToday()
      setPrepared({
        ...prepared,
        cards: refreshed,
        introducedToday: introduced.size,
        now: new Date().toISOString(),
      })
    }
  }

  const card = { background: 'var(--surface-raised)', borderColor: 'var(--border)' }

  if (phase === 'erreur') {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <h1 className="mb-2 text-2xl font-semibold">Révisions</h1>
        <p className="text-sm" style={{ color: 'var(--tone-1)' }}>
          {error}
        </p>
      </div>
    )
  }

  if (phase === 'chargement' || prepared === undefined) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <h1 className="mb-2 text-2xl font-semibold">Révisions</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Préparation des cartes…
        </p>
      </div>
    )
  }

  if (phase === 'session' && current !== undefined && lexeme !== undefined) {
    const total = plan?.cards.length ?? 0
    return (
      <div className="mx-auto max-w-xl px-4 py-6">
        <div className="mb-6 flex items-center gap-3">
          <div
            className="h-1 flex-1 overflow-hidden rounded-full"
            style={{ background: 'var(--surface-sunken)' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${String((100 * position) / Math.max(total, 1))}%`,
                background: 'var(--accent)',
              }}
            />
          </div>
          <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
            {position + 1} / {total}
          </span>
        </div>

        <p
          className="mb-6 text-center text-[11px] font-semibold tracking-wide uppercase"
          style={{ color: 'var(--text-muted)' }}
        >
          {SKILL_LABELS[current.skill]}
          {current.state.state === 0 && ' — nouveau'}
        </p>

        <Carte
          cardId={current.key}
          skill={current.skill}
          lexeme={lexeme}
          pool={prepared.ordered}
          onAnswered={(result) => {
            void answer(result)
          }}
        />
      </div>
    )
  }

  if (phase === 'termine') {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <h1 className="mb-2 text-2xl font-semibold">Session terminée</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          {tally.done} carte{tally.done > 1 ? 's' : ''} révisée
          {tally.done > 1 ? 's' : ''}, dont {tally.reussies} sans faute.
          {lastDueLabel !== undefined && ` Prochaine carte ${lastDueLabel}.`}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setPhase('pret')
            }}
            className="min-h-12 rounded-xl px-4 text-sm font-medium"
            style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
          >
            Continuer
          </button>
          <Link
            to="/"
            className="flex min-h-12 items-center rounded-xl border px-4 text-sm"
            style={{ borderColor: 'var(--border)' }}
          >
            Retour au parcours
          </Link>
        </div>
      </div>
    )
  }

  const nothingToDo = preview === undefined || preview.cards.length === 0

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Révisions</h1>

      <section className="rounded-2xl border p-5" style={card}>
        {nothingToDo ? (
          <>
            <p className="text-sm">Rien à réviser pour le moment.</p>
            <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              {prepared.introducedToday > 0
                ? `Tu as découvert ${String(prepared.introducedToday)} mot${prepared.introducedToday > 1 ? 's' : ''} aujourd’hui. Le plafond quotidien est atteint — revenir demain vaut mieux qu’en apprendre trente d’un coup.`
                : 'Reviens quand des cartes arriveront à échéance.'}
            </p>
          </>
        ) : (
          <>
            <dl className="grid grid-cols-2 gap-4 text-center">
              <div className="flex flex-col-reverse">
                <dt className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  à revoir
                </dt>
                <dd className="text-3xl font-semibold">{preview.dueCount}</dd>
              </div>
              <div className="flex flex-col-reverse">
                <dt className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  nouveaux mots
                </dt>
                <dd className="text-3xl font-semibold">{preview.newWordCount}</dd>
              </div>
            </dl>

            <button
              type="button"
              onClick={start}
              className="mt-5 min-h-12 w-full rounded-xl text-sm font-medium"
              style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
            >
              Commencer — {preview.cards.length} carte
              {preview.cards.length > 1 ? 's' : ''}
            </button>

            <p className="mt-3 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Les révisions dues passent avant les nouveautés, et le nombre de mots
              nouveaux est plafonné à {dailyNewWords(dailyGoalMin)} par jour, d’après ton
              objectif de {dailyGoalMin} minutes. Apprendre un mot de plus pendant qu’on
              en oublie trois est une perte sèche.
            </p>
          </>
        )}
      </section>

      <p className="mt-4 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        Chaque mot donne {ACTIVE_SKILLS.length} cartes :{' '}
        {ACTIVE_SKILLS.map((skill) => SKILL_LABELS[skill].toLowerCase()).join(' et ')}.
        Les cartes d’écoute arrivent avec le module audio du jalon 4.
      </p>
    </div>
  )
}
