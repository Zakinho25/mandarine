interface PlaceholderProps {
  readonly title: string
  readonly milestone: number
  readonly description: string
}

/**
 * Écran annoncé mais pas encore construit.
 *
 * Il dit explicitement qu'il est vide et à quel jalon il sera rempli. Un écran
 * de démonstration qui ferait semblant de fonctionner donnerait une fausse idée
 * de l'avancement — c'est précisément ce que le cahier des charges interdit.
 */
export function Placeholder({ title, milestone, description }: PlaceholderProps) {
  return (
    <section className="mx-auto max-w-xl px-4 py-10">
      <p
        className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-semibold tracking-wide uppercase"
        style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
      >
        Jalon {milestone} — pas encore construit
      </p>
      <h1 className="mb-2 text-2xl font-semibold">{title}</h1>
      <p style={{ color: 'var(--text-muted)' }}>{description}</p>
    </section>
  )
}
