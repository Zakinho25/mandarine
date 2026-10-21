import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  loadIndex,
  loadLevel,
  loadUnites,
  type Lexeme,
  type UniteEntry,
} from '@/data/content'
import { search } from '@/domain/search'
import { useSettings } from '@/store/useSettings'
import { useSpeech } from '@/ui/useSpeech'
import { MotRow } from './MotRow'

export function UniteScreen() {
  const params = useParams<{ id: string }>()
  const id = params.id ?? ''
  const pinyinDisplay = useSettings((state) => state.settings.pinyinDisplay)
  const { status, say } = useSpeech()

  const [lexemes, setLexemes] = useState<readonly Lexeme[] | undefined>(undefined)
  const [unite, setUnite] = useState<UniteEntry | undefined>(undefined)
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const [index, unites] = await Promise.all([loadIndex(), loadUnites()])
      const files = await Promise.all(
        index.levels.map(async (level) => loadLevel(level.level)),
      )
      if (cancelled) return
      setUnite(unites.units.find((entry) => entry.id === id))
      setLexemes(files.flatMap((file) => file.lexemes.filter((l) => l.unit === id)))
    })()
    return () => {
      cancelled = true
    }
  }, [id])

  const results = useMemo(
    () => (lexemes === undefined ? [] : search(lexemes, query)),
    [lexemes, query],
  )

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link to="/" className="text-sm" style={{ color: 'var(--accent)' }}>
        ← Parcours
      </Link>

      <h1 className="mt-3 text-2xl font-semibold">{unite?.title ?? 'Unité'}</h1>
      {unite !== undefined && (
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          {unite.goal}
        </p>
      )}

      <label className="mt-5 block">
        <span className="sr-only">Chercher dans cette unité</span>
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
          }}
          placeholder="Chercher…"
          className="w-full rounded-xl border px-4 py-3 text-base"
          style={{
            background: 'var(--surface-raised)',
            borderColor: 'var(--border)',
            color: 'var(--text)',
          }}
        />
      </label>

      {lexemes === undefined ? (
        <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
          Chargement…
        </p>
      ) : (
        <>
          <p className="mt-4 mb-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            {results.length} mot{results.length > 1 ? 's' : ''}, tous niveaux confondus,
            du plus courant au moins courant
          </p>
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
                  showLevel
                />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
