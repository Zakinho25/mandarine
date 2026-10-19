interface BoutonEcouterProps {
  readonly onClick: () => void
  readonly disabled?: boolean
  readonly label: string
  readonly size?: 'petit' | 'grand'
}

/** Bouton d'écoute. Le libellé décrit ce qu'on va entendre, pour le lecteur d'écran. */
export function BoutonEcouter({
  onClick,
  disabled = false,
  label,
  size = 'petit',
}: BoutonEcouterProps) {
  const dimension = size === 'grand' ? 64 : 40
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="inline-flex shrink-0 items-center justify-center rounded-full border"
      style={{
        width: dimension,
        height: dimension,
        borderColor: disabled ? 'var(--border)' : 'var(--accent)',
        color: disabled ? 'var(--text-muted)' : 'var(--accent)',
        background: disabled ? 'transparent' : 'var(--accent-soft)',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        width={size === 'grand' ? 28 : 18}
        height={size === 'grand' ? 28 : 18}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M11 5 6 9H3v6h3l5 4V5Z" />
        <path d="M15.5 8.5a5 5 0 0 1 0 7" />
        <path d="M18.5 5.5a9 9 0 0 1 0 13" />
      </svg>
    </button>
  )
}
