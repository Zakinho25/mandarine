interface CourbeTonsProps {
  /** Contour attendu, en demi-tons autour de la moyenne. */
  readonly attendu: readonly number[]
  /** Contour produit, dans la même unité. `null` avant tout enregistrement. */
  readonly produit?: readonly number[] | null
  readonly height?: number
}

const RANGE = 9

/**
 * Superpose le contour attendu et le contour produit.
 *
 * L'axe vertical est en demi-tons autour de la moyenne de chaque courbe : les
 * deux sont donc comparables quelle que soit la voix. C'est la forme qui est
 * dessinée, pas la hauteur absolue.
 */
export function CourbeTons({ attendu, produit, height = 160 }: CourbeTonsProps) {
  const width = 300

  function path(values: readonly number[]): string {
    if (values.length < 2) return ''
    return values
      .map((value, index) => {
        const x = (index / (values.length - 1)) * width
        const clamped = Math.max(-RANGE, Math.min(RANGE, value))
        const y = height / 2 - (clamped / RANGE) * (height / 2 - 10)
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
      })
      .join(' ')
  }

  return (
    <svg
      viewBox={`0 0 ${String(width)} ${String(height)}`}
      width="100%"
      height={height}
      role="img"
      aria-label={
        produit == null
          ? 'Contour attendu du ton'
          : 'Contour attendu et contour que tu as produit, superposés'
      }
      className="rounded-xl border"
      style={{ background: 'var(--surface-raised)', borderColor: 'var(--border)' }}
    >
      {/* Repères : grave, médian, aigu. */}
      {[-RANGE / 2, 0, RANGE / 2].map((level) => (
        <line
          key={level}
          x1={0}
          x2={width}
          y1={height / 2 - (level / RANGE) * (height / 2 - 10)}
          y2={height / 2 - (level / RANGE) * (height / 2 - 10)}
          stroke="var(--border)"
          strokeWidth={level === 0 ? 1.5 : 1}
          strokeDasharray={level === 0 ? undefined : '4 4'}
        />
      ))}

      <path
        d={path(attendu)}
        fill="none"
        stroke="var(--text-muted)"
        strokeWidth={3}
        strokeDasharray="6 5"
        strokeLinecap="round"
      />

      {produit != null && produit.length > 1 && (
        <path
          d={path(produit)}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={3.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}
