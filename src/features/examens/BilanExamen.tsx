import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Lexeme } from '@/data/content'
import { loadGrammaireIndex, type PointResume } from '@/data/grammaire'
import {
  definitionDe,
  REFERENCE_OFFICIELLE,
  SECTION_TITRES,
  SEUIL_REUSSITE_PCT,
} from '@/domain/examen/format'
import { itemsDe, type Examen, type Item } from '@/domain/examen/generation'
import { appreciation, type Reponses, type Resultat } from '@/domain/examen/notation'
import { LigneChinoise } from '@/ui/LigneChinoise'

interface BilanProps {
  readonly examen: Examen
  readonly resultat: Resultat
  readonly reponses: Reponses
  readonly lexemes: ReadonlyMap<string, Lexeme>
}

function texteDuChoix(item: Item, choixId: string | null): string {
  if (choixId === null) return 'sans réponse'
  const choix = item.choix.find((candidat) => candidat.id === choixId)
  return choix?.fr ?? choix?.zh ?? 'réponse inconnue'
}

export function BilanExamen({ examen, resultat, reponses, lexemes }: BilanProps) {
  const [points, setPoints] = useState<Map<string, PointResume>>(new Map())

  useEffect(() => {
    let cancelled = false
    void loadGrammaireIndex()
      .then((index) => {
        if (!cancelled) {
          setPoints(new Map(index.points.map((point) => [point.id, point])))
        }
      })
      .catch(() => {
        // Sans l'index, les points faibles s'affichent par identifiant. Le
        // bilan reste lisible.
      })
    return () => {
      cancelled = true
    }
  }, [])

  const card = { background: 'var(--surface-raised)', borderColor: 'var(--border)' }
  const rates = itemsDe(examen).filter(
    (item) => (reponses[item.id] ?? null) !== item.bonne,
  )

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link to="/examens" className="text-sm" style={{ color: 'var(--accent)' }}>
        ← Examens
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">Bilan</h1>

      <section className="mt-5 rounded-2xl border p-5" style={card}>
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-4xl font-semibold">{resultat.pourcentage} %</span>
          <span
            className="text-sm font-medium"
            style={{ color: resultat.reussi ? 'var(--tone-3)' : 'var(--tone-1)' }}
          >
            {resultat.reussi ? 'Au-dessus du seuil' : 'En dessous du seuil'}
          </span>
        </div>
        <p className="mt-2 text-sm">{appreciation(resultat.pourcentage)}</p>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          {resultat.justes} bonnes réponses sur {resultat.posees}
          {resultat.sansReponse > 0 &&
            `, dont ${String(resultat.sansReponse)} question${resultat.sansReponse > 1 ? 's' : ''} laissée${resultat.sansReponse > 1 ? 's' : ''} sans réponse`}
          .
        </p>

        <dl className="mt-4 space-y-2 text-sm">
          {resultat.sections.map((score) => (
            <div key={score.section} className="flex items-baseline justify-between gap-3">
              <dt style={{ color: 'var(--text-muted)' }}>
                {SECTION_TITRES[score.section]}
              </dt>
              <dd className="font-medium">
                {score.justes} / {score.posees}
                {score.posees > 0 && ` · ${String(score.pourcentage)} %`}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
          Par partie
        </h2>
        <ul className="space-y-2">
          {resultat.parties.map((score) => (
            <li
              key={score.id}
              className="flex items-baseline justify-between gap-3 rounded-xl border p-3 text-sm"
              style={card}
            >
              <span>
                {definitionDe(score.id).titre}
                {score.manquants > 0 && (
                  <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>
                    {score.manquants} question{score.manquants > 1 ? 's' : ''} non
                    fabriquée{score.manquants > 1 ? 's' : ''}, faute de contenu
                  </span>
                )}
              </span>
              <span className="shrink-0 font-medium">
                {score.justes} / {score.posees}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {resultat.pointsFaibles.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-1 text-sm font-semibold tracking-wide uppercase">
            Points de grammaire à revoir
          </h2>
          <p className="mb-3 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Ces fiches sont marquées « à revoir » dans la liste. Réussir leur remise en
            ordre efface la marque.
          </p>
          <ul className="space-y-2">
            {resultat.pointsFaibles.map((faible) => {
              const point = points.get(faible.pointId)
              return (
                <li key={faible.pointId}>
                  <Link
                    to={`/grammaire/${faible.pointId}`}
                    className="flex items-baseline justify-between gap-3 rounded-xl border p-3 text-sm"
                    style={{ ...card, borderColor: 'var(--accent)' }}
                  >
                    <span>{point?.titre ?? faible.pointId}</span>
                    <span className="shrink-0 text-xs" style={{ color: 'var(--text-muted)' }}>
                      {faible.rates} / {faible.poses} raté
                      {faible.rates > 1 ? 's' : ''}
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {resultat.motsRates.length > 0 && (
        <section className="mt-6 rounded-2xl border p-4" style={card}>
          <h2 className="text-sm font-semibold">
            {resultat.motsRates.length} mot{resultat.motsRates.length > 1 ? 's' : ''} remis
            en file
          </h2>
          <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Les mots des questions ratées passent en tête de la file de révision : ils
            seront introduits à la prochaine session plutôt que dans plusieurs
            semaines. Un passage de lecture raté n’y verse rien, parce qu’il ne désigne
            aucun mot en particulier.
          </p>
        </section>
      )}

      {rates.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
            Revoir les questions ratées
          </h2>
          <ul className="space-y-3">
            {rates.map((item) => (
              <li key={item.id} className="rounded-2xl border p-4" style={card}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {definitionDe(item.partie).titre}
                </p>
                {item.audio !== null && (
                  <p lang="zh-Hans" className="hanzi mt-2 text-lg">{item.audio}</p>
                )}
                {item.enonce !== null && (
                  <LigneChinoise
                    tokens={item.enonce}
                    lexemes={lexemes}
                    showPinyin
                    className="mt-2 block text-lg leading-loose"
                  />
                )}
                <p className="mt-3 text-sm">
                  <span style={{ color: 'var(--tone-1)' }}>Ta réponse : </span>
                  {texteDuChoix(item, reponses[item.id] ?? null)}
                </p>
                <p className="mt-1 text-sm">
                  <span style={{ color: 'var(--tone-3)' }}>La bonne : </span>
                  {texteDuChoix(item, item.bonne)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-8 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        Ce pourcentage n’est pas une note officielle. L’examen réel demande{' '}
        {REFERENCE_OFFICIELLE.seuil} points sur {REFERENCE_OFFICIELLE.total}, soit{' '}
        {SEUIL_REUSSITE_PCT} % : seul ce seuil est emprunté. Un bon score ici dit que tu
        maîtrises ce que cette application t’a enseigné, pas que tu es prêt pour la
        salle d’examen.
      </p>

      <Link
        to="/examens"
        className="mt-6 flex min-h-12 items-center justify-center rounded-xl text-sm font-medium"
        style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
      >
        Retour aux examens
      </Link>
    </div>
  )
}
