import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FINAL_GROUPS,
  INITIAL_GROUPS,
  TONE_SETS,
  type SoundGroup,
} from '@/data/prononciation'
import { applySandhi, SANDHI_EXPLANATIONS, type Tone } from '@/domain/pinyin'
import { BoutonEcouter } from '@/ui/BoutonEcouter'
import { Pinyin } from '@/ui/Pinyin'
import { TONE_DESCRIPTIONS, toneColorVar } from '@/ui/tones'
import { useSpeech } from '@/ui/useSpeech'

const SANDHI_EXAMPLES = [
  { characters: '你好', pinyinNum: 'ni3 hao3', gloss: 'bonjour' },
  { characters: '一下', pinyinNum: 'yi1 xia4', gloss: 'un instant' },
  { characters: '一起', pinyinNum: 'yi1 qi3', gloss: 'ensemble' },
  { characters: '不要', pinyinNum: 'bu4 yao4', gloss: 'ne pas vouloir' },
  { characters: '老师', pinyinNum: 'lao3 shi1', gloss: 'professeur' },
] as const

function GroupeDeSons({
  group,
  say,
  muet,
}: {
  group: SoundGroup
  say: (text: string) => void
  muet: boolean
}) {
  const card = { background: 'var(--surface-raised)', borderColor: 'var(--border)' }
  return (
    <section className="mb-5">
      <h3 className="font-mono text-sm font-semibold">{group.title}</h3>
      <p className="mt-1 mb-3 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        {group.intro}
      </p>
      <ul className="divide-y overflow-hidden rounded-2xl border" style={card}>
        {group.entries.map((entry) => (
          <li
            key={entry.sound}
            className="flex items-start gap-3 px-4 py-3"
            style={{ borderColor: 'var(--border)' }}
          >
            <span className="w-24 shrink-0 font-mono text-sm font-semibold">
              {entry.sound}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-baseline gap-2">
                <span lang="zh-Hans" className="hanzi text-xl">{entry.example}</span>
                <Pinyin numbered={entry.examplePinyin} className="text-sm" />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {entry.exampleGloss}
                </span>
              </span>
              {entry.note !== null && (
                <span
                  className="mt-1 block text-xs leading-relaxed"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {entry.note}
                </span>
              )}
            </span>
            <BoutonEcouter
              onClick={() => {
                say(entry.example)
              }}
              disabled={muet}
              label={`Écouter ${entry.example}`}
            />
          </li>
        ))}
      </ul>
    </section>
  )
}

export function PrononciationScreen() {
  const { status, say } = useSpeech()
  const [setIndex, setSetIndex] = useState(0)

  const muet = status?.voice == null
  const serie = TONE_SETS[setIndex] ?? TONE_SETS[0]
  const card = { background: 'var(--surface-raised)', borderColor: 'var(--border)' }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <Link to="/" className="text-sm" style={{ color: 'var(--accent)' }}>
        ← Parcours
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">Prononciation</h1>
      <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
        Les sons du mandarin, expliqués depuis le français.
      </p>

      {status !== undefined && status.problem !== null && (
        <p
          className="mt-4 rounded-xl border p-3 text-xs leading-relaxed"
          style={{ borderColor: 'var(--tone-2)', color: 'var(--text-muted)' }}
        >
          <strong style={{ color: 'var(--tone-2)' }}>Pas de son : </strong>
          {status.problem}
        </p>
      )}

      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <Link
          to="/prononciation/ecoute"
          className="flex min-h-12 items-center justify-center rounded-xl text-sm font-medium"
          style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
        >
          Exercices d’écoute
        </Link>
        <Link
          to="/prononciation/prononcer"
          className="flex min-h-12 items-center justify-center rounded-xl border text-sm font-medium"
          style={{ borderColor: 'var(--border)' }}
        >
          Travailler ses tons
        </Link>
      </div>

      {/* ---------------- Les tons ---------------- */}
      <h2 className="mt-8 mb-3 text-sm font-semibold tracking-wide uppercase">
        Les quatre tons
      </h2>
      <p className="mb-3 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        La même syllabe change de sens selon la hauteur. Écoute la série entière,
        plusieurs fois, avant d’essayer de distinguer un ton isolé.
      </p>

      <div className="mb-3 flex flex-wrap gap-2">
        {TONE_SETS.map((set, index) => (
          <button
            key={set.syllable}
            type="button"
            onClick={() => {
              setSetIndex(index)
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

      <ul className="divide-y overflow-hidden rounded-2xl border" style={card}>
        {serie?.entries.map((entry) => {
          const description = TONE_DESCRIPTIONS[entry.tone as Tone]
          return (
            <li
              key={entry.character}
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderColor: 'var(--border)' }}
            >
              <span lang="zh-Hans" className="hanzi text-2xl">{entry.character}</span>
              <span className="min-w-0 flex-1">
                <Pinyin
                  numbered={entry.pinyinNum}
                  className="block text-base font-semibold"
                />
                <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>
                  {description.name} — {entry.gloss}
                </span>
                <span
                  className="mt-0.5 block text-xs leading-relaxed"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {description.hint}
                </span>
              </span>
              <span
                className="font-mono text-xs"
                style={{ color: toneColorVar(entry.tone as Tone) }}
              >
                {description.contour}
              </span>
              <BoutonEcouter
                onClick={() => {
                  say(entry.character)
                }}
                disabled={muet}
                label={`Écouter ${entry.character}`}
              />
            </li>
          )
        })}
      </ul>

      {/* ---------------- Sandhi ---------------- */}
      <h2 className="mt-8 mb-3 text-sm font-semibold tracking-wide uppercase">
        Quand le ton écrit n’est pas le ton dit
      </h2>
      <p className="mb-3 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
        你好 s’écrit <Pinyin numbered="ni3 hao3" /> et se dit{' '}
        <Pinyin numbered="ni2 hao3" />. C’est le premier mot qu’on apprend, et le
        premier piège : lire le pinyin tel quel installe une prononciation fausse.
      </p>

      <ul className="divide-y overflow-hidden rounded-2xl border" style={card}>
        {SANDHI_EXAMPLES.map((example) => {
          const result = applySandhi(example.pinyinNum, example.characters)
          const rule = result.syllables.find((s) => s.rule !== null)?.rule ?? null
          return (
            <li
              key={example.characters}
              className="flex items-start gap-3 px-4 py-3"
              style={{ borderColor: 'var(--border)' }}
            >
              <span lang="zh-Hans" className="hanzi text-xl">{example.characters}</span>
              <span className="min-w-0 flex-1 text-sm">
                <span className="block">
                  <span style={{ color: 'var(--text-muted)' }}>écrit </span>
                  <Pinyin numbered={example.pinyinNum} />
                  {result.changed && (
                    <>
                      <span style={{ color: 'var(--text-muted)' }}> · dit </span>
                      <Pinyin numbered={result.spokenNumbered} />
                    </>
                  )}
                </span>
                {rule !== null && (
                  <span
                    className="mt-1 block text-xs leading-relaxed"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {SANDHI_EXPLANATIONS[rule]}
                  </span>
                )}
              </span>
              <BoutonEcouter
                onClick={() => {
                  say(example.characters)
                }}
                disabled={muet}
                label={`Écouter ${example.characters}`}
              />
            </li>
          )
        })}
      </ul>

      {/* ---------------- Initiales et finales ---------------- */}
      <h2 className="mt-8 mb-3 text-sm font-semibold tracking-wide uppercase">
        Les initiales
      </h2>
      {INITIAL_GROUPS.map((group) => (
        <GroupeDeSons key={group.title} group={group} say={say} muet={muet} />
      ))}

      <h2 className="mt-8 mb-3 text-sm font-semibold tracking-wide uppercase">
        Les finales
      </h2>
      {FINAL_GROUPS.map((group) => (
        <GroupeDeSons key={group.title} group={group} say={say} muet={muet} />
      ))}
    </div>
  )
}
