import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { recordListening } from '@/data/cards'
import { loadIndex, loadLevel, type Lexeme } from '@/data/content'
import { TONE_SETS } from '@/data/prononciation'
import { pairLabel, type Tone } from '@/domain/pinyin'
import { BoutonEcouter } from '@/ui/BoutonEcouter'
import { Pinyin } from '@/ui/Pinyin'
import { TONE_DESCRIPTIONS, toneColorVar } from '@/ui/tones'
import { useSettings } from '@/store/useSettings'
import { useSpeech } from '@/ui/useSpeech'
import {
  buildPairQuestions,
  buildToneQuestions,
  ROUND_LENGTH,
  type Mode,
  type Question,
} from './questions'

function optionLabel(question: Question, option: string): string {
  if (question.kind === 'ton') {
    return TONE_DESCRIPTIONS[Number(option) as Tone].name
  }
  const [a, b] = option.split('-').map(Number)
  return pairLabel((a ?? 1) as Tone, (b ?? 1) as Tone)
}

export function EcouteScreen() {
  const { status, say } = useSpeech()
  const dailyGoalMin = useSettings((state) => state.settings.dailyGoalMin)
  const muet = status?.voice == null

  const [lexemes, setLexemes] = useState<readonly Lexeme[]>([])
  const [mode, setMode] = useState<Mode>('ton')
  const [questions, setQuestions] = useState<readonly Question[]>([])
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<string | undefined>(undefined)
  const [score, setScore] = useState(0)
  const startedAt = useRef(0)

  useEffect(() => {
    let cancelled = false
    void loadIndex()
      .then(async (file) =>
        Promise.all(file.levels.map(async (level) => loadLevel(level.level))),
      )
      .then((files) => {
        if (!cancelled) setLexemes(files.flatMap((file) => [...file.lexemes]))
      })
    return () => {
      cancelled = true
    }
  }, [])

  const finish = useCallback((): void => {
    const elapsed = Date.now() - startedAt.current
    // Plafonné : une page laissée ouverte toute la nuit n'est pas de l'écoute.
    void recordListening(Math.min(elapsed, 15 * 60_000), dailyGoalMin * 60_000)
  }, [dailyGoalMin])

  function start(next: Mode): void {
    const random = Math.random
    const built =
      next === 'ton'
        ? buildToneQuestions(TONE_SETS, random)
        : buildPairQuestions(lexemes, random)
    setMode(next)
    setQuestions(built)
    setIndex(0)
    setPicked(undefined)
    setScore(0)
    startedAt.current = Date.now()
  }

  function answer(option: string): void {
    if (picked !== undefined) return
    setPicked(option)
    const question = questions[index]
    if (question !== undefined && option === question.answer) setScore(score + 1)
    if (question !== undefined) say(question.character)
  }

  function next(): void {
    if (index + 1 >= questions.length) {
      finish()
      setQuestions([])
      setIndex(0)
      return
    }
    setIndex(index + 1)
    setPicked(undefined)
  }

  const question = questions[index]
  const card = { background: 'var(--surface-raised)', borderColor: 'var(--border)' }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link to="/prononciation" className="text-sm" style={{ color: 'var(--accent)' }}>
        ← Prononciation
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">Exercices d’écoute</h1>

      {status !== undefined && status.problem !== null && (
        <p
          className="mt-4 rounded-xl border p-3 text-xs leading-relaxed"
          style={{ borderColor: 'var(--tone-2)', color: 'var(--text-muted)' }}
        >
          <strong style={{ color: 'var(--tone-2)' }}>Pas de son : </strong>
          {status.problem} Sans voix chinoise, ces exercices n’ont pas de sens.
        </p>
      )}

      {question === undefined ? (
        <section className="mt-6 rounded-2xl border p-5" style={card}>
          {score > 0 && (
            <p className="mb-4 text-sm">
              Série terminée : {score} bonne{score > 1 ? 's' : ''} réponse
              {score > 1 ? 's' : ''} sur {ROUND_LENGTH}.
            </p>
          )}
          <p className="mb-4 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Commence par un ton isolé. Les paires sont nettement plus dures : entendre
            un troisième ton seul s’apprend en quelques jours, le reconnaître entre un
            deuxième et un quatrième demande des mois.
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={muet}
              onClick={() => {
                start('ton')
              }}
              className="min-h-12 rounded-xl text-sm font-medium"
              style={{
                background: 'var(--accent)',
                color: 'var(--accent-contrast)',
                opacity: muet ? 0.5 : 1,
              }}
            >
              Un ton — {ROUND_LENGTH} syllabes
            </button>
            <button
              type="button"
              disabled={muet || lexemes.length === 0}
              onClick={() => {
                start('paire')
              }}
              className="min-h-12 rounded-xl border text-sm"
              style={{
                borderColor: 'var(--border)',
                opacity: muet || lexemes.length === 0 ? 0.5 : 1,
              }}
            >
              Deux tons — {ROUND_LENGTH} mots
            </button>
          </div>
        </section>
      ) : (
        <>
          <div className="mt-6 mb-6 flex items-center gap-3">
            <div
              className="h-1 flex-1 overflow-hidden rounded-full"
              style={{ background: 'var(--surface-sunken)' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${String((100 * index) / questions.length)}%`,
                  background: 'var(--accent)',
                }}
              />
            </div>
            <span className="text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
              {index + 1} / {questions.length}
            </span>
          </div>

          <div className="flex flex-col items-center">
            <BoutonEcouter
              onClick={() => {
                say(question.character)
              }}
              disabled={muet}
              label="Réécouter"
              size="grand"
            />
            <p className="mt-3 text-sm" style={{ color: 'var(--text-muted)' }}>
              {mode === 'ton' ? 'Quel ton entends-tu ?' : 'Quelle suite de tons ?'}
            </p>
          </div>

          <ul className="mt-6 space-y-2">
            {question.options.map((option) => {
              const correct = option === question.answer
              const revealed = picked !== undefined
              return (
                <li key={option}>
                  <button
                    type="button"
                    disabled={revealed}
                    onClick={() => {
                      answer(option)
                    }}
                    className="w-full rounded-xl border px-4 py-3 text-left text-sm"
                    style={{
                      borderColor: revealed
                        ? correct
                          ? 'var(--tone-3)'
                          : option === picked
                            ? 'var(--tone-1)'
                            : 'var(--border)'
                        : 'var(--border)',
                      background:
                        revealed && correct
                          ? 'color-mix(in srgb, var(--tone-3) 12%, transparent)'
                          : 'var(--surface-raised)',
                      color:
                        question.kind === 'ton' && !revealed
                          ? toneColorVar(Number(option) as Tone)
                          : 'var(--text)',
                    }}
                  >
                    {optionLabel(question, option)}
                  </button>
                </li>
              )
            })}
          </ul>

          {picked !== undefined && (
            <div className="mt-6 text-center">
              <p className="hanzi text-4xl">{question.character}</p>
              <Pinyin numbered={question.pinyinNum} className="mt-2 block text-lg" />
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                {question.gloss}
              </p>
              <button
                type="button"
                onClick={next}
                className="mt-6 min-h-12 w-full rounded-xl text-sm font-medium"
                style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
              >
                {index + 1 >= questions.length ? 'Terminer' : 'Suivant'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
