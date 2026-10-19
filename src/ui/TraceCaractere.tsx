import { useCallback, useEffect, useRef, useState } from 'react'
import HanziWriter from 'hanzi-writer'
import { loadStrokes } from '@/data/hanzi'
import { useSettings } from '@/store/useSettings'

interface TraceCaractereProps {
  readonly character: string
  readonly size?: number
}

/**
 * Ordre des traits, animé.
 *
 * `hanzi-writer` écrit dans le DOM directement ; React ne gère donc que le
 * conteneur et le cycle de vie. Les tracés viennent de nos propres fichiers,
 * pas du CDN par défaut de la bibliothèque : l'application doit fonctionner
 * hors ligne.
 *
 * Les couleurs sont lues sur les variables CSS au moment de la création. La
 * bibliothèque écrit des attributs SVG et ne sait pas suivre un changement de
 * thème : on recrée donc l'animation quand le thème change.
 */
export function TraceCaractere({ character, size = 220 }: TraceCaractereProps) {
  const container = useRef<HTMLDivElement>(null)
  const writer = useRef<HanziWriter | null>(null)
  const theme = useSettings((state) => state.settings.theme)

  const [error, setError] = useState<string | undefined>(undefined)
  const [quizzing, setQuizzing] = useState(false)
  const [quizResult, setQuizResult] = useState<string | undefined>(undefined)
  const handwriting = useSettings((state) => state.settings.handwriting)

  useEffect(() => {
    const element = container.current
    if (element === null) return

    element.replaceChildren()
    setError(undefined)
    setQuizResult(undefined)
    setQuizzing(false)

    const styles = getComputedStyle(document.documentElement)
    const color = (name: string, fallback: string): string =>
      styles.getPropertyValue(name).trim() || fallback

    const instance = HanziWriter.create(element, character, {
      width: size,
      height: size,
      padding: 8,
      showCharacter: true,
      showOutline: true,
      strokeAnimationSpeed: 1,
      delayBetweenStrokes: 220,
      strokeColor: color('--text', '#1c1917'),
      outlineColor: color('--border', '#e2ddd3'),
      highlightColor: color('--accent', '#a8481a'),
      drawingColor: color('--accent', '#a8481a'),
      charDataLoader: (char) => loadStrokes(char),
      onLoadCharDataError: () => {
        setError('Tracés indisponibles pour ce caractère.')
      },
    })

    writer.current = instance
    return () => {
      writer.current = null
      element.replaceChildren()
    }
  }, [character, size, theme])

  const animate = useCallback(() => {
    setQuizResult(undefined)
    void writer.current?.animateCharacter()
  }, [])

  const startQuiz = useCallback(() => {
    setQuizResult(undefined)
    setQuizzing(true)
    void writer.current?.quiz({
      onComplete: ({ totalMistakes }) => {
        setQuizzing(false)
        setQuizResult(
          totalMistakes === 0
            ? 'Tracé juste du premier coup.'
            : `Tracé terminé, ${String(totalMistakes)} erreur${totalMistakes > 1 ? 's' : ''}.`,
        )
      },
    })
  }, [])

  return (
    <div className="flex flex-col items-center">
      <div
        ref={container}
        aria-hidden="true"
        className="rounded-2xl border"
        style={{
          width: size,
          height: size,
          background: 'var(--surface-raised)',
          borderColor: 'var(--border)',
        }}
      />

      {error !== undefined && (
        <p className="mt-2 text-xs" style={{ color: 'var(--tone-1)' }}>
          {error}
        </p>
      )}

      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={animate}
          disabled={quizzing}
          className="min-h-11 rounded-xl border px-4 text-sm"
          style={{ borderColor: 'var(--border)', opacity: quizzing ? 0.5 : 1 }}
        >
          Voir l’ordre des traits
        </button>

        {/* L'entraînement au tracé reste optionnel : le nouveau HSK n'exige
            pas l'écriture manuscrite avant le niveau 5. */}
        {handwriting && (
          <button
            type="button"
            onClick={startQuiz}
            disabled={quizzing}
            className="min-h-11 rounded-xl px-4 text-sm font-medium"
            style={{
              background: 'var(--accent)',
              color: 'var(--accent-contrast)',
              opacity: quizzing ? 0.5 : 1,
            }}
          >
            {quizzing ? 'À toi de tracer…' : 'S’entraîner à écrire'}
          </button>
        )}
      </div>

      {quizResult !== undefined && (
        <p className="mt-2 text-sm" aria-live="polite">
          {quizResult}
        </p>
      )}
    </div>
  )
}
