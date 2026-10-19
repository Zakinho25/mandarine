import type { Tone } from '@/domain/pinyin'
import type { ToneScheme } from '@/data/types'

export const TONE_SCHEME_LABELS: Record<ToneScheme, string> = {
  standard: 'Standard',
  daltonien: 'Adaptée au daltonisme',
  aucune: 'Sans couleur',
}

/** Variable CSS portant la couleur d'un ton ; voir `index.css`. */
export function toneColorVar(tone: Tone | undefined): string {
  return tone === undefined ? 'inherit' : `var(--tone-${String(tone)})`
}

export interface ToneDescription {
  readonly name: string
  /** Notation de Chao : hauteur de départ et d'arrivée, de 1 (bas) à 5 (haut). */
  readonly contour: string
  /** Repère articulatoire pour un francophone. */
  readonly hint: string
}

/**
 * Descriptions des tons, en français, avec un repère pour un francophone.
 *
 * Ces repères sont volontairement des analogies d'intonation française et non
 * des équivalences : le français n'a pas de tons lexicaux, aucune comparaison
 * n'est exacte. Elles servent d'amorce, l'oreille fait le reste.
 */
export const TONE_DESCRIPTIONS: Record<Tone, ToneDescription> = {
  1: {
    name: '1er ton — haut et plat',
    contour: '55',
    hint: 'Tenu haut, sans bouger, comme la note d’un diapason.',
  },
  2: {
    name: '2e ton — montant',
    contour: '35',
    hint: 'Monte comme dans « Quoi ? » quand on fait répéter.',
  },
  3: {
    name: '3e ton — descendant puis montant',
    contour: '214',
    hint: 'Creuse vers le bas puis remonte, comme un « bof… » hésitant.',
  },
  4: {
    name: '4e ton — descendant',
    contour: '51',
    hint: 'Tombe net et court, comme un « Stop ! » sec.',
  },
  5: {
    name: 'Ton neutre',
    contour: '—',
    hint: 'Bref, léger, sans hauteur propre : il s’efface derrière la syllabe précédente.',
  },
}
