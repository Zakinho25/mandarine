import { useEffect, useRef, useState } from 'react'
import { backupFileName, exportBackup, importBackup } from '@/data/backup'
import { localDay } from '@/data/cards'
import { buildReminderIcs, parseTime, reminderFileName } from '@/domain/rappel'
import { isStoragePersistent } from '@/data/db'
import {
  EXAM_TRACK_LABELS,
  EXAM_TRACKS,
  HANZI_SIZES,
  PINYIN_DISPLAYS,
  TONE_SCHEMES,
} from '@/data/types'
import { useSettings } from '@/store/useSettings'
import { TONE_SCHEME_LABELS } from '@/ui/tones'

interface SegmentedProps<T extends string> {
  readonly label: string
  readonly hint?: string
  readonly value: T
  readonly options: readonly T[]
  readonly labels?: Readonly<Record<T, string>>
  readonly onChange: (value: T) => void
}

function Segmented<T extends string>({
  label,
  hint,
  value,
  options,
  labels,
  onChange,
}: SegmentedProps<T>) {
  return (
    <fieldset className="px-5 py-4">
      <legend className="text-sm font-medium">{label}</legend>
      {hint !== undefined && (
        <p className="mt-1 mb-2 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {hint}
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = option === value
          return (
            <button
              key={option}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                onChange(option)
              }}
              className="min-h-11 rounded-xl border px-3 text-sm"
              style={{
                borderColor: selected ? 'var(--accent)' : 'var(--border)',
                background: selected ? 'var(--accent-soft)' : 'transparent',
                color: selected ? 'var(--accent)' : 'var(--text)',
                fontWeight: selected ? 600 : 400,
              }}
            >
              {labels?.[option] ?? option}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

const THEME_LABELS = { auto: 'Système', light: 'Clair', dark: 'Sombre' } as const
const HANZI_LABELS = { petit: 'Petit', moyen: 'Moyen', grand: 'Grand' } as const
const PINYIN_LABELS = {
  toujours: 'Toujours',
  inconnus: 'Mots inconnus',
  jamais: 'Jamais',
} as const

export function ReglagesScreen() {
  const settings = useSettings((state) => state.settings)
  const update = useSettings((state) => state.update)
  const [persistent, setPersistent] = useState<boolean | undefined>(undefined)
  const [message, setMessage] = useState<string | undefined>(undefined)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void isStoragePersistent().then(setPersistent)
  }, [])

  function download(content: string, type: string, name: string): void {
    const url = URL.createObjectURL(new Blob([content], { type }))
    const link = document.createElement('a')
    link.href = url
    link.download = name
    link.click()
    URL.revokeObjectURL(url)
  }

  function handleReminder(): void {
    const time = parseTime(settings.reminderTime)
    if (time === undefined) {
      setMessage('Heure invalide.')
      return
    }
    download(
      buildReminderIcs({
        ...time,
        goalMinutes: settings.dailyGoalMin,
        startDate: localDay(),
      }),
      'text/calendar',
      reminderFileName(),
    )
    setMessage('Événement d’agenda téléchargé. Ouvre-le pour l’ajouter.')
  }

  async function handleExport(): Promise<void> {
    const backup = await exportBackup()
    download(JSON.stringify(backup, null, 2), 'application/json', backupFileName())
    await update('lastBackupAt', new Date().toISOString())
    setMessage('Sauvegarde exportée.')
  }

  async function handleImport(file: File): Promise<void> {
    try {
      const summary = await importBackup(JSON.parse(await file.text()))
      setMessage(
        `Importé : ${String(summary.cards)} cartes, ${String(summary.reviews)} révisions,` +
          ` ${String(summary.days)} journées, ${String(summary.examens)} examens.`,
      )
      await useSettings.getState().hydrate()
    } catch (cause: unknown) {
      setMessage(cause instanceof Error ? cause.message : 'Import impossible.')
    }
  }

  const card = {
    background: 'var(--surface-raised)',
    borderColor: 'var(--border)',
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Réglages</h1>

      <section className="mb-6 divide-y rounded-2xl border" style={card}>
        <Segmented
          label="Thème"
          value={settings.theme}
          options={['auto', 'light', 'dark']}
          labels={THEME_LABELS}
          onChange={(value) => {
            void update('theme', value)
          }}
        />
        <Segmented
          label="Couleur des tons"
          hint="La couleur ne porte jamais seule l’information : le diacritique reste affiché dans tous les cas."
          value={settings.toneScheme}
          options={TONE_SCHEMES}
          labels={TONE_SCHEME_LABELS}
          onChange={(value) => {
            void update('toneScheme', value)
          }}
        />
        <Segmented
          label="Taille des caractères chinois"
          value={settings.hanziSize}
          options={HANZI_SIZES}
          labels={HANZI_LABELS}
          onChange={(value) => {
            void update('hanziSize', value)
          }}
        />
        <div className="px-5 py-4">
          <p className="hanzi text-4xl">学习 中国 女儿</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            Aperçu de la taille choisie.
          </p>
        </div>
      </section>

      <section className="mb-6 divide-y rounded-2xl border" style={card}>
        <Segmented
          label="Affichage du pinyin"
          hint="Le pinyin est une béquille : il doit disparaître progressivement."
          value={settings.pinyinDisplay}
          options={PINYIN_DISPLAYS}
          labels={PINYIN_LABELS}
          onChange={(value) => {
            void update('pinyinDisplay', value)
          }}
        />
        <Segmented
          label="Objectif quotidien"
          value={String(settings.dailyGoalMin) as '10' | '20' | '30'}
          options={['10', '20', '30']}
          labels={{ '10': '10 min', '20': '20 min', '30': '30 min' }}
          onChange={(value) => {
            void update('dailyGoalMin', Number(value) as 10 | 20 | 30)
          }}
        />
        <Segmented
          label="Programme visé"
          hint="Les sources publiques ne s’accordent pas sur le volume de vocabulaire du HSK 3 : la version 2021 du programme en demande environ 2 245 mots, la révision de 2025 environ 1 000. Le choix est donc explicite plutôt que supposé."
          value={settings.examTrack}
          options={EXAM_TRACKS}
          labels={EXAM_TRACK_LABELS}
          onChange={(value) => {
            void update('examTrack', value)
          }}
        />
        <Segmented
          label="Écriture manuscrite"
          hint="Le nouveau HSK ne l’exige pas avant le niveau 5. Désactivée par défaut."
          value={settings.handwriting ? 'oui' : 'non'}
          options={['non', 'oui']}
          labels={{ non: 'Désactivée', oui: 'Activée' }}
          onChange={(value) => {
            void update('handwriting', value === 'oui')
          }}
        />
      </section>

      <section className="mb-6 rounded-2xl border p-5" style={card}>
        <h2 className="text-sm font-semibold">Rappel quotidien</h2>
        <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Une application web ne peut pas t’envoyer de notification quand elle est
          fermée : il faudrait un serveur de push. À la place, Mandarine fabrique un
          événement d’agenda qui se répète tous les jours. Tu l’ouvres une fois, et
          c’est ton téléphone qui te rappelle.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <span style={{ color: 'var(--text-muted)' }}>À</span>
            <input
              type="time"
              value={settings.reminderTime}
              onChange={(event) => {
                void update('reminderTime', event.target.value)
              }}
              className="min-h-11 rounded-xl border px-3 text-base"
              style={{
                background: 'var(--surface-raised)',
                borderColor: 'var(--border)',
                color: 'var(--text)',
              }}
            />
          </label>

          <button
            type="button"
            onClick={handleReminder}
            className="min-h-11 rounded-xl px-4 text-sm font-medium"
            style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
          >
            Ajouter à mon agenda
          </button>
        </div>
      </section>

      <section className="rounded-2xl border p-5" style={card}>
        <h2 className="text-sm font-semibold">Sauvegarde</h2>
        <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          {persistent === true
            ? 'Le navigateur garantit la conservation de tes données.'
            : 'Attention : Safari peut effacer les données d’un site qui n’est pas installé, après sept jours sans visite. Ajoute Mandarine à ton écran d’accueil, et exporte ta progression de temps en temps. Ton historique de révisions est la seule chose qui ne se régénère pas.'}
        </p>
        {settings.lastBackupAt !== null && (
          <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            Dernière sauvegarde : {new Date(settings.lastBackupAt).toLocaleString('fr-FR')}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              void handleExport()
            }}
            className="min-h-11 rounded-xl px-4 text-sm font-medium"
            style={{ background: 'var(--accent)', color: 'var(--accent-contrast)' }}
          >
            Exporter ma progression
          </button>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="min-h-11 rounded-xl border px-4 text-sm"
            style={{ borderColor: 'var(--border)' }}
          >
            Importer une sauvegarde
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file !== undefined) void handleImport(file)
              event.target.value = ''
            }}
          />
        </div>

        {message !== undefined && (
          <p className="mt-3 text-sm" aria-live="polite">
            {message}
          </p>
        )}
      </section>
    </div>
  )
}
