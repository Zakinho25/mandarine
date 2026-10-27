import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * Dernier filet avant la page blanche.
 *
 * Depuis que les écrans sont chargés à la demande, un fichier qui n'arrive
 * pas — coupure réseau, cache périmé après un déploiement — fait remonter
 * l'exception jusqu'à la racine. Sans barrière, React démonte tout l'arbre et
 * l'utilisateur se retrouve devant une page vide, sans rien à faire ni rien à
 * comprendre.
 *
 * Deux cas sont traités différemment, parce qu'ils n'appellent pas la même
 * réponse :
 *
 *  - un **écran qui n'a pas pu être téléchargé** se répare en rechargeant la
 *    page, puisque le service worker ira chercher la nouvelle version. On le
 *    fait automatiquement, une seule fois, pour ne pas tourner en boucle si
 *    le problème persiste.
 *  - **toute autre erreur** est un défaut de l'application. On l'affiche,
 *    avec de quoi revenir au tableau de bord : une progression intacte
 *    derrière un écran cassé vaut mieux qu'un rechargement qui masque le
 *    problème.
 */

const CLE_RECHARGE = 'mandarine:recharge-apres-echec'

/**
 * Reconnaît l'échec de chargement d'un module.
 *
 * Les navigateurs ne s'accordent pas sur le message : Chrome parle de
 * « dynamically imported module », Safari de « Importing a module script
 * failed ». On accepte les deux, et le repli reste l'affichage de l'erreur.
 */
function estEcranIntrouvable(erreur: unknown): boolean {
  if (!(erreur instanceof Error)) return false
  return /dynamically imported module|module script failed|Failed to fetch/i.test(
    erreur.message,
  )
}

/** Lecture et écriture tolérantes : en navigation privée, tout accès peut lever. */
function dejaRecharge(): boolean {
  try {
    return sessionStorage.getItem(CLE_RECHARGE) !== null
  } catch {
    // Sans stockage de session, on ne peut pas garantir l'absence de boucle :
    // on s'interdit alors le rechargement automatique.
    return true
  }
}

function noterRechargement(): void {
  try {
    sessionStorage.setItem(CLE_RECHARGE, new Date().toISOString())
  } catch {
    // Rien à faire : le garde-fou ci-dessus a déjà refusé le rechargement.
  }
}

interface Props {
  readonly children: ReactNode
}

interface State {
  readonly erreur: Error | null
  readonly rechargeTentee: boolean
}

export class BarriereErreur extends Component<Props, State> {
  override state: State = { erreur: null, rechargeTentee: false }

  static getDerivedStateFromError(erreur: Error): Partial<State> {
    return { erreur }
  }

  override componentDidCatch(erreur: Error, info: ErrorInfo): void {
    console.error('Écran en échec.', erreur, info.componentStack)

    if (!estEcranIntrouvable(erreur)) return
    if (dejaRecharge()) {
      this.setState({ rechargeTentee: true })
      return
    }
    noterRechargement()
    window.location.reload()
  }

  private readonly recharger = (): void => {
    try {
      sessionStorage.removeItem(CLE_RECHARGE)
    } catch {
      // Sans stockage de session, le rechargement manuel fonctionne quand même.
    }
    window.location.reload()
  }

  override render(): ReactNode {
    const { erreur, rechargeTentee } = this.state
    if (erreur === null) return this.props.children

    const introuvable = estEcranIntrouvable(erreur)

    return (
      <div className="mx-auto max-w-xl px-4 py-8" role="alert">
        <h1 className="text-2xl font-semibold">
          {introuvable ? 'Cet écran n’a pas pu être chargé' : 'Quelque chose a cassé'}
        </h1>

        <p className="mt-3 text-sm leading-relaxed">
          {introuvable
            ? rechargeTentee
              ? 'Le rechargement n’a rien changé. Si tu es hors ligne, reconnecte-toi un instant : cet écran n’a jamais été mis en cache.'
              : 'Rechargement en cours…'
            : 'Ta progression n’est pas touchée : elle est enregistrée à part, et rien ici ne l’a modifiée.'}
        </p>

        <p
          className="mt-4 rounded-xl border p-3 font-mono text-xs break-words"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          {erreur.message}
        </p>

        <button
          type="button"
          onClick={this.recharger}
          className="mt-5 min-h-12 w-full rounded-xl text-sm font-medium"
          style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
        >
          Recharger l’application
        </button>

        <a
          href="#/"
          className="mt-2 flex min-h-12 items-center justify-center rounded-xl border text-sm"
          style={{ borderColor: 'var(--border)' }}
        >
          Revenir au tableau de bord
        </a>
      </div>
    )
  }
}
