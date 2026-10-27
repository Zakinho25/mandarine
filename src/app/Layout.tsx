import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useSettings } from '@/store/useSettings'

interface Tab {
  readonly to: string
  readonly label: string
  readonly path: string
}

/**
 * Onglets, dans l'ordre pédagogique : on part du parcours, les révisions
 * viennent ensuite parce qu'elles sont l'activité quotidienne.
 */
const TABS: readonly Tab[] = [
  { to: '/', label: 'Parcours', path: 'M4 17h5v-5h6V7h5' },
  {
    to: '/revisions',
    label: 'Révisions',
    path: 'M4 7h11a3 3 0 0 1 3 3v7M4 7l3-3M4 7l3 3M20 17H9a3 3 0 0 1-3-3',
  },
  {
    to: '/grammaire',
    label: 'Grammaire',
    path: 'M4 6h16M4 12h10M4 18h13M17 10l3 3-3 3',
  },
  { to: '/lecture', label: 'Lecture', path: 'M12 7v12M12 7a5 3 0 0 0-8-1v11a5 3 0 0 1 8 1M12 7a5 3 0 0 1 8-1v11a5 3 0 0 0-8 1' },
  { to: '/dialogues', label: 'Dialogues', path: 'M20 12a7 7 0 0 1-7 7H8l-4 3v-9a7 7 0 0 1 7-7h2a7 7 0 0 1 7 6z' },
  { to: '/reglages', label: 'Réglages', path: 'M4 7h16M4 12h16M4 17h16M9 7v0M15 12v0M7 17v0' },
]

export function Layout() {
  const hydrate = useSettings((state) => state.hydrate)

  useEffect(() => {
    // Les préférences sont lues après le premier rendu, jamais avant : si
    // IndexedDB est indisponible (navigation privée), l'application doit
    // quand même s'afficher avec les valeurs par défaut.
    void hydrate().catch((error: unknown) => {
      console.error('Préférences illisibles, valeurs par défaut appliquées.', error)
    })
  }, [hydrate])

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex-1 pb-24">
        <Outlet />
      </main>

      <nav
        aria-label="Navigation principale"
        className="fixed inset-x-0 bottom-0 border-t backdrop-blur"
        style={{
          background: 'color-mix(in srgb, var(--surface) 88%, transparent)',
          borderColor: 'var(--border)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <ul className="mx-auto flex max-w-xl">
          {TABS.map((tab) => (
            <li key={tab.to} className="flex-1">
              <NavLink
                to={tab.to}
                end={tab.to === '/'}
                className="flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-[11px]"
                style={({ isActive }) => ({
                  color: isActive ? 'var(--accent)' : 'var(--text-muted)',
                  fontWeight: isActive ? 600 : 400,
                })}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  width="22"
                  height="22"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={tab.path} />
                </svg>
                {tab.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
