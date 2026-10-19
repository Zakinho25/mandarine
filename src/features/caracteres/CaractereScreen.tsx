import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { loadIndex, loadLevel, type Lexeme } from '@/data/content'
import { loadHanziIndex, resolveComponent, type HanziEntry } from '@/data/hanzi'
import { IDS_DESCRIPTIONS, parseIds } from '@/domain/hanzi/ids'
import { BoutonEcouter } from '@/ui/BoutonEcouter'
import { Pinyin } from '@/ui/Pinyin'
import { TraceCaractere } from '@/ui/TraceCaractere'
import { useSpeech } from '@/ui/useSpeech'

interface Loaded {
  readonly hanzi: Map<string, HanziEntry>
  readonly lexemes: readonly Lexeme[]
}

function Ligne({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt style={{ color: 'var(--text-muted)' }}>{label}</dt>
      <dd>{children}</dd>
    </>
  )
}

export function CaractereScreen() {
  const params = useParams<{ character: string }>()
  const character = decodeURIComponent(params.character ?? '')
  const { status, say } = useSpeech()
  const muet = status?.voice == null

  const [loaded, setLoaded] = useState<Loaded | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const index = await loadIndex()
        const files = await Promise.all(
          index.levels.map(async (level) => loadLevel(level.level)),
        )
        const hanzi = await loadHanziIndex()
        if (!cancelled) {
          setLoaded({ hanzi, lexemes: files.flatMap((file) => [...file.lexemes]) })
        }
      } catch (cause: unknown) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const wordMeaning = useMemo(() => {
    const single = new Map<string, string>()
    for (const lexeme of loaded?.lexemes ?? []) {
      if ([...lexeme.simplified].length === 1 && !single.has(lexeme.simplified)) {
        single.set(lexeme.simplified, lexeme.glossFr.slice(0, 2).join(', '))
      }
    }
    return (char: string): string | undefined => single.get(char)
  }, [loaded])

  const entry = loaded?.hanzi.get(character)
  const asWord = loaded?.lexemes.find((lexeme) => lexeme.simplified === character)

  /** Mots du programme qui contiennent ce caractère. */
  const inWords = useMemo(
    () =>
      (loaded?.lexemes ?? [])
        .filter(
          (lexeme) =>
            lexeme.simplified.includes(character) && lexeme.simplified !== character,
        )
        .slice(0, 24),
    [loaded, character],
  )

  const tree = entry?.decomposition == null ? undefined : parseIds(entry.decomposition)
  const components = (entry?.parts ?? []).map((part) =>
    resolveComponent(part, wordMeaning),
  )

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
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link to="/" className="text-sm" style={{ color: 'var(--accent)' }}>
        ← Parcours
      </Link>

      <header className="mt-4 flex items-center gap-4">
        <span className="hanzi text-6xl leading-none">{character}</span>
        <span className="min-w-0 flex-1">
          {asWord !== undefined && (
            <>
              <Pinyin
                numbered={asWord.pinyinNum}
                marked={asWord.pinyinMark}
                className="block text-lg"
              />
              <span className="block text-sm" style={{ color: 'var(--text-muted)' }}>
                {asWord.glossFr.join(' · ')}
              </span>
            </>
          )}
          {asWord === undefined && loaded !== undefined && (
            <span className="block text-sm" style={{ color: 'var(--text-muted)' }}>
              Ce caractère n’est pas un mot du programme à lui seul : il n’apparaît
              qu’à l’intérieur d’autres mots.
            </span>
          )}
        </span>
        <BoutonEcouter
          onClick={() => {
            say(character)
          }}
          disabled={muet}
          label={`Écouter ${character}`}
        />
      </header>

      {loaded === undefined && (
        <p className="mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
          Chargement…
        </p>
      )}

      {entry !== undefined && (
        <>
          <section className="mt-8 flex justify-center">
            <TraceCaractere character={character} />
          </section>

          <section className="mt-8 rounded-2xl border p-5" style={card}>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <Ligne label="Traits">{entry.strokeCount}</Ligne>
              {entry.radical !== null && (
                <Ligne label="Clé">
                  <span className="hanzi">{entry.radical}</span>
                  {resolveComponent(entry.radical, wordMeaning).meaning !== null && (
                    <span style={{ color: 'var(--text-muted)' }}>
                      {' '}
                      — {resolveComponent(entry.radical, wordMeaning).meaning}
                    </span>
                  )}
                </Ligne>
              )}
              {entry.origin !== null && <Ligne label="Formation">{entry.origin}</Ligne>}
              {tree?.kind === 'compound' && (
                <Ligne label="Disposition">{IDS_DESCRIPTIONS[tree.operator]}</Ligne>
              )}
            </dl>
          </section>

          {components.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
                Décomposition
              </h2>
              <ul className="divide-y overflow-hidden rounded-2xl border" style={card}>
                {components.map((component) => {
                  const role =
                    component.character === entry.semantic
                      ? 'donne le sens'
                      : component.character === entry.phonetic
                        ? 'donne le son'
                        : null
                  return (
                    <li
                      key={component.character}
                      className="flex items-start gap-3 px-4 py-3"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <Link
                        to={`/caractere/${encodeURIComponent(component.character)}`}
                        className="hanzi text-2xl"
                      >
                        {component.character}
                      </Link>
                      <span className="min-w-0 flex-1 text-sm">
                        <span className="block">
                          {component.meaning ?? (
                            <span style={{ color: 'var(--text-muted)' }}>
                              Sens non renseigné pour ce composant.
                            </span>
                          )}
                          {role !== null && (
                            <span
                              className="ml-2 rounded-full px-2 py-0.5 text-[11px]"
                              style={{
                                background: 'var(--accent-soft)',
                                color: 'var(--accent)',
                              }}
                            >
                              {role}
                            </span>
                          )}
                        </span>
                        {component.note !== null && (
                          <span
                            className="mt-0.5 block text-xs leading-relaxed"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {component.note}
                          </span>
                        )}
                      </span>
                    </li>
                  )
                })}
              </ul>

              {entry.origin === 'idéophonogramme' && entry.phonetic !== null && (
                <p
                  className="mt-3 text-xs leading-relaxed"
                  style={{ color: 'var(--text-muted)' }}
                >
                  La majorité des caractères chinois sont construits ainsi : une partie
                  indique le domaine du sens, l’autre donne une idée de la
                  prononciation. Repérer cette structure fait gagner un temps
                  considérable.
                </p>
              )}
            </section>
          )}

          {inWords.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
                Dans les mots du programme
              </h2>
              <ul className="divide-y overflow-hidden rounded-2xl border" style={card}>
                {inWords.map((word) => (
                  <li
                    key={word.id}
                    className="flex items-center gap-3 px-4 py-3"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <span className="hanzi text-xl">{word.simplified}</span>
                    <span className="min-w-0 flex-1">
                      <Pinyin
                        numbered={word.pinyinNum}
                        marked={word.pinyinMark}
                        className="block text-sm"
                      />
                      <span
                        className="block truncate text-xs"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {word.glossFr.slice(0, 2).join(', ')}
                      </span>
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      HSK {word.hsk2025}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {loaded !== undefined && entry === undefined && (
        <p className="mt-8 text-sm" style={{ color: 'var(--text-muted)' }}>
          Ce caractère n’appartient pas au vocabulaire des niveaux 1 à 3 : ses tracés
          et sa décomposition ne sont pas embarqués.
        </p>
      )}
    </div>
  )
}
