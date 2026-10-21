import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { loadLevel, type ContentFile } from '@/data/content'
import { search } from '@/domain/search'
import { useSettings } from '@/store/useSettings'
import { LEVEL_GOALS, levelTitle } from '@/ui/levels'
import { useSpeech } from '@/ui/useSpeech'
import { MotRow } from './MotRow'

export function NiveauScreen() {
  const params = useParams<{ level: string }>()
  const level = Number(params.level ?? '1')
  const pinyinDisplay = useSettings((state) => state.settings.pinyinDisplay)
  const { status, say } = useSpeech()

  // Le niveau chargé est stocké AVEC son contenu plutôt que remis à zéro au
  // changement de niveau : on évite ainsi un rendu supplémentaire, et surtout
  // d'afficher une fraction de seconde le vocabulaire du niveau précédent.
  const [loaded, setLoaded] = useState<
    { level: number; file?: ContentFile; error?: string } | undefined
  >(undefined)
  const [query, setQuery] = useState('')

  const current = loaded?.level === level ? loaded : undefined
  const content = current?.file
  const error = current?.error

  useEffect(() => {
    let cancelled = false
    loadLevel(level)
      .then((file) => {
        if (!cancelled) setLoaded({ level, file })
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setLoaded({
            level,
            error: cause instanceof Error ? cause.message : String(cause),
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [level])

  const results = useMemo(
    () => (content === undefined ? [] : search(content.lexemes, query)),
    [content, query],
  )

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link to="/" className="text-sm" style={{ color: 'var(--accent)' }}>
        ← Parcours
      </Link>

      <h1 className="mt-3 text-2xl font-semibold">
        HSK {level} — {levelTitle(level)}
      </h1>
      <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
        {LEVEL_GOALS[level] ?? ''}
      </p>

      <label className="mt-5 block">
        <span className="sr-only">Chercher un mot</span>
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
          }}
          placeholder="Chercher : 你好, nihao, bonjour…"
          className="w-full rounded-xl border px-4 py-3 text-base"
          style={{
            background: 'var(--surface-raised)',
            borderColor: 'var(--border)',
            color: 'var(--text)',
          }}
        />
      </label>

      {error !== undefined && (
        <p className="mt-4 text-sm" style={{ color: 'var(--tone-1)' }}>
          {error}
        </p>
      )}
      {content === undefined && error === undefined && (
        <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
          Chargement du vocabulaire…
        </p>
      )}

      {content !== undefined && (
        <>
          <p className="mt-4 mb-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            {query.trim().length > 0
              ? `${String(results.length)} mot${results.length > 1 ? 's' : ''} sur ${String(content.count)}`
              : `${String(content.count)} mots, du plus courant au moins courant`}
          </p>

          {results.length === 0 ? (
            <p className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              Aucun mot ne correspond.
            </p>
          ) : (
            <ul
              className="divide-y overflow-hidden rounded-2xl border"
              style={{
                background: 'var(--surface-raised)',
                borderColor: 'var(--border)',
              }}
            >
              {results.map((lexeme) => (
                <li key={lexeme.id} style={{ borderColor: 'var(--border)' }}>
                  <MotRow
                    lexeme={lexeme}
                    showPinyin={pinyinDisplay !== 'jamais'}
                    say={say}
                    muet={status?.voice == null}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}
