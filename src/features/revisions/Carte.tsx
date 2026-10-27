import { useMemo, useState } from 'react'
import type { Lexeme } from '@/data/content'
import { hashString, seededRandom, shuffle } from '@/domain/random'
import { pickDistractors, type DistractorItem } from '@/domain/srs/distractors'
import {
  checkPinyin,
  isAcceptable,
  suggestedNote,
  VERDICT_MESSAGES,
  type Verdict,
} from '@/domain/srs/grading'
import { SKILL_PROMPTS, type CardSkill } from '@/domain/srs/cards'
import { NOTE_LABELS, NOTES, type Note } from '@/domain/srs/scheduler'
import { Pinyin } from '@/ui/Pinyin'

export interface CarteProps {
  readonly cardId: string
  readonly skill: CardSkill
  readonly lexeme: Lexeme
  readonly pool: readonly Lexeme[]
  readonly onAnswered: (result: {
    note: Note
    verdict?: Verdict
    answer?: string
  }) => void
}

const NOTE_HINTS: Record<Note, string> = {
  encore: 'Revu dans quelques minutes',
  difficile: 'Revu plus tôt que prévu',
  correct: 'Intervalle normal',
  facile: 'Revu beaucoup plus tard',
}

function BarreNotes({
  suggestion,
  onPick,
}: {
  suggestion?: Note
  onPick: (note: Note) => void
}) {
  return (
    <div className="mt-6">
      <p className="mb-2 text-xs" style={{ color: 'var(--text-muted)' }}>
        À quel point c’était difficile ?
      </p>
      <div className="grid grid-cols-4 gap-2">
        {NOTES.map((note) => {
          const highlighted = note === suggestion
          return (
            <button
              key={note}
              type="button"
              onClick={() => {
                onPick(note)
              }}
              title={NOTE_HINTS[note]}
              className="min-h-14 rounded-xl border px-2 text-sm"
              style={{
                borderColor: highlighted ? 'var(--accent)' : 'var(--border)',
                background: highlighted ? 'var(--accent-soft)' : 'transparent',
                color: highlighted ? 'var(--accent)' : 'var(--text)',
                fontWeight: highlighted ? 600 : 400,
              }}
            >
              {NOTE_LABELS[note]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Reponse({ lexeme }: { lexeme: Lexeme }) {
  return (
    <div className="mt-6 text-center">
      <p lang="zh-Hans" className="hanzi text-4xl">{lexeme.simplified}</p>
      <Pinyin
        numbered={lexeme.pinyinNum}
        marked={lexeme.pinyinMark}
        className="mt-2 block text-lg"
      />
      <p className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>
        {lexeme.glossFr.join(' · ')}
      </p>
    </div>
  )
}

/** Carte « reconnaître » : on voit le mot, on choisit le sens. */
function CarteReconnaissance({ cardId, lexeme, pool, onAnswered }: CarteProps) {
  const [picked, setPicked] = useState<string | undefined>(undefined)

  const choices = useMemo(() => {
    const random = seededRandom(hashString(cardId))
    const target: DistractorItem = {
      id: lexeme.id,
      simplified: lexeme.simplified,
      pinyinNum: lexeme.pinyinNum,
      glossFr: lexeme.glossFr,
    }
    const distractors = pickDistractors(target, pool, random, { count: 3 })
    return shuffle([target, ...distractors], random)
  }, [cardId, lexeme, pool])

  const correct = picked === lexeme.id

  return (
    <>
      <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        {SKILL_PROMPTS.zh_fr}
      </p>
      <p lang="zh-Hans" className="hanzi mt-4 text-center text-5xl">{lexeme.simplified}</p>

      <ul className="mt-8 space-y-2">
        {choices.map((choice) => {
          const isTarget = choice.id === lexeme.id
          const chosen = picked === choice.id
          const revealed = picked !== undefined
          return (
            <li key={choice.id}>
              <button
                type="button"
                disabled={revealed}
                onClick={() => {
                  setPicked(choice.id)
                }}
                className="w-full rounded-xl border px-4 py-3 text-left text-sm"
                style={{
                  borderColor:
                    revealed && isTarget
                      ? 'var(--tone-3)'
                      : chosen
                        ? 'var(--tone-1)'
                        : 'var(--border)',
                  background:
                    revealed && isTarget
                      ? 'color-mix(in srgb, var(--tone-3) 12%, transparent)'
                      : 'var(--surface-raised)',
                }}
              >
                {choice.glossFr.slice(0, 3).join(', ')}
              </button>
            </li>
          )
        })}
      </ul>

      {picked !== undefined && (
        <>
          <Reponse lexeme={lexeme} />
          <BarreNotes
            suggestion={correct ? 'correct' : 'encore'}
            onPick={(note) => {
              onAnswered({ note, answer: picked })
            }}
          />
        </>
      )}
    </>
  )
}

/** Carte « produire » : on voit le sens, on écrit le pinyin. */
function CarteProduction({ lexeme, onAnswered }: CarteProps) {
  const [answer, setAnswer] = useState('')
  const [verdict, setVerdict] = useState<Verdict | undefined>(undefined)

  function submit(): void {
    if (answer.trim().length === 0) return
    setVerdict(checkPinyin(lexeme.pinyinNum, answer))
  }

  return (
    <>
      <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
        {SKILL_PROMPTS.fr_zh}
      </p>
      <p className="mt-4 text-center text-2xl font-medium">
        {lexeme.glossFr.slice(0, 3).join(', ')}
      </p>

      <form
        className="mt-8"
        onSubmit={(event) => {
          event.preventDefault()
          if (verdict === undefined) submit()
        }}
      >
        <label>
          <span className="sr-only">Pinyin du mot</span>
          <input
            type="text"
            value={answer}
            disabled={verdict !== undefined}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            onChange={(event) => {
              setAnswer(event.target.value)
            }}
            placeholder="ni3 hao3, nihao, nǐ hǎo…"
            className="w-full rounded-xl border px-4 py-3 text-center text-lg"
            style={{
              background: 'var(--surface-raised)',
              borderColor:
                verdict === undefined
                  ? 'var(--border)'
                  : isAcceptable(verdict)
                    ? 'var(--tone-3)'
                    : 'var(--tone-1)',
              color: 'var(--text)',
            }}
          />
        </label>

        {verdict === undefined && (
          <button
            type="submit"
            className="mt-3 min-h-12 w-full rounded-xl text-sm font-medium"
            style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
          >
            Vérifier
          </button>
        )}
      </form>

      {verdict !== undefined && (
        <>
          <p
            className="mt-3 text-center text-sm"
            style={{
              color: isAcceptable(verdict) ? 'var(--tone-3)' : 'var(--tone-1)',
            }}
          >
            {VERDICT_MESSAGES[verdict]}
          </p>
          <Reponse lexeme={lexeme} />
          <BarreNotes
            suggestion={suggestedNote(verdict)}
            onPick={(note) => {
              onAnswered({ note, verdict, answer })
            }}
          />
        </>
      )}
    </>
  )
}

export function Carte(props: CarteProps) {
  // La clé force le remontage à chaque carte : sans elle, la réponse tapée et
  // le choix fait resteraient à l'écran d'une carte à la suivante.
  if (props.skill === 'fr_zh') return <CarteProduction key={props.cardId} {...props} />
  return <CarteReconnaissance key={props.cardId} {...props} />
}
