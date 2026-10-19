import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadIndex, type ContentIndex } from '@/data/content'
import { computeProgress, type Progress } from '@/data/progress'
import type { Tone } from '@/domain/pinyin'
import { Pinyin } from '@/ui/Pinyin'
import { LEVEL_GOALS, levelTitle } from '@/ui/levels'
import { TONE_DESCRIPTIONS, toneColorVar } from '@/ui/tones'

const TONES: readonly Tone[] = [1, 2, 3, 4, 5]

export function ParcoursScreen() {
  const [index, setIndex] = useState<ContentIndex | undefined>(undefined)
  const [progress, setProgress] = useState<Progress | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    Promise.all([loadIndex(), computeProgress()])
      .then(([file, stats]) => {
        if (cancelled) return
        setIndex(file)
        setProgress(stats)
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause))
      })
    return () => {
      cancelled = true
    }
  }, [])

  const card = { background: 'var(--surface-raised)', borderColor: 'var(--border)' }
  const total = index?.levels.at(-1)?.cumulative ?? 1000

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Mandarine</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          Du premier ton au HSK 3, en français.
        </p>
      </header>

      {/* Des zéros honnêtes plutôt qu'une démonstration flatteuse. */}
      <section className="mb-8 rounded-2xl border p-5" style={card}>
        <h2 className="mb-4 text-sm font-semibold tracking-wide uppercase">
          Ta progression
        </h2>
        <dl className="grid grid-cols-3 gap-4 text-center">
          {[
            {
              label: `maîtrisés sur ${String(total)}`,
              value: String(progress?.mastered ?? 0),
            },
            { label: 'mots rencontrés', value: String(progress?.seen ?? 0) },
            {
              label: 'minutes aujourd’hui',
              value: String(progress?.minutesToday ?? 0),
            },
          ].map((stat) => (
            // `flex-col-reverse` place le chiffre au-dessus du libellé tout en
            // gardant l'ordre `dt` puis `dd` attendu par un lecteur d'écran.
            <div key={stat.label} className="flex flex-col-reverse">
              <dt className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                {stat.label}
              </dt>
              <dd className="text-2xl font-semibold">{stat.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Un mot compte comme <strong>maîtrisé</strong> quand tu sais à la fois le
          reconnaître et le produire, que sa stabilité dépasse 30 jours et que la
          probabilité de t’en souvenir dépasse 90 %. Le compteur peut donc redescendre :
          c’est le but. L’estimation de la date d’atteinte du HSK 3 n’apparaîtra qu’après
          quatorze jours d’usage réel.
        </p>
        {progress !== undefined && progress.dueNow > 0 && (
          <Link
            to="/revisions"
            className="mt-4 flex min-h-12 items-center justify-center rounded-xl text-sm font-medium"
            style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
          >
            {progress.dueNow} carte{progress.dueNow > 1 ? 's' : ''} à revoir
          </Link>
        )}
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
          Le parcours
        </h2>

        {error !== undefined && (
          <p className="text-sm" style={{ color: 'var(--tone-1)' }}>
            {error}
          </p>
        )}
        {index === undefined && error === undefined && (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Chargement…
          </p>
        )}

        {index !== undefined && (
          <>
            <ul className="space-y-3">
              {index.levels.map((level) => (
                <li key={level.level}>
                  <Link
                    to={`/niveau/${String(level.level)}`}
                    className="block rounded-2xl border p-5"
                    style={card}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-semibold">
                        HSK {level.level} — {levelTitle(level.level)}
                      </span>
                      <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        {level.count} mots
                      </span>
                    </div>
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                      {LEVEL_GOALS[level.level] ?? ''}
                    </p>
                    <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {level.cumulative} mots cumulés
                    </p>
                  </Link>
                </li>
              ))}
            </ul>

            <p
              className="mt-4 text-xs leading-relaxed"
              style={{ color: 'var(--text-muted)' }}
            >
              Vocabulaire et niveaux issus du {index.source.document}, publié en{' '}
              {index.source.publishedOn} par le {index.source.publishedBy}.{' '}
              {index.source.note} Définitions françaises reprises de CFDICT
              (CC BY-SA 3.0).
            </p>
          </>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
          Les cinq tons
        </h2>
        <ul className="divide-y overflow-hidden rounded-2xl border" style={card}>
          {TONES.map((tone) => {
            const description = TONE_DESCRIPTIONS[tone]
            return (
              <li
                key={tone}
                className="px-5 py-4"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="flex items-baseline gap-3">
                  <span
                    className="hanzi text-2xl font-semibold"
                    style={{ color: toneColorVar(tone) }}
                  >
                    <Pinyin numbered={`ma${String(tone)}`} />
                  </span>
                  <span className="text-sm font-medium">{description.name}</span>
                  <span
                    className="ml-auto font-mono text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {description.contour}
                  </span>
                </div>
                <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                  {description.hint}
                </p>
              </li>
            )
          })}
        </ul>
        <p className="mt-3 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          La couleur n’est qu’un renfort : le diacritique reste toujours affiché, et une
          palette sans couleur est disponible dans les réglages.
        </p>
      </section>
    </div>
  )
}
