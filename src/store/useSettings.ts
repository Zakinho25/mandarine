import { create } from 'zustand'
import { DEFAULT_SETTINGS, loadSettings, saveSetting, type Settings } from '@/data/settings'

interface SettingsState {
  readonly settings: Settings
  /** `false` tant que les préférences stockées ne sont pas chargées. */
  readonly ready: boolean
  readonly hydrate: () => Promise<void>
  readonly update: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<void>
}

/**
 * Applique les préférences d'apparence à la racine du document.
 *
 * Tout le thème vit dans des variables CSS pilotées par ces trois attributs :
 * changer une préférence ne provoque donc aucun recalcul React, et la feuille
 * de style reste la seule source de vérité des couleurs.
 */
export function applyAppearance(settings: Settings): void {
  const root = document.documentElement
  if (settings.theme === 'auto') root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', settings.theme)

  root.setAttribute('data-tones', settings.toneScheme)
  root.setAttribute('data-hanzi', settings.hanziSize)
}

export const useSettings = create<SettingsState>()((set, get) => ({
  settings: DEFAULT_SETTINGS,
  ready: false,

  hydrate: async () => {
    const settings = await loadSettings()
    applyAppearance(settings)
    set({ settings, ready: true })
  },

  update: async (key, value) => {
    const next = { ...get().settings, [key]: value }
    set({ settings: next })
    applyAppearance(next)
    await saveSetting(key, value)
  },
}))
