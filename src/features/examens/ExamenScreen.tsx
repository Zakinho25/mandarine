import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { loadLexemeMap, type Lexeme } from '@/data/content'
import { construireVivier, enregistrerResultat } from '@/data/examens'
import { recordListening } from '@/data/cards'
import {
  definitionDe,
  dureeSection,
  SECTION_TITRES,
  SECTIONS,
  type Longueur,
  type Section,
} from '@/domain/examen/format'
import { genererExamen, type Examen, type Item } from '@/domain/examen/generation'
import { corriger, type Reponses, type Resultat } from '@/domain/examen/notation'
import { useSettings } from '@/store/useSettings'
import { BoutonEcouter } from '@/ui/BoutonEcouter'
import { LigneChinoise } from '@/ui/LigneChinoise'
import { useSpeech } from '@/ui/useSpeech'
import { BilanExamen } from './BilanExamen'

type Phase = 'intro' | 'epreuve' | 'bilan'

interface Charge {
  readonly examen: Examen
  readonly lexemes: Map<string, Lexeme>
}

function chrono(secondes: number): string {
  const minutes = Math.floor(secondes / 60)
  const reste = secondes % 60
  return `${String(minutes)}:${reste.toString().padStart(2, '0')}`
}

function estLongueur(valeur: string | undefined): valeur is Longueur {
  return valeur === 'court' || valeur === 'complet'
}

/**
 * Palier de temps à annoncer, ou `null` entre deux paliers.
 *
 * Les fenêtres font plus d'une seconde parce que le battement du chrono n'est
 * pas aligné sur les secondes : viser une valeur exacte raterait l'annonce une
 * fois sur quatre.
 */
function seuilAnnonce(restant: number): string | null {
  if (restant <= 30 && restant >= 28) return 'trente secondes'
  if (restant <= 60 && restant >= 58) return 'une minute'
  if (restant <= 300 && restant >= 298) return 'cinq minutes'
  return null
}

export function ExamenScreen() {
  const params = useParams<{ level: string; longueur: string; seed: string }>()
  const level = Number(params.level ?? '3')
  const longueur: Longueur = estLongueur(params.longueur) ? params.longueur : 'court'
  const seed = Number(params.seed ?? '1')

  const dailyGoalMin = useSettings((state) => state.settings.dailyGoalMin)
  const { status, say } = useSpeech()
  const muet = status?.voice == null

  const [data, setData] = useState<Charge | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)
  const [phase, setPhase] = useState<Phase>('intro')
  const [sectionIndex, setSectionIndex] = useState(0)
  const [position, setPosition] = useState(0)
  const [reponses, setReponses] = useState<Reponses>({})
  const [restant, setRestant] = useState(0)
  const [echeance, setEcheance] = useState<number | null>(null)
  const [resultat, setResultat] = useState<Resultat | undefined>(undefined)
  const commenceA = useRef<string | null>(null)
  const debutSection = useRef<number | null>(null)
  const ecouteMs = useRef(0)

  const section: Section = SECTIONS[sectionIndex] ?? 'ecoute'

  const load = useCallback(async (): Promise<Charge> => {
    const [vivier, lexemes] = await Promise.all([construireVivier(level), loadLexemeMap()])
    return {
      examen: genererExamen(vivier, {
        level,
        longueur,
        seed,
        creeA: new Date().toISOString(),
      }),
      lexemes,
    }
  }, [level, longueur, seed])

  useEffect(() => {
    let cancelled = false
    load()
      .then((charge) => {
        if (!cancelled) setData(charge)
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause))
      })
    return () => {
      cancelled = true
    }
  }, [load])

  const items: readonly Item[] =
    data === undefined
      ? []
      : data.examen.parties
          .filter((partie) => definitionDe(partie.id).section === section)
          .flatMap((partie) => partie.items)

  const terminer = useCallback(
    (donnees: Reponses): void => {
      const examen = data?.examen
      if (examen === undefined) return
      const corrige = corriger(examen, donnees, new Date().toISOString())
      setResultat(corrige)
      setPhase('bilan')
      void enregistrerResultat(corrige, commenceA.current ?? corrige.termineA)

      // Une épreuve d'écoute est du temps passé sur du vrai contenu, donc
      // elle compte dans la journée. Deux précautions pour que ce chiffre
      // reste vrai : on compte le temps réellement passé, pas le budget de
      // l'épreuve, et on ne compte rien si l'appareil n'a pas de voix
      // chinoise — il n'y avait alors rien à écouter.
      if (!muet && ecouteMs.current > 0) {
        void recordListening(ecouteMs.current, dailyGoalMin * 60_000)
      }
    },
    [dailyGoalMin, data?.examen, muet],
  )

  const sectionSuivante = useCallback((): void => {
    const debut = debutSection.current
    if (section === 'ecoute' && debut !== null) {
      ecouteMs.current = Math.min(
        Date.now() - debut,
        dureeSection('ecoute', longueur) * 1000,
      )
    }
    debutSection.current = null
    setPosition(0)
    setEcheance(null)
    if (sectionIndex + 1 < SECTIONS.length) {
      setSectionIndex(sectionIndex + 1)
      setPhase('intro')
      return
    }
    terminer(reponses)
  }, [longueur, reponses, section, sectionIndex, terminer])

  /**
   * Compte à rebours par section, comme à l'examen réel : épuiser le temps
   * d'écoute ne doit pas manger celui de lecture.
   *
   * Le temps restant est recalculé depuis une échéance absolue plutôt que
   * décrémenté à chaque tick. Un navigateur qui ralentit les minuteurs d'un
   * onglet en arrière-plan — tous le font — offrirait sinon du temps gratuit.
   */
  useEffect(() => {
    if (phase !== 'epreuve' || echeance === null) return
    const battre = (): void => {
      const reste = Math.max(0, Math.ceil((echeance - Date.now()) / 1000))
      setRestant(reste)
      if (reste === 0) sectionSuivante()
    }
    const minuteur = setInterval(battre, 250)
    return () => {
      clearInterval(minuteur)
    }
  }, [echeance, phase, sectionSuivante])

  function commencerSection(): void {
    const duree = dureeSection(section, longueur)
    // L'examen commence quand le premier chrono démarre, pas quand l'écran
    // s'ouvre : préparer le vivier peut prendre une seconde ou deux.
    commenceA.current ??= new Date().toISOString()
    debutSection.current = Date.now()
    setRestant(duree)
    setEcheance(Date.now() + duree * 1000)
    setPosition(0)
    setPhase('epreuve')
  }

  function repondre(itemId: string, choixId: string): void {
    setReponses((courant) => ({ ...courant, [itemId]: choixId }))
  }

  const card = { background: 'var(--surface-raised)', borderColor: 'var(--border)' }
  const item = items[position]

  if (error !== undefined) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <Link to="/examens" className="text-sm" style={{ color: 'var(--accent)' }}>
          ← Examens
        </Link>
        <p className="mt-4 text-sm" style={{ color: 'var(--tone-1)' }}>
          {error}
        </p>
      </div>
    )
  }

  if (data === undefined) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Préparation de l’examen…
        </p>
      </div>
    )
  }

  if (phase === 'bilan' && resultat !== undefined) {
    return (
      <BilanExamen
        examen={data.examen}
        resultat={resultat}
        reponses={reponses}
        lexemes={data.lexemes}
      />
    )
  }

  if (phase === 'intro') {
    const manquants = data.examen.parties
      .filter((partie) => definitionDe(partie.id).section === section)
      .reduce((somme, partie) => somme + partie.manquants, 0)

    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <Link to="/examens" className="text-sm" style={{ color: 'var(--accent)' }}>
          ← Examens
        </Link>
        <h1 className="mt-3 text-2xl font-semibold">{SECTION_TITRES[section]}</h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          {items.length} questions, {chrono(dureeSection(section, longueur))} au
          compteur. Le temps de cette épreuve ne se reporte pas sur la suivante.
        </p>

        {section === 'ecoute' && (
          <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
            {muet
              ? 'Aucune voix chinoise n’est installée sur cet appareil : l’épreuve d’écoute ne pourra pas être entendue.'
              : 'Tu peux réécouter autant de fois que tu veux. L’épreuve réelle ne joue l’enregistrement que deux fois.'}
          </p>
        )}

        {section === 'lecture' && (
          <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
            Le pinyin est masqué pendant l’épreuve, comme à l’examen.
          </p>
        )}

        {manquants > 0 && (
          <p className="mt-3 rounded-xl border p-3 text-sm" style={{ ...card }}>
            {manquants} question{manquants > 1 ? 's' : ''} n’{manquants > 1 ? 'ont' : 'a'}{' '}
            pas pu être fabriquée{manquants > 1 ? 's' : ''} : le contenu de ce niveau
            n’en fournit pas assez. L’épreuve est plus courte, et le score porte sur ce
            qui a été posé.
          </p>
        )}

        <button
          type="button"
          onClick={commencerSection}
          disabled={items.length === 0}
          className="mt-6 min-h-12 w-full rounded-xl text-sm font-medium"
          style={{
            background: items.length === 0 ? 'var(--surface-sunken)' : 'var(--accent)',
            color: items.length === 0 ? 'var(--text-muted)' : 'var(--accent-contrast)',
          }}
        >
          {items.length === 0 ? 'Rien à poser pour cette épreuve' : 'Démarrer le chrono'}
        </button>

        {items.length === 0 && (
          <button
            type="button"
            onClick={sectionSuivante}
            className="mt-2 min-h-12 w-full rounded-xl border text-sm"
            style={{ borderColor: 'var(--border)' }}
          >
            Passer à la suite
          </button>
        )}
      </div>
    )
  }

  if (item === undefined) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <p className="text-sm">Épreuve terminée.</p>
        <button
          type="button"
          onClick={sectionSuivante}
          className="mt-4 min-h-12 w-full rounded-xl text-sm font-medium"
          style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
        >
          Continuer
        </button>
      </div>
    )
  }

  const definition = definitionDe(item.partie)
  const repondu = reponses[item.id] ?? null
  const dernier = position + 1 >= items.length
  const presse = restant <= 30
  const palier = seuilAnnonce(restant)

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <header className="flex items-baseline justify-between gap-3">
        <span className="text-xs tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>
          {SECTION_TITRES[section]}
        </span>
        <span
          aria-hidden="true"
          className="font-mono text-sm"
          style={{ color: presse ? 'var(--tone-1)' : 'var(--text-muted)' }}
        >
          {chrono(restant)}
        </span>
        {/*
          Le chrono visible est masqué au lecteur d'écran : annoncer chaque
          seconde couvrirait la question. Ce qui est annoncé, c'est le
          franchissement des paliers — une minute, trente secondes — pour que
          l'information arrive sans occuper la parole en continu.
        */}
        <span className="sr-only" role="status">
          {palier === null ? '' : `Il reste ${palier}.`}
        </span>
      </header>

      <div
        className="mt-2 h-1 overflow-hidden rounded-full"
        style={{ background: 'var(--surface-sunken)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${String((100 * (position + 1)) / items.length)}%`,
            background: 'var(--accent)',
          }}
        />
      </div>

      <h1 className="mt-5 text-lg font-semibold">{definition.titre}</h1>
      <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
        {definition.consigne}
      </p>
      <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
        Question {position + 1} sur {items.length}
      </p>

      <section className="mt-5 rounded-2xl border p-5" style={card}>
        {item.audio !== null && (
          <div className="flex flex-col items-center gap-3">
            <BoutonEcouter
              onClick={() => {
                say(item.audio ?? '')
              }}
              disabled={muet}
              label="Écouter la question"
              size="grand"
            />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {muet ? 'Pas de voix chinoise disponible.' : 'Touche pour réécouter.'}
            </span>
          </div>
        )}

        {item.enonce !== null && (
          <LigneChinoise
            tokens={item.enonce}
            lexemes={data.lexemes}
            showPinyin={false}
            className="block text-xl leading-loose"
          />
        )}
      </section>

      <ul className="mt-4 space-y-2">
        {item.choix.map((choix) => {
          const actif = repondu === choix.id
          return (
            <li key={choix.id}>
              <button
                type="button"
                aria-pressed={actif}
                onClick={() => {
                  repondre(item.id, choix.id)
                }}
                className="w-full rounded-xl border p-4 text-left"
                style={{
                  borderColor: actif ? 'var(--accent)' : 'var(--border)',
                  background: actif ? 'var(--accent-soft)' : 'var(--surface-raised)',
                }}
              >
                {choix.zh !== null ? (
                  <span lang="zh-Hans" className="hanzi text-lg">{choix.zh}</span>
                ) : (
                  <span className="text-sm">{choix.fr}</span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      <div className="mt-5 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setPosition(Math.max(0, position - 1))
          }}
          disabled={position === 0}
          className="min-h-12 rounded-xl border px-4 text-sm"
          style={{
            borderColor: 'var(--border)',
            color: position === 0 ? 'var(--text-muted)' : 'inherit',
            opacity: position === 0 ? 0.5 : 1,
          }}
        >
          Précédente
        </button>
        <button
          type="button"
          onClick={() => {
            if (dernier) sectionSuivante()
            else setPosition(position + 1)
          }}
          className="min-h-12 flex-1 rounded-xl text-sm font-medium"
          style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
        >
          {dernier ? 'Terminer cette épreuve' : 'Suivante'}
        </button>
      </div>

      <p className="mt-4 text-xs" style={{ color: 'var(--text-muted)' }}>
        Tu peux revenir en arrière dans cette épreuve tant que le chrono tourne. Une
        question laissée sans réponse compte comme fausse.
      </p>
    </div>
  )
}
