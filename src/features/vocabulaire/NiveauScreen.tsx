import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  CONTENT_STATUS_EXPLANATIONS,
  CONTENT_STATUS_LABELS,
  describeParts,
  loadLevel,
  type ContentFile,
  type Lexeme,
} from '@/data/content'
import { applySandhi, SANDHI_EXPLANATIONS } from '@/domain/pinyin'
import { search } from '@/domain/search'
import { useSettings } from '@/store/useSettings'
import { BoutonEcouter } from '@/ui/BoutonEcouter'
import { Pinyin } from '@/ui/Pinyin'
import { LEVEL_GOALS, levelTitle } from '@/ui/levels'
import { useSpeech } from '@/ui/useSpeech'

function MotRow({
  lexeme,
  showPinyin,
  say,
  muet,
}: {
  lexeme: Lexeme
  showPinyin: boolean
  say: (text: string) => void
  muet: boolean
}) {
  // Le ton écrit n'est pas toujours le ton dit : 你好 se prononce `ní hǎo`.
  // L'afficher sans le signaler reviendrait à enseigner une prononciation fausse.
  const sandhi = applySandhi(lexeme.pinyinNum, lexeme.simplified)
  const sandhiRule =
    sandhi.syllables.find((s) => s.spokenTone !== s.citationTone)?.rule ?? null

  return (
    <details className="group">
      <summary
        className="flex cursor-pointer list-none items-center gap-4 px-5 py-3"
        style={{ minHeight: '3.5rem' }}
      >
        <span className="hanzi text-2xl">{lexeme.simplified}</span>
        <span className="min-w-0 flex-1">
          {showPinyin && (
            <Pinyin
              numbered={lexeme.pinyinNum}
              marked={lexeme.pinyinMark}
              className="block text-sm"
            />
          )}
          <span className="block truncate text-sm" style={{ color: 'var(--text-muted)' }}>
            {lexeme.glossFr.slice(0, 3).join(', ')}
          </span>
        </span>
        <span
          role="presentation"
          onClick={(event) => {
            // Écouter sans déplier : le bouton vit dans le résumé, mais ne doit
            // pas ouvrir la fiche.
            event.preventDefault()
            event.stopPropagation()
            say(lexeme.simplified)
          }}
        >
          <BoutonEcouter
            onClick={() => {
              say(lexeme.simplified)
            }}
            disabled={muet}
            label={`Écouter ${lexeme.simplified}`}
          />
        </span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="shrink-0 transition-transform group-open:rotate-90"
          style={{ color: 'var(--text-muted)' }}
        >
          <path d="m9 6 6 6-6 6" />
        </svg>
      </summary>

      <div
        className="px-5 pt-1 pb-4 text-sm"
        style={{ background: 'var(--surface-sunken)' }}
      >
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt style={{ color: 'var(--text-muted)' }}>Pinyin</dt>
          <dd>
            <Pinyin numbered={lexeme.pinyinNum} marked={lexeme.pinyinMark} />{' '}
            <span style={{ color: 'var(--text-muted)' }}>
              (citation : {lexeme.pinyinNum})
            </span>
          </dd>

          {sandhi.changed && (
            <>
              <dt style={{ color: 'var(--text-muted)' }}>Se prononce</dt>
              <dd>
                <Pinyin numbered={sandhi.spokenNumbered} />
                {sandhiRule !== null && (
                  <span
                    className="mt-1 block text-xs leading-relaxed"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {SANDHI_EXPLANATIONS[sandhiRule]}
                  </span>
                )}
              </dd>
            </>
          )}

          {lexeme.traditional !== null && lexeme.traditional !== lexeme.simplified && (
            <>
              <dt style={{ color: 'var(--text-muted)' }}>Traditionnel</dt>
              <dd className="hanzi">{lexeme.traditional}</dd>
            </>
          )}

          <dt style={{ color: 'var(--text-muted)' }}>Caractères</dt>
          <dd className="flex flex-wrap gap-2">
            {[...lexeme.simplified].map((character, position) => (
              <Link
                // Un mot peut répéter un caractère (爸爸) : la position
                // distingue les deux entrées.
                key={`${character}-${String(position)}`}
                to={`/caractere/${encodeURIComponent(character)}`}
                className="hanzi rounded-lg border px-2 py-1 text-xl"
                style={{ borderColor: 'var(--border)' }}
              >
                {character}
              </Link>
            ))}
          </dd>

          {lexeme.pos.length > 0 && (
            <>
              <dt style={{ color: 'var(--text-muted)' }}>Nature</dt>
              <dd>{describeParts(lexeme.pos)}</dd>
            </>
          )}

          <dt style={{ color: 'var(--text-muted)' }}>Sens</dt>
          <dd>{lexeme.glossFr.join(' · ')}</dd>

          <dt style={{ color: 'var(--text-muted)' }}>Niveau</dt>
          <dd>
            HSK {lexeme.hsk2025} (syllabus 2025)
            {lexeme.hsk2021 !== null && lexeme.hsk2021 !== lexeme.hsk2025 && (
              <span style={{ color: 'var(--text-muted)' }}>
                {' '}
                — niveau {lexeme.hsk2021} dans le standard de 2021
              </span>
            )}
          </dd>
        </dl>

        <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          {CONTENT_STATUS_LABELS[lexeme.contentStatus]} —{' '}
          {CONTENT_STATUS_EXPLANATIONS[lexeme.contentStatus]}
          {lexeme.glossApprox &&
            ' Le rapprochement avec le dictionnaire a demandé une tolérance : définition à vérifier en priorité.'}
        </p>
      </div>
    </details>
  )
}

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
              : `${String(content.count)} mots`}
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
