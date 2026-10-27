import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { loadLexemeMap, type Lexeme } from '@/data/content'
import {
  loadGrammaireIndex,
  loadGrammaireNiveau,
  type PointGrammaire,
} from '@/data/grammaire'
import { recordOrdre } from '@/data/points'
import { tokensToText } from '@/data/dialogues'
import { melanger, verifier, type Morceau, type Resultat } from '@/domain/grammaire/ordre'
import { hashString, seededRandom } from '@/domain/random'
import { useSettings } from '@/store/useSettings'
import { BoutonEcouter } from '@/ui/BoutonEcouter'
import { LigneChinoise } from '@/ui/LigneChinoise'
import { useSpeech } from '@/ui/useSpeech'

interface Charge {
  readonly point: PointGrammaire
  readonly lexemes: Map<string, Lexeme>
}

export function PointScreen() {
  const params = useParams<{ id: string }>()
  const id = params.id ?? ''
  const pinyinDisplay = useSettings((state) => state.settings.pinyinDisplay)
  const { status, say } = useSpeech()
  const muet = status?.voice == null

  const [data, setData] = useState<Charge | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)
  const [pool, setPool] = useState<Morceau[]>([])
  const [ligne, setLigne] = useState<Morceau[]>([])
  const [resultat, setResultat] = useState<Resultat | undefined>(undefined)
  const [tour, setTour] = useState(0)

  const load = useCallback(async (): Promise<Charge> => {
    const index = await loadGrammaireIndex()
    const resume = index.points.find((candidat) => candidat.id === id)
    if (resume === undefined) throw new Error(`Fiche inconnue : ${id}.`)

    const [fichier, lexemes] = await Promise.all([
      loadGrammaireNiveau(resume.level),
      loadLexemeMap(),
    ])
    const point = fichier.points.find((candidat) => candidat.id === id)
    if (point === undefined) throw new Error(`Fiche absente du niveau : ${id}.`)
    return { point, lexemes }
  }, [id])

  useEffect(() => {
    let cancelled = false
    load()
      .then((charge) => {
        if (cancelled) return
        setData(charge)
        // La graine vient de l'identifiant et du numéro de tour : le mélange
        // est le même pendant qu'on réfléchit, et change quand on refait
        // l'exercice.
        const random = seededRandom(hashString(`${id}-0`))
        const morceaux = melanger(
          {
            morceaux: charge.point.ordre.morceaux.map((morceau) => morceau.text),
            acceptes: charge.point.ordre.acceptes,
          },
          random,
        )
        setPool(morceaux)
        setLigne([])
        setResultat(undefined)
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause))
      })
    return () => {
      cancelled = true
    }
  }, [id, load])

  function recommencer(): void {
    const point = data?.point
    if (point === undefined) return
    const prochain = tour + 1
    const random = seededRandom(hashString(`${id}-${String(prochain)}`))
    setTour(prochain)
    setPool(
      melanger(
        {
          morceaux: point.ordre.morceaux.map((morceau) => morceau.text),
          acceptes: point.ordre.acceptes,
        },
        random,
      ),
    )
    setLigne([])
    setResultat(undefined)
  }

  function placer(morceau: Morceau): void {
    setPool((courant) => courant.filter((entry) => entry.id !== morceau.id))
    setLigne((courant) => [...courant, morceau])
    setResultat(undefined)
  }

  function retirer(morceau: Morceau): void {
    setLigne((courant) => courant.filter((entry) => entry.id !== morceau.id))
    setPool((courant) => [...courant, morceau])
    setResultat(undefined)
  }

  function controler(): void {
    const point = data?.point
    if (point === undefined) return
    const verdict = verifier(ligne, {
      morceaux: point.ordre.morceaux.map((morceau) => morceau.text),
      acceptes: point.ordre.acceptes,
    })
    setResultat(verdict)
    void recordOrdre(point.id, verdict.juste)
  }

  const card = { background: 'var(--surface-raised)', borderColor: 'var(--border)' }
  const showPinyin = pinyinDisplay !== 'jamais'
  const point = data?.point

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link to="/grammaire" className="text-sm" style={{ color: 'var(--accent)' }}>
        ← Grammaire
      </Link>

      {error !== undefined && (
        <p className="mt-4 text-sm" style={{ color: 'var(--tone-1)' }}>
          {error}
        </p>
      )}
      {point === undefined && error === undefined && (
        <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)' }}>
          Chargement…
        </p>
      )}

      {point !== undefined && data !== undefined && (
        <>
          <h1 className="mt-3 text-2xl font-semibold">{point.titre}</h1>
          {point.markers.length > 0 && (
            <p lang="zh-Hans" className="hanzi mt-2 text-xl" style={{ color: 'var(--accent)' }}>
              {point.markers.join('   ')}
            </p>
          )}
          <p className="mt-3 text-sm font-medium">{point.resume}</p>

          <section className="mt-5 space-y-3 text-sm leading-relaxed">
            {point.explication.map((paragraphe, index) => (
              <p key={index}>{paragraphe}</p>
            ))}
          </section>

          <section
            className="mt-5 rounded-2xl border p-4"
            style={{ ...card, borderColor: 'var(--tone-4)' }}
          >
            <h2 className="text-xs font-semibold tracking-wide uppercase">
              Le piège pour un francophone
            </h2>
            <p className="mt-2 text-sm leading-relaxed">{point.piege}</p>
          </section>

          <section className="mt-6">
            <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
              Exemples
            </h2>
            <ul className="space-y-3">
              {point.exemples.map((exemple, index) => (
                <li
                  key={index}
                  className="flex items-start gap-3 rounded-2xl border p-4"
                  style={card}
                >
                  <span className="min-w-0 flex-1">
                    <LigneChinoise
                      tokens={exemple.tokens}
                      lexemes={data.lexemes}
                      showPinyin={showPinyin}
                      className="text-xl leading-loose"
                    />
                    <span
                      className="mt-2 block text-sm"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {exemple.fr}
                    </span>
                  </span>
                  <BoutonEcouter
                    onClick={() => {
                      say(tokensToText(exemple.tokens))
                    }}
                    disabled={muet}
                    label={`Écouter l’exemple ${String(index + 1)}`}
                  />
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="mb-1 text-sm font-semibold tracking-wide uppercase">
              Remets la phrase en ordre
            </h2>
            <p className="mb-3 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              C’est le format de l’épreuve d’écriture du HSK. Touche les morceaux dans
              le bon ordre ; touche un morceau placé pour le retirer.
            </p>

            <p className="mb-3 text-sm" style={{ color: 'var(--text-muted)' }}>
              {point.ordre.fr}
            </p>

            <div
              className="flex min-h-16 flex-wrap items-center gap-2 rounded-2xl border p-3"
              style={{
                ...card,
                borderStyle: ligne.length === 0 ? 'dashed' : 'solid',
                borderColor:
                  resultat === undefined
                    ? 'var(--border)'
                    : resultat.juste
                      ? 'var(--tone-3)'
                      : 'var(--tone-4)',
              }}
            >
              {ligne.length === 0 && (
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  La phrase se construit ici.
                </span>
              )}
              {ligne.map((morceau, index) => (
                <button
                  key={morceau.id}
                  type="button"
                  onClick={() => {
                    retirer(morceau)
                  }}
                  aria-label={`Retirer ${morceau.text}, en position ${String(index + 1)}`}
                  lang="zh-Hans" className="hanzi min-h-11 rounded-xl border px-3 text-lg"
                  style={{
                    borderColor: 'var(--accent)',
                    background: 'var(--accent-soft)',
                  }}
                >
                  {morceau.text}
                </button>
              ))}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {pool.map((morceau) => (
                <button
                  key={morceau.id}
                  type="button"
                  onClick={() => {
                    placer(morceau)
                  }}
                  aria-label={`Placer ${morceau.text}`}
                  lang="zh-Hans" className="hanzi min-h-11 rounded-xl border px-3 text-lg"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {morceau.text}
                </button>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={controler}
                disabled={pool.length > 0}
                className="min-h-12 flex-1 rounded-xl text-sm font-medium"
                style={{
                  background: pool.length > 0 ? 'var(--surface-sunken)' : 'var(--accent)',
                  color: pool.length > 0 ? 'var(--text-muted)' : 'var(--accent-contrast)',
                }}
              >
                Vérifier
              </button>
              <button
                type="button"
                onClick={recommencer}
                className="min-h-12 rounded-xl border px-4 text-sm"
                style={{ borderColor: 'var(--border)' }}
              >
                Mélanger
              </button>
            </div>

            {resultat !== undefined && (
              <div className="mt-4 rounded-2xl border p-4" style={card}>
                {resultat.juste ? (
                  <>
                    <p className="text-sm font-medium" style={{ color: 'var(--tone-3)' }}>
                      C’est l’ordre juste.
                    </p>
                    <div className="mt-3 flex items-start gap-3">
                      <LigneChinoise
                        tokens={point.ordre.tokens}
                        lexemes={data.lexemes}
                        showPinyin={showPinyin}
                        className="min-w-0 flex-1 text-xl leading-loose"
                      />
                      <BoutonEcouter
                        onClick={() => {
                          say(resultat.phrase)
                        }}
                        disabled={muet}
                        label="Écouter la phrase"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium" style={{ color: 'var(--tone-4)' }}>
                      Ce n’est pas encore ça.
                    </p>
                    <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                      {resultat.premierEcart === null
                        ? 'Reprends depuis le début de la phrase.'
                        : `Le premier morceau mal placé est en position ${String(resultat.premierEcart)}.`}
                    </p>
                  </>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
