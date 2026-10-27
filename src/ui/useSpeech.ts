import { useCallback, useEffect, useState } from 'react'
import { detectSpeech, speak, type SpeechStatus } from '@/data/speech'

/**
 * Détection faite une fois pour toute l'application : interroger la liste des
 * voix est lent et déclenche parfois une attente d'événement.
 */
let cached: Promise<SpeechStatus> | undefined

function status(): Promise<SpeechStatus> {
  cached ??= detectSpeech()
  return cached
}

export interface Speech {
  readonly status: SpeechStatus | undefined
  /** Fait lire un texte **chinois**. Sans voix disponible, ne fait rien. */
  readonly say: (text: string) => void
}

export function useSpeech(): Speech {
  const [state, setState] = useState<SpeechStatus | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    void status().then((result) => {
      if (!cancelled) setState(result)
    })
    return () => {
      cancelled = true
    }
  }, [])

  /**
   * Stable tant que la voix ne change pas. C'est nécessaire, pas cosmétique :
   * une carte d'écoute prononce le mot à l'arrivée, dans un effet. Avec une
   * fonction recréée à chaque rendu, cet effet se rejouerait sans fin et le
   * mot tournerait en boucle.
   */
  const voice = state?.voice ?? null
  const say = useCallback(
    (text: string) => {
      if (voice == null) return
      speak(text, { voice })
    },
    [voice],
  )

  return {
    status: state,
    say,
  }
}
