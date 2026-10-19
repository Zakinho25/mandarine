import { useEffect, useState } from 'react'
import {
  CONTENT_STATUS_LABELS,
  loadContentFile,
  type ContentFile,
} from '@/data/content'
import type { Tone } from '@/domain/pinyin'
import { Pinyin } from '@/ui/Pinyin'
import { TONE_DESCRIPTIONS, toneColorVar } from '@/ui/tones'

const TONES: readonly Tone[] = [1, 2, 3, 4, 5]

export function ParcoursScreen() {
  const [content, setContent] = useState<ContentFile | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    loadContentFile('demo-hsk1.json')
      .then((file) => {
        if (!cancelled) setContent(file)
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : String(cause))
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Mandarine</h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          Du premier ton au HSK 3, en français.
        </p>
      </header>

      {/* Progression : des zéros honnêtes plutôt qu'une démonstration flatteuse. */}
      <section
        className="mb-8 rounded-2xl border p-5"
        style={{ background: 'var(--surface-raised)', borderColor: 'var(--border)' }}
      >
        <h2 className="mb-4 text-sm font-semibold tracking-wide uppercase">
          Ta progression
        </h2>
        <dl className="grid grid-cols-3 gap-4 text-center">
          {[
            { label: 'mots maîtrisés', value: '0' },
            { label: 'minutes d’écoute', value: '0' },
            { label: 'jours de suite', value: '0' },
          ].map((stat) => (
            // `flex-col-reverse` affiche le chiffre au-dessus du libellé tout
            // en gardant l'ordre `dt` puis `dd` dans le document, qui est ce
            // qu'attend un lecteur d'écran.
            <div key={stat.label} className="flex flex-col-reverse">
              <dt className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                {stat.label}
              </dt>
              <dd className="text-2xl font-semibold">{stat.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          Ces compteurs resteront à zéro jusqu’au jalon 3, qui apporte les révisions.
          L’estimation de la date d’atteinte du HSK 3 n’apparaîtra qu’après quatorze
          jours d’usage réel : une projection faite sur trois jours de données ne
          voudrait rien dire.
        </p>
      </section>

      {/* Vérifie le rendu de la police chinoise, du pinyin et des couleurs de tons. */}
      <section className="mb-8">
        <div className="mb-3 flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-wide uppercase">Vocabulaire</h2>
          {content !== undefined && (
            <span
              className="rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{ background: 'var(--surface-sunken)', color: 'var(--text-muted)' }}
            >
              {CONTENT_STATUS_LABELS[content.contentStatus]}
            </span>
          )}
        </div>

        {error !== undefined && (
          <p className="text-sm" style={{ color: 'var(--tone-1)' }}>
            {error}
          </p>
        )}
        {content === undefined && error === undefined && (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Chargement du contenu…
          </p>
        )}

        {content !== undefined && (
          <>
            <ul
              className="divide-y overflow-hidden rounded-2xl border"
              style={{
                background: 'var(--surface-raised)',
                borderColor: 'var(--border)',
              }}
            >
              {content.lexemes.map((lexeme) => (
                <li
                  key={lexeme.id}
                  className="flex items-center gap-4 px-5 py-4"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <span className="hanzi text-3xl">{lexeme.simplified}</span>
                  <span className="min-w-0 flex-1">
                    <Pinyin numbered={lexeme.pinyinNum} className="block text-sm" />
                    <span className="block text-sm" style={{ color: 'var(--text-muted)' }}>
                      {lexeme.glossFr}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            {content.note !== undefined && (
              <p
                className="mt-3 text-xs leading-relaxed"
                style={{ color: 'var(--text-muted)' }}
              >
                {content.note}
              </p>
            )}
          </>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold tracking-wide uppercase">
          Les cinq tons
        </h2>
        <ul
          className="divide-y overflow-hidden rounded-2xl border"
          style={{ background: 'var(--surface-raised)', borderColor: 'var(--border)' }}
        >
          {TONES.map((tone) => {
            const description = TONE_DESCRIPTIONS[tone]
            return (
              <li key={tone} className="px-5 py-4" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-baseline gap-3">
                  <span
                    className="hanzi text-2xl font-semibold"
                    style={{ color: toneColorVar(tone) }}
                  >
                    <Pinyin numbered={`ma${String(tone)}`} />
                  </span>
                  <span className="text-sm font-medium">{description.name}</span>
                  <span
                    className="ml-auto font-mono text-xs"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {description.contour}
                  </span>
                </div>
                <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)' }}>
                  {description.hint}
                </p>
              </li>
            )
          })}
        </ul>
        <p className="mt-3 text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
          La couleur n’est qu’un renfort : le diacritique reste toujours affiché, et une
          palette sans couleur est disponible dans les réglages.
        </p>
      </section>
    </div>
  )
}
