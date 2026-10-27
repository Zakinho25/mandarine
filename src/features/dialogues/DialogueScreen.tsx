import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { loadIndex, loadLevel, type Lexeme } from '@/data/content'
import {
  loadDialogue,
  QUALITE_LABELS,
  tokensToText,
  type Dialogue,
  type NoeudDialogue,
  type Replique,
} from '@/data/dialogues'
import { useSettings } from '@/store/useSettings'
import { BoutonEcouter } from '@/ui/BoutonEcouter'
import { LigneChinoise } from '@/ui/LigneChinoise'
import { useSpeech } from '@/ui/useSpeech'

type Phase = 'intro' | 'echange' | 'bilan'

interface Tour {
  readonly noeud: NoeudDialogue
  readonly choix: Replique
}

const COULEURS = {
  juste: 'var(--tone-3)',
  maladroit: 'var(--tone-2)',
  inadapte: 'var(--tone-1)',
} as const

export function DialogueScreen() {
  const params = useParams<{ id: string }>()
  const id = params.id ?? ''
  const pinyinDisplay = useSettings((state) => state.settings.pinyinDisplay)
  const { status, say } = useSpeech()
  const muet = status?.voice == null

  const [dialogue, setDialogue] = useState<Dialogue | undefined>(undefined)
  const [lexemes, setLexemes] = useState<Map<string, Lexeme>>(new Map())
  const [error, setError] = useState<string | undefined>(undefined)

  const [phase, setPhase] = useState<Phase>('intro')
  const [current, setCurrent] = useState<string | undefined>(undefined)
  const [history, setHistory] = useState<Tour[]>([])
  const [showFr, setShowFr] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const [file, index] = await Promise.all([loadDialogue(id), loadIndex()])
        const levels = await Promise.all(
          index.levels.map(async (level) => loadLevel(level.level)),
        )
        if (cancelled) return
        setDialogue(file)
        setLexemes(
          new Map(levels.flatMap((l) => l.lexemes).map((lexeme) => [lexeme.id, lexeme])),
        )
      } catch (cause: unknown) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const noeud = dialogue?.nodes.find((node) => node.id === current)
  // Le pinyin suit le réglage général ; « mots inconnus » revient à l'afficher
  // partout ici, puisqu'un dialogue ne connaît pas l'état des cartes.
  const showPinyin = pinyinDisplay !== 'jamais'
  const card = { background: 'var(--surface-raised)', borderColor: 'var(--border)' }

  function start(): void {
    if (dialogue === undefined) return
    setHistory([])
    setCurrent(dialogue.start)
    setPhase('echange')
    const first = dialogue.nodes.find((node) => node.id === dialogue.start)
    if (first !== undefined) say(tokensToText(first.tokens))
  }

  function choose(replique: Replique): void {
    if (noeud === undefined) return
    setHistory((previous) => [...previous, { noeud, choix: replique }])

    if (replique.next === null) {
      setPhase('bilan')
      setCurrent(undefined)
      return
    }
    setCurrent(replique.next)
    const next = dialogue?.nodes.find((node) => node.id === replique.next)
    if (next !== undefined) say(tokensToText(next.tokens))
  }

  if (error !== undefined) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <p className="text-sm" style={{ color: 'var(--tone-1)' }}>
          {error}
        </p>
      </div>
    )
  }

  if (dialogue === undefined) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Chargement…
        </p>
      </div>
    )
  }

  const justes = history.filter((tour) => tour.choix.qualite === 'juste').length

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link to="/dialogues" className="text-sm" style={{ color: 'var(--accent)' }}>
        ← Dialogues
      </Link>
      <h1 lang="zh-Hans" className="hanzi mt-3 text-2xl font-semibold">{dialogue.titleZh}</h1>
      <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
        {dialogue.titleFr} · HSK {dialogue.level}
      </p>

      {phase === 'intro' && (
        <section className="mt-6 rounded-2xl border p-5" style={card}>
          <p className="text-sm">{dialogue.situation}</p>
          <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            En face de toi : {dialogue.role}. À chaque tour, trois réponses possibles.
            Aucune correction ne s’affichera pendant l’échange : elles arrivent toutes à
            la fin.
          </p>
          <button
            type="button"
            onClick={start}
            className="mt-5 min-h-12 w-full rounded-xl text-sm font-medium"
            style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
          >
            Commencer
          </button>
        </section>
      )}

      {phase === 'echange' && noeud !== undefined && (
        <>
          <p className="mt-6 text-xs" style={{ color: 'var(--text-muted)' }}>
            Tour {history.length + 1} sur {dialogue.nodes.length}
          </p>

          <section className="mt-2 rounded-2xl border p-5" style={card}>
            <p className="mb-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              {dialogue.role}
            </p>
            <div className="flex items-start gap-3">
              <LigneChinoise
                tokens={noeud.tokens}
                lexemes={lexemes}
                showPinyin={showPinyin}
                className="flex-1 text-xl leading-loose"
              />
              <BoutonEcouter
                onClick={() => {
                  say(tokensToText(noeud.tokens))
                }}
                disabled={muet}
                label="Réécouter"
              />
            </div>
            {showFr && (
              <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                {noeud.fr}
              </p>
            )}
          </section>

          <button
            type="button"
            onClick={() => {
              setShowFr(!showFr)
            }}
            className="mt-2 text-xs"
            style={{ color: 'var(--accent)' }}
          >
            {showFr ? 'Masquer les traductions' : 'Afficher les traductions'}
          </button>

          <ul className="mt-4 space-y-2">
            {noeud.repliques.map((replique, index) => (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => {
                    choose(replique)
                  }}
                  className="w-full rounded-xl border px-4 py-3 text-left"
                  style={{ ...card, borderColor: 'var(--border)' }}
                >
                  <LigneChinoise
                    tokens={replique.tokens}
                    lexemes={lexemes}
                    showPinyin={showPinyin}
                    className="text-lg leading-loose"
                  />
                  {showFr && (
                    <span
                      className="mt-1 block text-xs"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {replique.fr}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {phase === 'bilan' && (
        <>
          <section className="mt-6 rounded-2xl border p-5" style={card}>
            <h2 className="text-sm font-semibold">Bilan</h2>
            <p className="mt-2 text-sm">
              {justes} réponse{justes > 1 ? 's' : ''} juste{justes > 1 ? 's' : ''} sur{' '}
              {history.length}.
            </p>
            <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Les remarques ci-dessous n’ont pas été affichées pendant l’échange, pour
              ne pas te couper. Une réponse « maladroite » se comprend : elle est
              simplement moins naturelle.
            </p>
          </section>

          <ol className="mt-4 space-y-3">
            {history.map((tour, index) => (
              <li
                key={index}
                className="rounded-2xl border p-4"
                style={{
                  ...card,
                  borderColor:
                    tour.choix.qualite === 'juste' ? 'var(--border)' : COULEURS[tour.choix.qualite],
                }}
              >
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {dialogue.role} : {tour.noeud.fr}
                </p>
                <div className="mt-2 flex items-baseline justify-between gap-3">
                  <LigneChinoise
                    tokens={tour.choix.tokens}
                    lexemes={lexemes}
                    showPinyin={false}
                    className="text-lg"
                  />
                  <span
                    className="shrink-0 text-xs font-medium"
                    style={{ color: COULEURS[tour.choix.qualite] }}
                  >
                    {QUALITE_LABELS[tour.choix.qualite]}
                  </span>
                </div>
                <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {tour.choix.fr}
                </p>
                {tour.choix.note !== null && (
                  <p className="mt-2 text-sm leading-relaxed">{tour.choix.note}</p>
                )}
              </li>
            ))}
          </ol>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={start}
              className="min-h-12 rounded-xl px-4 text-sm font-medium"
              style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
            >
              Recommencer
            </button>
            <Link
              to="/dialogues"
              className="flex min-h-12 items-center rounded-xl border px-4 text-sm"
              style={{ borderColor: 'var(--border)' }}
            >
              Autre dialogue
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
