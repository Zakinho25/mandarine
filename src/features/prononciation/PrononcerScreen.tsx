import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { recordListening } from '@/data/cards'
import { MicroError, startRecording, type Recorder } from '@/data/micro'
import { TONE_SETS } from '@/data/prononciation'
import { extractContour, normalize } from '@/domain/pitch/contour'
import {
  evaluate,
  POINTS,
  PROBLEME_MESSAGES,
  referenceCurve,
  TONE_SHAPES,
  VERDICT_LABELS,
  type Evaluation,
} from '@/domain/pitch/references'
import type { Tone } from '@/domain/pinyin'
import { useSettings } from '@/store/useSettings'
import { BoutonEcouter } from '@/ui/BoutonEcouter'
import { CourbeTons } from '@/ui/CourbeTons'
import { Pinyin } from '@/ui/Pinyin'
import { TONE_DESCRIPTIONS, toneColorVar } from '@/ui/tones'
import { useSpeech } from '@/ui/useSpeech'

const TONES: readonly Tone[] = [1, 2, 3, 4]

/** « 1er » et non « 1e » : l'exception du premier rang existe aussi ici. */
function ordinal(tone: Tone): string {
  return tone === 1 ? '1er' : `${String(tone)}e`
}

export function PrononcerScreen() {
  const { status, say } = useSpeech()
  const dailyGoalMin = useSettings((state) => state.settings.dailyGoalMin)
  const muet = status?.voice == null

  const [setIndex, setSetIndex] = useState(0)
  const [tone, setTone] = useState<Tone>(1)
  const [recording, setRecording] = useState(false)
  const [result, setResult] = useState<Evaluation | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)
  const recorder = useRef<Recorder | null>(null)

  const serie = TONE_SETS[setIndex] ?? TONE_SETS[0]
  const entry = serie?.entries.find((item) => item.tone === tone)
  const attendu = referenceCurve(tone, POINTS)
  const card = { background: 'var(--surface-raised)', borderColor: 'var(--border)' }

  async function start(): Promise<void> {
    setError(undefined)
    setResult(undefined)
    try {
      recorder.current = await startRecording()
      setRecording(true)
    } catch (cause: unknown) {
      setError(cause instanceof MicroError ? cause.message : 'Enregistrement impossible.')
    }
  }

  async function stop(): Promise<void> {
    const current = recorder.current
    recorder.current = null
    setRecording(false)
    if (current === null) return

    try {
      const { samples, sampleRate, durationMs } = await current.stop()
      const contour = normalize(extractContour(samples, sampleRate))
      setResult(evaluate(contour, tone))
      // Le temps passé à s'entraîner compte comme de l'écoute : c'est du
      // travail sur du vrai contenu, pas un score.
      void recordListening(Math.min(durationMs, 60_000), dailyGoalMin * 60_000)
    } catch (cause: unknown) {
      setError(cause instanceof MicroError ? cause.message : 'Analyse impossible.')
    }
  }

  function changer(nextTone: Tone, nextSet = setIndex): void {
    setTone(nextTone)
    setSetIndex(nextSet)
    setResult(undefined)
    setError(undefined)
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link to="/prononciation" className="text-sm" style={{ color: 'var(--accent)' }}>
        ← Prononciation
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">Travailler ses tons</h1>
      <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
        Enregistre-toi, et compare la courbe de ta voix à celle du ton visé.
      </p>

      {/* Choix de la syllabe */}
      <div className="mt-5 flex flex-wrap gap-2">
        {TONE_SETS.map((set, index) => (
          <button
            key={set.syllable}
            type="button"
            onClick={() => {
              changer(tone, index)
            }}
            className="min-h-10 rounded-lg border px-3 font-mono text-xs"
            style={{
              borderColor: index === setIndex ? 'var(--accent)' : 'var(--border)',
              color: index === setIndex ? 'var(--accent)' : 'var(--text-muted)',
              background: index === setIndex ? 'var(--accent-soft)' : 'transparent',
            }}
          >
            {set.syllable}
          </button>
        ))}
      </div>

      {/* Choix du ton */}
      <div className="mt-2 grid grid-cols-4 gap-2">
        {TONES.map((candidate) => (
          <button
            key={candidate}
            type="button"
            aria-label={`${ordinal(candidate)} ton`}
            aria-pressed={candidate === tone}
            onClick={() => {
              changer(candidate)
            }}
            className="min-h-12 rounded-xl border text-sm"
            style={{
              borderColor: candidate === tone ? 'var(--accent)' : 'var(--border)',
              background: candidate === tone ? 'var(--accent-soft)' : 'transparent',
              color: toneColorVar(candidate),
              fontWeight: candidate === tone ? 600 : 400,
            }}
          >
            {ordinal(candidate)}
          </button>
        ))}
      </div>

      {entry !== undefined && (
        <section className="mt-5 rounded-2xl border p-5" style={card}>
          <div className="flex items-center gap-4">
            <span className="hanzi text-4xl">{entry.character}</span>
            <span className="min-w-0 flex-1">
              <Pinyin numbered={entry.pinyinNum} className="block text-lg" />
              <span className="block text-sm" style={{ color: 'var(--text-muted)' }}>
                {entry.gloss} · {TONE_DESCRIPTIONS[tone].name}
              </span>
            </span>
            <BoutonEcouter
              onClick={() => {
                say(entry.character)
              }}
              disabled={muet}
              label={`Écouter ${entry.character}`}
            />
          </div>

          <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
            {TONE_SHAPES[tone][1]}
          </p>

          <div className="mt-4">
            <CourbeTons attendu={attendu} produit={result?.curve ?? null} />
            <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              Pointillés : le contour visé. Trait plein : le tien.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              void (recording ? stop() : start())
            }}
            className="mt-4 min-h-12 w-full rounded-xl text-sm font-medium"
            style={{
              background: recording ? 'var(--tone-1)' : 'var(--accent)',
              color: 'var(--accent-contrast)',
            }}
          >
            {recording ? 'Arrêter' : 'Enregistrer'}
          </button>

          {recording && (
            <p className="mt-2 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              Dis la syllabe et tiens-la une bonne seconde.
            </p>
          )}
        </section>
      )}

      {error !== undefined && (
        <p
          className="mt-4 rounded-xl border p-3 text-sm"
          style={{ borderColor: 'var(--tone-1)', color: 'var(--text-muted)' }}
        >
          {error}
        </p>
      )}

      {result !== undefined && (
        <section className="mt-4 rounded-2xl border p-5" style={card}>
          {!result.usable ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {result.probleme === null ? '' : PROBLEME_MESSAGES[result.probleme]}
            </p>
          ) : (
            <>
              <p className="text-sm">
                Ton contour ressemble le plus au{' '}
                <strong style={{ color: toneColorVar(result.bestTone ?? tone) }}>
                  {ordinal(result.bestTone ?? tone)} ton
                </strong>
                {result.bestTone === tone
                  ? ', c’est bien celui qui était visé.'
                  : `, alors que le ${ordinal(tone)} était visé.`}
              </p>

              <p className="mt-2 text-sm font-medium">
                {result.verdict === null ? '' : VERDICT_LABELS[result.verdict]}
                <span className="font-normal" style={{ color: 'var(--text-muted)' }}>
                  {' '}
                  ({result.score} sur 100)
                </span>
              </p>

              <p className="mt-3 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                La mesure porte sur la <strong>forme</strong> de la courbe, pas sur la
                hauteur absolue : une voix grave et une voix aiguë qui font le même
                geste obtiennent le même résultat. Elle ne juge ni les consonnes ni les
                voyelles.
              </p>
            </>
          )}
        </section>
      )}

      <p className="mt-6 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        Le contour visé est calculé à partir de la notation de Chao, pas mesuré sur un
        locuteur. Il donne la forme juste, pas les nuances d’une voix réelle : assez
        pour voir qu’un troisième ton ne redescend pas, pas assez pour juger un niveau
        avancé.
      </p>
    </div>
  )
}
