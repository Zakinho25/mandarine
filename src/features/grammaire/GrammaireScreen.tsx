import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadGrammaireIndex, type GrammaireIndex } from '@/data/grammaire'
import { allGrammarStats, estCouvert } from '@/data/points'
import type { GrammarStatRecord } from '@/data/types'
import { levelTitle } from '@/ui/levels'

export function GrammaireScreen() {
  const [index, setIndex] = useState<GrammaireIndex | undefined>(undefined)
  const [stats, setStats] = useState<Map<string, GrammarStatRecord>>(new Map())
  const [error, setError] = useState<string | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const [fichier, enregistrements] = await Promise.all([
          loadGrammaireIndex(),
          allGrammarStats(),
        ])
        if (cancelled) return
        setIndex(fichier)
        setStats(new Map(enregistrements.map((stat) => [stat.pointId, stat])))
      } catch (cause: unknown) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const card = { background: 'var(--surface-raised)', borderColor: 'var(--border)' }
  const total = index?.count ?? 0
  const couverts = [...stats.values()].filter((stat) => estCouvert(stat)).length

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Grammaire</h1>
      <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
        Une fiche par point du programme, avec le piège qu’il tend aux
        francophones.
      </p>

      {total > 0 && (
        <section className="mt-5 rounded-2xl border p-4" style={card}>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm font-semibold">Points couverts</span>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {couverts} / {total}
            </span>
          </div>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full"
            style={{ background: 'var(--surface-sunken)' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${String((100 * couverts) / total)}%`,
                background: 'var(--accent)',
              }}
            />
          </div>
          <p className="mt-3 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Un point compte comme couvert quand tu as réussi au moins une fois sa
            remise en ordre. Lire la fiche ne suffit pas : ça gonflerait le compteur
            sans rien mesurer.
          </p>
        </section>
      )}

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
          const points = index.points.filter((point) => point.level === level)
          if (points.length === 0) return null
          return (
            <section key={level} className="mt-8">
              <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
                HSK {level} — {levelTitle(level)}
              </h2>
              <ul className="space-y-2">
                {points.map((point) => {
                  const stat = stats.get(point.id)
                  const couvert = estCouvert(stat)
                  const aRevoir = stat?.aRevoirDepuis != null
                  return (
                    <li key={point.id}>
                      <Link
                        to={`/grammaire/${point.id}`}
                        className="block rounded-2xl border p-4"
                        style={{
                          ...card,
                          borderColor: aRevoir ? 'var(--tone-4)' : 'var(--border)',
                        }}
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="font-medium">{point.titre}</span>
                          <span className="flex shrink-0 items-center gap-2 text-xs">
                            {aRevoir && (
                              <span style={{ color: 'var(--tone-4)' }}>à revoir</span>
                            )}
                            {couvert && (
                              <>
                                {/*
                                  Le signe seul n'est pas un libellé : un
                                  `aria-label` sur un span sans rôle est ignoré
                                  par la plupart des lecteurs d'écran. On donne
                                  donc le texte, et on cache le signe.
                                */}
                                <span className="sr-only">point couvert</span>
                                <span aria-hidden="true" style={{ color: 'var(--tone-3)' }}>
                                  ✓
                                </span>
                              </>
                            )}
                          </span>
                        </div>
                        <p
                          className="mt-1 text-sm"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {point.resume}
                        </p>
                        {point.markers.length > 0 && (
                          <p lang="zh-Hans" className="hanzi mt-2 text-sm">
                            {point.markers.join(' · ')}
                          </p>
                        )}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}

      <p className="mt-8 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        Les fiches sont rédigées à la main. Le vocabulaire des exemples et de chaque
        exercice est vérifié par script contre le programme du niveau. Le chinois cité
        dans les explications ne l’est pas : il contient exprès des formes fautives,
        qu’un contrôle de niveau rejetterait à tort.
      </p>
    </div>
  )
}
