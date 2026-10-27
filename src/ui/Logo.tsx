interface LogoProps {
  readonly size?: number
  readonly className?: string
}

/**
 * La marque : un quartier de mandarine.
 *
 * Le nom de l'application joue déjà sur les deux sens du mot, le fruit et la
 * langue. Le dessin prend le premier au pied de la lettre, et laisse le
 * second au contexte.
 *
 * Un quartier plutôt qu'un fruit entier, parce qu'un disque orange ne se
 * distingue de rien à 24 px. La silhouette en coin, elle, reste reconnaissable
 * jusqu'en bas de la barre d'onglets. Les deux nervures disparaissent aux
 * petites tailles sans que la forme en souffre.
 */
export function Logo({ size = 32, className }: LogoProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Mandarine"
      fill="none"
    >
      <defs>
        <linearGradient id="mandarine-chair" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent-vif)" />
        </linearGradient>
      </defs>

      {/* La chair du quartier. Le contour arrondi vient du trait, pas du
          tracé : une pointe nette ferait vieillot à cette taille. */}
      <path
        d="M6.5 26.5 L3.82 4.66 A 22 22 0 0 1 28.02 21.93 Z"
        fill="url(#mandarine-chair)"
        stroke="url(#mandarine-chair)"
        strokeWidth="3"
        strokeLinejoin="round"
      />

      {/* L'écorce, le long de l'arc. Crème fixe plutôt que le jeton de
          contraste : celui-ci bascule avec le thème, et une marque ne doit
          pas changer de dessin entre le jour et la nuit.

          C'est cette bande claire qui fait lire « agrume » plutôt que
          « triangle ». Sans elle, la forme reste une pointe quelconque. */}
      <path
        d="M3.82 4.66 A 22 22 0 0 1 28.02 21.93"
        fill="none"
        stroke="#fff3e6"
        strokeWidth="3.4"
        strokeLinecap="round"
        opacity="0.92"
      />

      {/* Les nervures, en éventail depuis la pointe. Fines et discrètes :
          elles disparaissent en dessous de 20 px sans que la forme change. */}
      <g
        stroke="#fff3e6"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.45"
      >
        <path d="M6.85 22.52 L7.63 13.55" />
        <path d="M8.79 23.22 L13.96 15.85" />
        <path d="M10.13 24.81 L18.28 21.01" />
      </g>
    </svg>
  )
}

/**
 * Le logotype complet : la marque et le nom.
 *
 * Le nom est tracé dans la police d'affichage, en graisse haute et crénage
 * resserré. C'est le seul endroit où l'application se présente ; ailleurs,
 * elle se contente de fonctionner.
 */
export function Logotype({ className }: { readonly className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ''}`}>
      <Logo size={34} />
      <span
        className="text-3xl leading-none font-extrabold"
        style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.035em' }}
      >
        Mandarine
      </span>
    </span>
  )
}
