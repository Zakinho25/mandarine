/**
 * Enregistrement au microphone.
 *
 * On enregistre avec `MediaRecorder`, puis on décode le résultat pour obtenir
 * les échantillons bruts. L'alternative historique, `ScriptProcessorNode`, est
 * dépréciée, et passer par un `AudioWorklet` demanderait un fichier de module
 * séparé pour le même résultat.
 *
 * L'accès au micro exige un contexte sécurisé : HTTPS, ou `localhost` en
 * développement. GitHub Pages fournit le premier.
 */

export type ProblemeMicro = 'refuse' | 'absent' | 'non_supporte' | 'echec'

export const MICRO_MESSAGES: Record<ProblemeMicro, string> = {
  refuse:
    'Accès au micro refusé. Autorise-le dans les réglages du site, puis recharge la page.',
  absent: 'Aucun micro détecté sur cet appareil.',
  non_supporte:
    'Ce navigateur ne permet pas d’enregistrer. Safari sur iPhone et Chrome ou Edge sur ordinateur le font.',
  echec: 'L’enregistrement a échoué.',
}

export class MicroError extends Error {
  readonly probleme: ProblemeMicro

  constructor(probleme: ProblemeMicro) {
    super(MICRO_MESSAGES[probleme])
    this.name = 'MicroError'
    this.probleme = probleme
  }
}

export interface Enregistrement {
  readonly samples: Float32Array
  readonly sampleRate: number
  readonly durationMs: number
}

export interface Recorder {
  /** Arrête et rend les échantillons décodés. */
  readonly stop: () => Promise<Enregistrement>
  /** Arrête sans rien décoder, et libère le micro. */
  readonly cancel: () => void
}

function supported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.mediaDevices?.getUserMedia === 'function' &&
    typeof MediaRecorder !== 'undefined'
  )
}

export async function startRecording(): Promise<Recorder> {
  if (!supported()) throw new MicroError('non_supporte')

  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      // On coupe les traitements du navigateur : la suppression de bruit et
      // le contrôle de gain déforment la hauteur, qui est précisément ce
      // qu'on mesure.
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    })
  } catch (cause: unknown) {
    const name = cause instanceof Error ? cause.name : ''
    if (name === 'NotAllowedError' || name === 'SecurityError') {
      throw new MicroError('refuse')
    }
    if (name === 'NotFoundError' || name === 'OverconstrainedError') {
      throw new MicroError('absent')
    }
    throw new MicroError('echec')
  }

  const chunks: Blob[] = []
  const recorder = new MediaRecorder(stream)
  const startedAt = Date.now()

  recorder.addEventListener('dataavailable', (event: BlobEvent) => {
    if (event.data.size > 0) chunks.push(event.data)
  })
  recorder.start()

  function release(): void {
    for (const track of stream.getTracks()) track.stop()
  }

  return {
    cancel() {
      if (recorder.state !== 'inactive') recorder.stop()
      release()
    },

    async stop() {
      const durationMs = Date.now() - startedAt

      await new Promise<void>((resolve) => {
        recorder.addEventListener('stop', () => {
          resolve()
        })
        if (recorder.state === 'inactive') resolve()
        else recorder.stop()
      })
      release()

      const blob = new Blob(chunks, { type: recorder.mimeType })
      if (blob.size === 0) throw new MicroError('echec')

      const context = new AudioContext()
      try {
        const buffer = await context.decodeAudioData(await blob.arrayBuffer())
        return {
          samples: buffer.getChannelData(0),
          sampleRate: buffer.sampleRate,
          durationMs,
        }
      } finally {
        void context.close()
      }
    },
  }
}
