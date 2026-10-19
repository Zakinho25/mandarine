/**
 * Prononciation par la synthèse vocale du navigateur.
 *
 * C'est le choix qui rend l'audio gratuit et hors ligne : les voix chinoises
 * sont déjà installées sur iPhone et sur Windows, rien n'est téléchargé, aucun
 * compte n'est nécessaire.
 *
 * En contrepartie, la voix dépend de l'appareil et peut tout simplement
 * manquer. Quand c'est le cas, on le **dit** et on explique quoi faire : une
 * application de prononciation dont le bouton « écouter » ne fait rien sans
 * expliquer pourquoi est pire qu'une application sans audio.
 *
 * Note : on fait lire les **caractères**, jamais le pinyin. Une bonne voix
 * chinoise applique elle-même le sandhi tonal ; lui donner du pinyin
 * produirait un charabia latin.
 */

export interface VoiceLike {
  readonly lang: string
  readonly name: string
}

/** Préférences, de la plus précise à la plus large. */
const LANGUAGE_PREFERENCES = ['zh-cn', 'zh-hans', 'cmn', 'zh']

/**
 * Choisit la voix la plus adaptée au mandarin standard.
 *
 * Fonction séparée du navigateur pour être testable : les navigateurs
 * écrivent la langue tantôt `zh-CN`, tantôt `zh_CN`, tantôt `cmn-Hans-CN`.
 */
export function pickChineseVoice<T extends VoiceLike>(voices: readonly T[]): T | null {
  for (const preference of LANGUAGE_PREFERENCES) {
    const match = voices.find((voice) =>
      voice.lang.replace(/_/g, '-').toLowerCase().startsWith(preference),
    )
    if (match !== undefined) return match
  }
  return null
}

export interface SpeechStatus {
  readonly supported: boolean
  readonly voice: SpeechSynthesisVoice | null
  /** Message en français quand l'audio n'est pas disponible. */
  readonly problem: string | null
}

const UNSUPPORTED =
  'Ce navigateur ne propose pas de synthèse vocale. Safari sur iPhone et ' +
  'Edge ou Chrome sur Windows en ont une.'

const NO_VOICE =
  'Aucune voix chinoise n’est installée sur cet appareil. Sur Windows : ' +
  'Paramètres → Heure et langue → Langue, ajouter le chinois (simplifié). ' +
  'Sur iPhone, la voix chinoise est présente par défaut.'

/**
 * Attend que la liste des voix soit disponible.
 *
 * Plusieurs navigateurs la renvoient vide au premier appel et la remplissent
 * ensuite, en émettant `voiceschanged`. On attend donc, avec une limite de
 * temps : sans elle, un navigateur qui n'émet jamais l'événement laisserait
 * l'interface en chargement pour toujours.
 */
export async function loadVoices(timeoutMs = 2000): Promise<SpeechSynthesisVoice[]> {
  if (typeof speechSynthesis === 'undefined') return []

  const immediate = speechSynthesis.getVoices()
  if (immediate.length > 0) return immediate

  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      speechSynthesis.removeEventListener('voiceschanged', onChange)
      resolve(speechSynthesis.getVoices())
    }, timeoutMs)

    function onChange(): void {
      clearTimeout(timer)
      speechSynthesis.removeEventListener('voiceschanged', onChange)
      resolve(speechSynthesis.getVoices())
    }

    speechSynthesis.addEventListener('voiceschanged', onChange)
  })
}

export async function detectSpeech(): Promise<SpeechStatus> {
  if (typeof speechSynthesis === 'undefined') {
    return { supported: false, voice: null, problem: UNSUPPORTED }
  }

  const voice = pickChineseVoice(await loadVoices())
  return {
    supported: true,
    voice,
    problem: voice === null ? NO_VOICE : null,
  }
}

export interface SpeakOptions {
  readonly voice?: SpeechSynthesisVoice | null
  /** 1 = vitesse normale. On ralentit par défaut : c'est un support d'écoute. */
  readonly rate?: number
}

export function speak(text: string, options: SpeakOptions = {}): void {
  if (typeof speechSynthesis === 'undefined') return

  // Une énonciation en cours est interrompue : enchaîner les écoutes doit
  // répondre immédiatement, pas faire la queue.
  speechSynthesis.cancel()

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = options.voice?.lang ?? 'zh-CN'
  if (options.voice != null) utterance.voice = options.voice
  utterance.rate = options.rate ?? 0.8
  speechSynthesis.speak(utterance)
}

export function stopSpeaking(): void {
  if (typeof speechSynthesis === 'undefined') return
  speechSynthesis.cancel()
}
