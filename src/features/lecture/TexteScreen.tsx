import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { allCards } from '@/data/cards'
import { loadIndex, loadLevel, type Lexeme } from '@/data/content'
import { loadPriorities, togglePriority } from '@/data/priorites'
import { loadTexte, splitSentences, type Texte, type TexteToken } from '@/data/textes'
import { isMastered } from '@/domain/srs/scheduler'
import { scheduler } from '@/data/cards'
import { ACTIVE_SKILLS, cardKey } from '@/domain/srs/cards'
import { applySandhi } from '@/domain/pinyin'
import { useSettings } from '@/store/useSettings'
import { BoutonEcouter } from '@/ui/BoutonEcouter'
import { Pinyin } from '@/ui/Pinyin'
import { useSpeech } from '@/ui/useSpeech'

type Statut = 'inconnu' | 'en-cours' | 'connu'

const STATUT_LABELS: Record<Statut, string> = {
  inconnu: 'pas encore vu',
  'en-cours': 'en cours',
  connu: 'maîtrisé',
}

interface Chargé {
  readonly texte: Texte
  readonly lexemes: Map<string, Lexeme>
  readonly statuts: Map<string, Statut>
  readonly priorites: Set<string>
}

export function TexteScreen() {
  const params = useParams<{ id: string }>()
  const id = params.id ?? ''
  const pinyinDisplay = useSettings((state) => state.settings.pinyinDisplay)
  const { status, say } = useSpeech()
  const muet = status?.voice == null

  const [data, setData] = useState<Chargé | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)
  const [selected, setSelected] = useState<string | undefined>(undefined)
  const [translated, setTranslated] = useState<Set<number>>(new Set())
  const [priorites, setPriorites] = useState<Set<string>>(new Set())

  const load = useCallback(async (): Promise<Chargé> => {
    const [texte, index, cards, prio] = await Promise.all([
      loadTexte(id),
      loadIndex(),
      allCards(),
      loadPriorities(),
    ])
    const files = await Promise.all(
      index.levels.map(async (level) => loadLevel(level.level)),
    )
    const lexemes = new Map(
      files.flatMap((file) => file.lexemes).map((lexeme) => [lexeme.id, lexeme]),
    )

    const byId = new Map(cards.map((card) => [card.id, card]))
    const now = new Date().toISOString()
    const statuts = new Map<string, Statut>()

    for (const targetId of new Set(cards.map((card) => card.targetId))) {
      const skills = ACTIVE_SKILLS.map((skill) =>
        byId.get(cardKey('lexeme', targetId, skill)),
      )
      if (skills.every((card) => card !== undefined && isMastered(card, now, scheduler))) {
        statuts.set(targetId, 'connu')
      } else if (skills.some((card) => card !== undefined && card.reps > 0)) {
        statuts.set(targetId, 'en-cours')
      }
    }

    return { texte, lexemes, statuts, priorites: prio }
  }, [id])

  useEffect(() => {
    let cancelled = false
    load()
      .then((loaded) => {
        if (cancelled) return
        setData(loaded)
        setPriorites(loaded.priorites)
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause))
      })
    return () => {
      cancelled = true
    }
  }, [load])

  const statutDe = useCallback(
    (lexemeId: string | null): Statut =>
      lexemeId === null ? 'connu' : (data?.statuts.get(lexemeId) ?? 'inconnu'),
    [data],
  )

  const stats = useMemo(() => {
    if (data === undefined) return { total: 0, vus: 0 }
    const mots = data.texte.paragraphs
      .flatMap((p) => p.tokens)
      .filter((token) => token.lexemeId !== null)
    const vus = mots.filter((token) => statutDe(token.lexemeId) !== 'inconnu').length
    return { total: mots.length, vus }
  }, [data, statutDe])

  const selectedLexeme = selected === undefined ? undefined : data?.lexemes.get(selected)

  function renderToken(token: TexteToken, key: string) {
    if (token.lexemeId === null) {
      return (
        <span key={key} className="hanzi">
          {token.text}
        </span>
      )
    }

    const statut = statutDe(token.lexemeId)
    const lexeme = data?.lexemes.get(token.lexemeId)
    const showPinyin =
      pinyinDisplay === 'toujours' ||
      (pinyinDisplay === 'inconnus' && statut === 'inconnu')

    return (
      <button
        key={key}
        type="button"
        onClick={() => {
          setSelected(token.lexemeId ?? undefined)
          say(token.text)
        }}
        className="hanzi inline rounded px-0.5 align-baseline"
        style={{
          background:
            statut === 'en-cours' ? 'var(--accent-soft)' : 'transparent',
          borderBottom:
            statut === 'inconnu' ? '2px dotted var(--text-muted)' : '2px solid transparent',
          color: 'inherit',
        }}
      >
        {showPinyin && lexeme !== undefined ? (
          <ruby>
            {token.text}
            <rt style={{ fontSize: '0.5em' }}>
              <Pinyin numbered={lexeme.pinyinNum} marked={lexeme.pinyinMark} />
            </rt>
          </ruby>
        ) : (
          token.text
        )}
      </button>
    )
  }

  const card = { background: 'var(--surface-raised)', borderColor: 'var(--border)' }

  if (error !== undefined) {
    return (
      <div className="mx-auto max-w-xl px-4 py-10">
        <p className="text-sm" style={{ color: 'var(--tone-1)' }}>
          {error}
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8 pb-40">
      <Link to="/lecture" className="text-sm" style={{ color: 'var(--accent)' }}>
        ← Lecture
      </Link>

      {data === undefined ? (
        <p className="mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          Chargement…
        </p>
      ) : (
        <>
          <h1 className="hanzi mt-3 text-2xl font-semibold">{data.texte.titleZh}</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
            {data.texte.titleFr} · HSK {data.texte.level}
          </p>

          <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
            {stats.total === 0
              ? ''
              : `${String(Math.round((100 * stats.vus) / stats.total))} % des mots déjà rencontrés (${String(stats.vus)} sur ${String(stats.total)})`}
          </p>

          <ul className="mt-6 space-y-6">
            {data.texte.paragraphs.map((paragraph, index) => (
              <li key={index}>
                <div className="flex items-start gap-3">
                  <p className="hanzi flex-1 text-xl leading-loose">
                    {paragraph.tokens.map((token, position) =>
                      renderToken(token, `${String(index)}-${String(position)}`),
                    )}
                  </p>
                  <BoutonEcouter
                    onClick={() => {
                      // Phrase par phrase : une voix qui enchaîne six phrases
                      // d'affilée est inutilisable pour travailler.
                      say(splitSentences(paragraph.tokens).join(' '))
                    }}
                    disabled={muet}
                    label={`Écouter le paragraphe ${String(index + 1)}`}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setTranslated((previous) => {
                      const next = new Set(previous)
                      if (next.has(index)) next.delete(index)
                      else next.add(index)
                      return next
                    })
                  }}
                  className="mt-1 text-xs"
                  style={{ color: 'var(--accent)' }}
                >
                  {translated.has(index) ? 'Masquer' : 'Traduction'}
                </button>

                {translated.has(index) && (
                  <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                    {paragraph.fr}
                  </p>
                )}
              </li>
            ))}
          </ul>

          <div
            className="mt-8 rounded-2xl border p-4 text-xs leading-relaxed"
            style={{ ...card, color: 'var(--text-muted)' }}
          >
            <p className="mb-2 font-medium" style={{ color: 'var(--text)' }}>
              Comment lire les couleurs
            </p>
            <p>
              Souligné en pointillé : mot jamais rencontré. Fond coloré : mot en cours
              d’apprentissage. Sans marque : mot maîtrisé. Touche un mot pour sa
              définition.
            </p>
          </div>
        </>
      )}

      {selectedLexeme !== undefined && (
        <aside
          className="fixed inset-x-0 border-t p-4"
          style={{
            bottom: 'calc(3.5rem + env(safe-area-inset-bottom))',
            background: 'var(--surface-raised)',
            borderColor: 'var(--border)',
          }}
        >
          <div className="mx-auto max-w-xl">
            <div className="flex items-start gap-3">
              <span className="hanzi text-3xl">{selectedLexeme.simplified}</span>
              <span className="min-w-0 flex-1">
                <Pinyin
                  numbered={selectedLexeme.pinyinNum}
                  marked={selectedLexeme.pinyinMark}
                  className="block"
                />
                <span className="block text-sm" style={{ color: 'var(--text-muted)' }}>
                  {selectedLexeme.glossFr.slice(0, 4).join(', ')}
                </span>
                <span className="mt-1 block text-xs" style={{ color: 'var(--text-muted)' }}>
                  HSK {selectedLexeme.hsk2025} · {STATUT_LABELS[statutDe(selectedLexeme.id)]}
                  {applySandhi(selectedLexeme.pinyinNum, selectedLexeme.simplified)
                    .changed && ' · sandhi tonal'}
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelected(undefined)
                }}
                aria-label="Fermer"
                className="shrink-0 text-xl"
                style={{ color: 'var(--text-muted)' }}
              >
                ×
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const lexemeId = selectedLexeme.id
                  void togglePriority(lexemeId).then((added) => {
                    setPriorites((previous) => {
                      const next = new Set(previous)
                      if (added) next.add(lexemeId)
                      else next.delete(lexemeId)
                      return next
                    })
                  })
                }}
                className="min-h-11 rounded-xl border px-3 text-sm"
                style={{
                  borderColor: priorites.has(selectedLexeme.id)
                    ? 'var(--accent)'
                    : 'var(--border)',
                  color: priorites.has(selectedLexeme.id) ? 'var(--accent)' : 'var(--text)',
                }}
              >
                {priorites.has(selectedLexeme.id)
                  ? 'En tête des révisions'
                  : 'Mettre en tête des révisions'}
              </button>

              {[...selectedLexeme.simplified].map((character, position) => (
                <Link
                  key={`${character}-${String(position)}`}
                  to={`/caractere/${encodeURIComponent(character)}`}
                  className="hanzi flex min-h-11 items-center rounded-xl border px-3 text-lg"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {character}
                </Link>
              ))}
            </div>
          </div>
        </aside>
      )}
    </div>
  )
}
