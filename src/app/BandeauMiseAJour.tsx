import { useRegisterSW } from 'virtual:pwa-register/react'

/**
 * Signale qu'une nouvelle version est prête, et laisse décider du moment.
 *
 * L'application se mettait à jour en silence. Deux problèmes avec ça. Le
 * premier est qu'on pouvait travailler des jours sur du code périmé sans
 * aucun moyen de le savoir. Le second est plus sérieux : depuis que les
 * écrans sont chargés à la demande, un service worker qui prend la main en
 * cours de session peut rendre introuvable un écran pas encore visité, parce
 * que ses fichiers viennent d'être remplacés. L'attente explicite supprime ce
 * cas, et la barrière d'erreur couvre le reste.
 *
 * Le bandeau ne s'affiche jamais au premier lancement : seule une mise à jour
 * le déclenche.
 */
export function BandeauMiseAJour() {
  const {
    needRefresh: [aJour, setAJour],
    updateServiceWorker,
  } = useRegisterSW()

  if (!aJour) return null

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-20 z-40 mx-auto flex max-w-xl items-center gap-3 rounded-2xl border p-3 shadow-lg"
      style={{
        background: 'var(--surface-raised)',
        borderColor: 'var(--accent)',
        marginLeft: '1rem',
        marginRight: '1rem',
      }}
    >
      <p className="min-w-0 flex-1 text-sm">
        Une nouvelle version est prête.
        <span className="block text-xs" style={{ color: 'var(--text-muted)' }}>
          Ta progression est conservée.
        </span>
      </p>

      <button
        type="button"
        onClick={() => {
          void updateServiceWorker(true)
        }}
        className="min-h-11 shrink-0 rounded-xl px-4 text-sm font-medium"
        style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
      >
        Mettre à jour
      </button>

      <button
        type="button"
        onClick={() => {
          setAJour(false)
        }}
        aria-label="Plus tard"
        className="min-h-11 shrink-0 rounded-xl border px-3 text-sm"
        style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
      >
        Plus tard
      </button>
    </div>
  )
}
