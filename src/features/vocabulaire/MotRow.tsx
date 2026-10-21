import { Link } from 'react-router-dom'
import {
  CONTENT_STATUS_EXPLANATIONS,
  CONTENT_STATUS_LABELS,
  describeParts,
  type Lexeme,
} from '@/data/content'
import { applySandhi, SANDHI_EXPLANATIONS } from '@/domain/pinyin'
import { BoutonEcouter } from '@/ui/BoutonEcouter'
import { Pinyin } from '@/ui/Pinyin'

export interface MotRowProps {
  readonly lexeme: Lexeme
  readonly showPinyin: boolean
  readonly say: (text: string) => void
  readonly muet: boolean
  /** Affiche le niveau HSK, utile hors d'une liste de niveau. */
  readonly showLevel?: boolean
}

/** Une ligne de vocabulaire, dépliable sur la fiche complète du mot. */
export function MotRow({ lexeme, showPinyin, say, muet, showLevel = false }: MotRowProps) {
  // Le ton écrit n'est pas toujours le ton dit : 你好 se prononce `ní hǎo`.
  // L'afficher sans le signaler reviendrait à enseigner une prononciation fausse.
  const sandhi = applySandhi(lexeme.pinyinNum, lexeme.simplified)
  const sandhiRule =
    sandhi.syllables.find((s) => s.spokenTone !== s.citationTone)?.rule ?? null

  return (
    <details className="group">
      <summary
        className="flex cursor-pointer list-none items-center gap-3 px-5 py-3"
        style={{ minHeight: '3.5rem' }}
      >
        <span className="hanzi text-2xl">{lexeme.simplified}</span>
        <span className="min-w-0 flex-1">
          {showPinyin && (
            <Pinyin
              numbered={lexeme.pinyinNum}
              marked={lexeme.pinyinMark}
              className="block text-sm"
            />
          )}
          <span className="block truncate text-sm" style={{ color: 'var(--text-muted)' }}>
            {lexeme.glossFr.slice(0, 3).join(', ')}
          </span>
        </span>

        {showLevel && (
          <span className="shrink-0 text-xs" style={{ color: 'var(--text-muted)' }}>
            HSK {lexeme.hsk2025}
          </span>
        )}

        <span
          role="presentation"
          onClick={(event) => {
            // Écouter sans déplier : le bouton vit dans le résumé, mais ne doit
            // pas ouvrir la fiche.
            event.preventDefault()
            event.stopPropagation()
            say(lexeme.simplified)
          }}
        >
          <BoutonEcouter
            onClick={() => {
              say(lexeme.simplified)
            }}
            disabled={muet}
            label={`Écouter ${lexeme.simplified}`}
          />
        </span>

        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="shrink-0 transition-transform group-open:rotate-90"
          style={{ color: 'var(--text-muted)' }}
        >
          <path d="m9 6 6 6-6 6" />
        </svg>
      </summary>

      <div
        className="px-5 pt-1 pb-4 text-sm"
        style={{ background: 'var(--surface-sunken)' }}
      >
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          <dt style={{ color: 'var(--text-muted)' }}>Pinyin</dt>
          <dd>
            <Pinyin numbered={lexeme.pinyinNum} marked={lexeme.pinyinMark} />{' '}
            <span style={{ color: 'var(--text-muted)' }}>
              (citation : {lexeme.pinyinNum})
            </span>
          </dd>

          {sandhi.changed && (
            <>
              <dt style={{ color: 'var(--text-muted)' }}>Se prononce</dt>
              <dd>
                <Pinyin numbered={sandhi.spokenNumbered} />
                {sandhiRule !== null && (
                  <span
                    className="mt-1 block text-xs leading-relaxed"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {SANDHI_EXPLANATIONS[sandhiRule]}
                  </span>
                )}
              </dd>
            </>
          )}

          <dt style={{ color: 'var(--text-muted)' }}>Caractères</dt>
          <dd className="flex flex-wrap gap-2">
            {[...lexeme.simplified].map((character, position) => (
              <Link
                // Un mot peut répéter un caractère (爸爸) : la position
                // distingue les deux entrées.
                key={`${character}-${String(position)}`}
                to={`/caractere/${encodeURIComponent(character)}`}
                className="hanzi rounded-lg border px-2 py-1 text-xl"
                style={{ borderColor: 'var(--border)' }}
              >
                {character}
              </Link>
            ))}
          </dd>

          {lexeme.traditional !== null && lexeme.traditional !== lexeme.simplified && (
            <>
              <dt style={{ color: 'var(--text-muted)' }}>Traditionnel</dt>
              <dd className="hanzi">{lexeme.traditional}</dd>
            </>
          )}

          {lexeme.pos.length > 0 && (
            <>
              <dt style={{ color: 'var(--text-muted)' }}>Nature</dt>
              <dd>{describeParts(lexeme.pos)}</dd>
            </>
          )}

          <dt style={{ color: 'var(--text-muted)' }}>Sens</dt>
          <dd>{lexeme.glossFr.join(' · ')}</dd>

          <dt style={{ color: 'var(--text-muted)' }}>Niveau</dt>
          <dd>
            HSK {lexeme.hsk2025} (syllabus 2025)
            {lexeme.hsk2021 !== null && lexeme.hsk2021 !== lexeme.hsk2025 && (
              <span style={{ color: 'var(--text-muted)' }}>
                {' '}
                — niveau {lexeme.hsk2021} dans le standard de 2021
              </span>
            )}
          </dd>

          {lexeme.freqRank !== null && (
            <>
              <dt style={{ color: 'var(--text-muted)' }}>Fréquence</dt>
              <dd>
                {lexeme.freqRank}
                <sup>e</sup> mot le plus courant
              </dd>
            </>
          )}
        </dl>

        <p className="mt-3 text-xs" style={{ color: 'var(--text-muted)' }}>
          {CONTENT_STATUS_LABELS[lexeme.contentStatus]} —{' '}
          {CONTENT_STATUS_EXPLANATIONS[lexeme.contentStatus]}
          {lexeme.glossApprox &&
            ' Le rapprochement avec le dictionnaire a demandé une tolérance : définition à vérifier en priorité.'}
        </p>
      </div>
    </details>
  )
}
