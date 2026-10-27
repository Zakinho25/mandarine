import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadIndex, loadUnites, type ContentIndex, type UnitesFile } from '@/data/content'
import { loadGrammaireIndex } from '@/data/grammaire'
import {
  computeGrammaireProgression,
  type GrammaireProgression,
} from '@/data/points'
import { computeProgress, type Progress } from '@/data/progress'
import { ESTIMATE_MESSAGES } from '@/domain/progress'
import { useSettings } from '@/store/useSettings'
import { LEVEL_GOALS, levelTitle } from '@/ui/levels'

function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })
}

function Stat({ value, label }: { value: string; label: string }) {
  // `flex-col-reverse` place le chiffre au-dessus du libellé tout en gardant
  // l'ordre `dt` puis `dd` attendu par un lecteur d'écran.
  return (
    <div className="flex flex-col-reverse">
      <dt className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
        {label}
      </dt>
      <dd className="text-2xl font-semibold">{value}</dd>
    </div>
  )
}

export function ParcoursScreen() {
  const dailyGoalMin = useSettings((state) => state.settings.dailyGoalMin)

  const [index, setIndex] = useState<ContentIndex | undefined>(undefined)
  const [unites, setUnites] = useState<UnitesFile | undefined>(undefined)
  const [progress, setProgress] = useState<Progress | undefined>(undefined)
  const [grammaire, setGrammaire] = useState<GrammaireProgression | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const [file, unitFile, grammaireIndex] = await Promise.all([
          loadIndex(),
          loadUnites(),
          loadGrammaireIndex(),
        ])
        const target = file.levels.at(-1)?.cumulative ?? 1000
        const stats = await computeProgress(target, dailyGoalMin * 60_000)
        const points = await computeGrammaireProgression(grammaireIndex.count)
        if (cancelled) return
        setIndex(file)
        setUnites(unitFile)
        setProgress(stats)
        setGrammaire(points)
      } catch (cause: unknown) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [dailyGoalMin])

  const card = { background: 'var(--surface-raised)', borderColor: 'var(--border)' }
  const total = index?.levels.at(-1)?.cumulative ?? 1000
  const mastered = progress?.mastered ?? 0
  const estimate = progress?.estimate

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Mandarine</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          Du premier ton au HSK 3, en français.
        </p>
      </header>

      <section className="mb-6 rounded-2xl border p-5" style={card}>
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-wide uppercase">
            Ta progression
          </h2>
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {mastered} / {total}
          </span>
        </div>

        <div
          className="mb-5 h-2 overflow-hidden rounded-full"
          style={{ background: 'var(--surface-sunken)' }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${String(Math.min(100, (100 * mastered) / Math.max(total, 1)))}%`,
              background: 'var(--accent)',
            }}
          />
        </div>

        <dl className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
          <Stat
            value={String(progress?.streak ?? 0)}
            label={progress?.streak === 1 ? 'jour de suite' : 'jours de suite'}
          />
          <Stat
            value={`${String(progress?.minutesToday ?? 0)} / ${String(dailyGoalMin)}`}
            label="minutes aujourd’hui"
          />
          <Stat
            value={String(progress?.listeningMinutes ?? 0)}
            label="minutes d’écoute"
          />
          <Stat
            value={`${String(grammaire?.couverts ?? 0)} / ${String(grammaire?.total ?? 0)}`}
            label="points de grammaire"
          />
        </dl>

        {progress !== undefined && progress.goalMetToday && (
          <p className="mt-4 text-sm" style={{ color: 'var(--tone-3)' }}>
            Objectif du jour atteint.
          </p>
        )}

        {estimate !== undefined && (
          <p className="mt-4 text-sm">
            {estimate.reason === 'ok' && estimate.date !== null ? (
              <>
                À ce rythme, {String(estimate.perWeek)} mots maîtrisés par semaine : le
                HSK 3 serait atteint vers{' '}
                <strong>{formatDate(estimate.date)}</strong>.
              </>
            ) : (
              <span style={{ color: 'var(--text-muted)' }}>
                {ESTIMATE_MESSAGES[estimate.reason]}
              </span>
            )}
          </p>
        )}

        <p className="mt-3 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Un mot compte comme <strong>maîtrisé</strong> quand tu sais à la fois le
          reconnaître et le produire, que sa stabilité dépasse 30 jours et que la
          probabilité de t’en souvenir dépasse 90 %. Le compteur peut donc redescendre :
          c’est le but.
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

      {error !== undefined && (
        <p className="mb-6 text-sm" style={{ color: 'var(--tone-1)' }}>
          {error}
        </p>
      )}

      {grammaire !== undefined && grammaire.aRevoir.length > 0 && (
        <Link
          to="/grammaire"
          className="mb-6 block rounded-2xl border p-4 text-sm"
          style={{ ...card, borderColor: 'var(--tone-4)' }}
        >
          <span className="font-medium">
            {grammaire.aRevoir.length} point
            {grammaire.aRevoir.length > 1 ? 's' : ''} de grammaire à revoir
          </span>
          <span className="mt-1 block text-xs" style={{ color: 'var(--text-muted)' }}>
            Repérés par un examen blanc. Réussir la remise en ordre efface la marque.
          </span>
        </Link>
      )}

      <section className="mb-8 grid grid-cols-2 gap-2">
        <Link to="/prononciation" className="rounded-2xl border p-4" style={card}>
          <span className="block text-sm font-medium">Prononciation</span>
          <span className="mt-1 block text-xs" style={{ color: 'var(--text-muted)' }}>
            Tons, sandhi, micro
          </span>
        </Link>
        <Link to="/examens" className="rounded-2xl border p-4" style={card}>
          <span className="block text-sm font-medium">Examens blancs</span>
          <span className="mt-1 block text-xs" style={{ color: 'var(--text-muted)' }}>
            Écoute et lecture, chronométrés
          </span>
        </Link>
      </section>

      <section className="mb-8">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-wide uppercase">Les niveaux</h2>
        </div>

        <ul className="space-y-3">
          {(index?.levels ?? []).map((level) => (
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
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold tracking-wide uppercase">
          Par thème
        </h2>
        <p className="mb-3 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Les mêmes mots, rangés par sujet plutôt que par niveau. Utile pour préparer
          une situation précise.
        </p>

        <ul className="grid grid-cols-2 gap-2">
          {(unites?.units ?? []).map((unite) => (
            <li key={unite.id}>
              <Link
                to={`/unite/${unite.id}`}
                className="flex h-full flex-col rounded-xl border p-3"
                style={card}
              >
                <span className="text-sm font-medium">{unite.title}</span>
                <span className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {unite.count} mots
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
