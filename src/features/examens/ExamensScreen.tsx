import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listerResultats } from '@/data/examens'
import type { ExamResultRecord } from '@/data/types'
import {
  dureeSection,
  LONGUEUR_LABELS,
  PARTIES,
  REFERENCE_OFFICIELLE,
  SECTION_TITRES,
  SECTIONS,
  SEUIL_REUSSITE_PCT,
  type Longueur,
} from '@/domain/examen/format'
import { levelTitle } from '@/ui/levels'

const NIVEAUX = [1, 2, 3] as const
const LONGUEURS: readonly Longueur[] = ['court', 'complet']

function minutes(secondes: number): number {
  return Math.round(secondes / 60)
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function ExamensScreen() {
  const navigate = useNavigate()
  const [level, setLevel] = useState<number>(3)
  const [longueur, setLongueur] = useState<Longueur>('court')
  const [historique, setHistorique] = useState<readonly ExamResultRecord[]>([])

  useEffect(() => {
    let cancelled = false
    void listerResultats()
      .then((resultats) => {
        if (!cancelled) setHistorique(resultats)
      })
      .catch(() => {
        // L'historique est un confort : son absence ne doit pas empêcher de
        // passer un examen.
      })
    return () => {
      cancelled = true
    }
  }, [])

  const card = { background: 'var(--surface-raised)', borderColor: 'var(--border)' }
  const total = PARTIES.reduce((somme, partie) => somme + partie.items[longueur], 0)
  const duree = SECTIONS.reduce(
    (somme, section) => somme + dureeSection(section, longueur),
    0,
  )

  function choisir<T>(
    valeur: T,
    courant: T,
    appliquer: (valeur: T) => void,
    libelle: string,
    key: string,
  ) {
    const actif = valeur === courant
    return (
      <button
        key={key}
        type="button"
        aria-pressed={actif}
        onClick={() => {
          appliquer(valeur)
        }}
        className="min-h-12 flex-1 rounded-xl border px-3 text-sm"
        style={{
          borderColor: actif ? 'var(--accent)' : 'var(--border)',
          background: actif ? 'var(--accent-soft)' : 'transparent',
          color: actif ? 'var(--accent)' : 'var(--text-muted)',
          fontWeight: actif ? 600 : 400,
        }}
      >
        {libelle}
      </button>
    )
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="text-2xl font-semibold">Examens blancs</h1>
      <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
        Deux épreuves, écoute et lecture, chronométrées séparément.
      </p>

      <section className="mt-5 rounded-2xl border p-5" style={card}>
        <h2 className="mb-2 text-xs font-semibold tracking-wide uppercase">Niveau</h2>
        <div className="flex gap-2">
          {NIVEAUX.map((candidat) =>
            choisir(
              candidat as number,
              level,
              setLevel,
              `HSK ${String(candidat)}`,
              `niveau-${String(candidat)}`,
            ),
          )}
        </div>
        <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          {levelTitle(level)} — rien au-dessus de ce niveau n’apparaîtra, ni comme
          réponse ni comme piège.
        </p>

        <h2 className="mt-5 mb-2 text-xs font-semibold tracking-wide uppercase">
          Longueur
        </h2>
        <div className="flex gap-2">
          {LONGUEURS.map((candidat) =>
            choisir(candidat, longueur, setLongueur, LONGUEUR_LABELS[candidat], candidat)
          )}
        </div>
        <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          {total} questions, environ {minutes(duree)} minutes.
        </p>

        <button
          type="button"
          onClick={() => {
            const seed = Math.floor(Math.random() * 2 ** 31)
            void navigate(
              `/examens/${String(level)}/${longueur}/${String(seed)}`,
            )
          }}
          className="mt-5 min-h-12 w-full rounded-xl text-sm font-medium"
          style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
        >
          Commencer
        </button>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
          Les épreuves
        </h2>
        <ul className="space-y-2">
          {SECTIONS.map((section) => (
            <li key={section} className="rounded-2xl border p-4" style={card}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-medium">{SECTION_TITRES[section]}</span>
                <span className="shrink-0 text-xs" style={{ color: 'var(--text-muted)' }}>
                  {minutes(dureeSection(section, longueur))} min
                </span>
              </div>
              <ol className="mt-2 space-y-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                {PARTIES.filter((partie) => partie.section === section).map(
                  (partie, index) => (
                    <li key={partie.id}>
                      {index + 1}. {partie.titre} — {partie.items[longueur]} questions
                    </li>
                  ),
                )}
              </ol>
            </li>
          ))}
        </ul>
      </section>

      {historique.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
            Tes résultats
          </h2>
          <ul className="space-y-2">
            {historique.slice(0, 10).map((resultat) => (
              <li
                key={resultat.id}
                className="flex items-baseline justify-between gap-3 rounded-xl border p-3 text-sm"
                style={card}
              >
                <span>
                  HSK {resultat.level} · {LONGUEUR_LABELS[resultat.longueur].toLowerCase()}
                  <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(resultat.termineA)}
                  </span>
                </span>
                <span
                  className="shrink-0 font-semibold"
                  style={{
                    color: resultat.reussi ? 'var(--tone-3)' : 'var(--text-muted)',
                  }}
                >
                  {resultat.pourcentage} %
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-2 text-sm font-semibold tracking-wide uppercase">
          Ce que ce score vaut
        </h2>
        <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Le résultat est un <strong>pourcentage de bonnes réponses</strong>, pas une
          note officielle. L’examen réel attribue {REFERENCE_OFFICIELLE.pointsParSection}{' '}
          points par section et demande {REFERENCE_OFFICIELLE.seuil} sur{' '}
          {REFERENCE_OFFICIELLE.total} pour être reçu, soit {SEUIL_REUSSITE_PCT} % : on
          en reprend le seuil, parce qu’il reste un repère utile, et rien d’autre.
        </p>
        <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Les questions sont fabriquées à partir du vocabulaire du syllabus, des
          exemples de grammaire, des dialogues et des textes de l’application. Aucun
          sujet officiel n’est reproduit : ils sont protégés. Deux écarts de forme sont
          assumés. La première partie d’écoute fait choisir un sens là où l’épreuve
          réelle fait choisir une image, et la première partie de lecture pose les
          phrases une par une là où l’épreuve réelle en fait apparier cinq.
        </p>
        <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          L’épreuve d’écriture n’est pas couverte : elle demande de tracer des
          caractères à la main. Sa première partie, la remise en ordre d’une phrase, se
          travaille dans les fiches de grammaire.
        </p>
      </section>
    </div>
  )
}
