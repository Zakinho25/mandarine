import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadDialoguesIndex, type DialoguesIndex } from '@/data/dialogues'
import { levelTitle } from '@/ui/levels'

export function DialoguesScreen() {
  const [index, setIndex] = useState<DialoguesIndex | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    loadDialoguesIndex()
      .then((file) => {
        if (!cancelled) setIndex(file)
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause))
      })
    return () => {
      cancelled = true
    }
  }, [])

  const card = { background: 'var(--surface-raised)', borderColor: 'var(--border)' }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Dialogues guidés</h1>
      <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
        Des situations du quotidien, avec plusieurs façons de répondre.
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
          const dialogues = index.dialogues.filter((d) => d.level === level)
          if (dialogues.length === 0) return null
          return (
            <section key={level} className="mt-8">
              <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
                HSK {level} — {levelTitle(level)}
              </h2>
              <ul className="space-y-2">
                {dialogues.map((dialogue) => (
                  <li key={dialogue.id}>
                    <Link
                      to={`/dialogues/${dialogue.id}`}
                      className="block rounded-2xl border p-4"
                      style={card}
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="hanzi text-lg font-semibold">
                          {dialogue.titleZh}
                        </span>
                        <span
                          className="shrink-0 text-xs"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {dialogue.turns} tours
                        </span>
                      </div>
                      <p className="mt-1 text-sm">{dialogue.titleFr}</p>
                      <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                        {dialogue.situation}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )
        })}

      <p className="mt-8 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        Ces dialogues sont écrits à l’avance, ce n’est pas une intelligence
        artificielle. Pour du HSK 1 à 3, les échanges du quotidien sont assez
        formulaires pour qu’un scénario couvre l’essentiel, et celui-ci fonctionne hors
        ligne. Les corrections arrivent à la fin de l’échange, jamais pendant.
      </p>
    </div>
  )
}
