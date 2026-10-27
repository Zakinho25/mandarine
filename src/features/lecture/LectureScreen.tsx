import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { allCards } from '@/data/cards'
import { loadTextesIndex, type TextesIndex } from '@/data/textes'
import { levelTitle } from '@/ui/levels'

export function LectureScreen() {
  const [index, setIndex] = useState<TextesIndex | undefined>(undefined)
  const [seen, setSeen] = useState(0)
  const [error, setError] = useState<string | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const [file, cards] = await Promise.all([loadTextesIndex(), allCards()])
        if (cancelled) return
        setIndex(file)
        setSeen(new Set(cards.filter((c) => c.reps > 0).map((c) => c.targetId)).size)
      } catch (cause: unknown) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const card = { background: 'var(--surface-raised)', borderColor: 'var(--border)' }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Lecture</h1>
      <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
        Des textes courts qui n’emploient que le vocabulaire de leur niveau.
        {seen > 0 && ` Tu as déjà rencontré ${String(seen)} mots.`}
      </p>

      {error !== undefined && (
        <p className="mt-4 text-sm" style={{ color: 'var(--tone-1)' }}>
          {error}
        </p>
      )}
      {index === undefined && error === undefined && (
        <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
          Chargement…
        </p>
      )}

      {index !== undefined &&
        [1, 2, 3].map((level) => {
          const textes = index.textes.filter((texte) => texte.level === level)
          if (textes.length === 0) return null
          return (
            <section key={level} className="mt-8">
              <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
                HSK {level} — {levelTitle(level)}
              </h2>
              <ul className="space-y-2">
                {textes.map((texte) => (
                  <li key={texte.id}>
                    <Link
                      to={`/lecture/${texte.id}`}
                      className="block rounded-2xl border p-4"
                      style={card}
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <span lang="zh-Hans" className="hanzi text-lg font-semibold">
                          {texte.titleZh}
                        </span>
                        <span
                          className="shrink-0 text-xs"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {texte.words} mots
                        </span>
                      </div>
                      <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                        {texte.titleFr}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}

      <p className="mt-8 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        Ces textes ont été rédigés pour l’application. Un script vérifie que chaque mot
        appartient bien au niveau annoncé, et le build échoue sinon. Cela ne garantit pas
        que la formulation soit naturelle : une relecture par un locuteur natif reste à
        faire.
      </p>
    </div>
  )
}
