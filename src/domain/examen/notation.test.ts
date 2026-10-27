import { describe, expect, it } from 'vitest'
import { vivierDeTest } from './fixture'
import { SEUIL_REUSSITE_PCT } from './format'
import { genererExamen, itemsDe, type Examen } from './generation'
import { appreciation, corriger, type Reponses } from './notation'

const CREE_A = '2026-03-01T10:00:00.000Z'
const FINI_A = '2026-03-01T10:35:00.000Z'

function examen(seed = 1): Examen {
  return genererExamen(vivierDeTest(), {
    level: 1,
    longueur: 'court',
    seed,
    creeA: CREE_A,
  })
}

/** Répond juste à la proportion demandée des items, dans l'ordre. */
function repondre(sujet: Examen, justesse: (index: number) => boolean): Reponses {
  const reponses: Record<string, string | null> = {}
  for (const [index, item] of itemsDe(sujet).entries()) {
    const faux = item.choix.find((choix) => choix.id !== item.bonne)
    reponses[item.id] = justesse(index) ? item.bonne : (faux?.id ?? null)
  }
  return reponses
}

describe('corriger', () => {
  it('donne 100 % à un sans-faute', () => {
    const sujet = examen()
    const resultat = corriger(sujet, repondre(sujet, () => true), FINI_A)
    expect(resultat.pourcentage).toBe(100)
    expect(resultat.justes).toBe(resultat.posees)
    expect(resultat.reussi).toBe(true)
    expect(resultat.pointsFaibles).toEqual([])
    expect(resultat.motsRates).toEqual([])
  })

  it('donne 0 % à un sans-réussite', () => {
    const sujet = examen()
    const resultat = corriger(sujet, repondre(sujet, () => false), FINI_A)
    expect(resultat.pourcentage).toBe(0)
    expect(resultat.reussi).toBe(false)
  })

  it('compte une absence de réponse comme une faute', () => {
    const sujet = examen()
    const resultat = corriger(sujet, {}, FINI_A)
    expect(resultat.justes).toBe(0)
    expect(resultat.sansReponse).toBe(resultat.posees)
    expect(resultat.pourcentage).toBe(0)
  })

  it('distingue les deux sections', () => {
    const sujet = examen()
    const ecoute = new Set(
      sujet.parties
        .filter((partie) => partie.id.startsWith('ecoute'))
        .flatMap((partie) => partie.items.map((item) => item.id)),
    )
    const reponses: Record<string, string> = {}
    for (const item of itemsDe(sujet)) {
      const faux = item.choix.find((choix) => choix.id !== item.bonne)
      reponses[item.id] = ecoute.has(item.id) ? item.bonne : (faux?.id ?? item.bonne)
    }

    const resultat = corriger(sujet, reponses, FINI_A)
    const parSection = new Map(resultat.sections.map((score) => [score.section, score]))
    expect(parSection.get('ecoute')?.pourcentage).toBe(100)
    expect(parSection.get('lecture')?.pourcentage).toBe(0)
  })

  it('arrondit le pourcentage au plus proche', () => {
    const sujet = examen()
    // Une bonne réponse sur trois items donne 33 %, pas 33,33.
    const resultat = corriger(sujet, repondre(sujet, (index) => index % 3 === 0), FINI_A)
    expect(Number.isInteger(resultat.pourcentage)).toBe(true)
  })

  it('place le seuil de réussite à 60 %', () => {
    const sujet = examen()
    const total = itemsDe(sujet).length
    const justes = Math.ceil((total * SEUIL_REUSSITE_PCT) / 100)
    const resultat = corriger(sujet, repondre(sujet, (index) => index < justes), FINI_A)
    expect(resultat.pourcentage).toBeGreaterThanOrEqual(SEUIL_REUSSITE_PCT)
    expect(resultat.reussi).toBe(true)
  })

  it('ne déclare pas réussi un examen sans item', () => {
    const vide = genererExamen(
      { mots: [], phrases: [], echanges: [], passages: [], marqueurs: [] },
      { level: 1, longueur: 'court', seed: 1, creeA: CREE_A },
    )
    const resultat = corriger(vide, {}, FINI_A)
    expect(resultat.posees).toBe(0)
    expect(resultat.reussi).toBe(false)
    expect(resultat.pourcentage).toBe(0)
  })

  it('relève les points de grammaire ratés, les plus manqués d’abord', () => {
    const sujet = examen(4)
    const resultat = corriger(sujet, repondre(sujet, () => false), FINI_A)
    const avecPoint = itemsDe(sujet).filter((item) => item.pointId !== null)
    if (avecPoint.length === 0) return

    expect(resultat.pointsFaibles.length).toBeGreaterThan(0)
    for (const faible of resultat.pointsFaibles) {
      expect(faible.rates).toBeGreaterThan(0)
      expect(faible.poses).toBeGreaterThanOrEqual(faible.rates)
    }
    const rates = resultat.pointsFaibles.map((faible) => faible.rates)
    expect([...rates].sort((a, b) => b - a)).toEqual(rates)
  })

  it('ne signale pas un point de grammaire réussi', () => {
    const sujet = examen(4)
    const resultat = corriger(sujet, repondre(sujet, () => true), FINI_A)
    expect(resultat.pointsFaibles).toEqual([])
  })

  it('ne verse pas le vocabulaire d’un passage raté dans les mots à revoir', () => {
    // Un passage raté ne désigne aucun mot : y verser tout son vocabulaire
    // noierait les vraies erreurs.
    const sujet = examen(6)
    const passages = sujet.parties.find((partie) => partie.id === 'lecture-passage')
    const rate = passages?.items[0]
    if (rate === undefined) return

    // Tout est juste sauf ce passage : s'il versait son vocabulaire, la liste
    // ne serait pas vide.
    const reponses: Record<string, string | null> = {}
    for (const item of itemsDe(sujet)) {
      const faux = item.choix.find((choix) => choix.id !== item.bonne)
      reponses[item.id] = item.id === rate.id ? (faux?.id ?? null) : item.bonne
    }

    const resultat = corriger(sujet, reponses, FINI_A)
    expect(rate.lexemeIds.length).toBeGreaterThan(0)
    expect(resultat.motsRates).toEqual([])
  })

  it('remet en file les mots d’un item de vocabulaire raté', () => {
    const sujet = examen(6)
    const item = sujet.parties.find((partie) => partie.id === 'ecoute-mot')?.items[0]
    if (item === undefined) return

    const faux = item.choix.find((choix) => choix.id !== item.bonne)
    const resultat = corriger(sujet, { [item.id]: faux?.id ?? null }, FINI_A)
    expect(resultat.motsRates).toContain(item.bonne)
  })

  it('reporte les items manquants sur le score de la partie', () => {
    const maigre = genererExamen(vivierDeTest({ echanges: 1 }), {
      level: 1,
      longueur: 'complet',
      seed: 1,
      creeA: CREE_A,
    })
    const resultat = corriger(maigre, {}, FINI_A)
    const echange = resultat.parties.find((partie) => partie.id === 'ecoute-echange')
    expect(echange?.manquants).toBeGreaterThan(0)
  })

  it('conserve l’identité de l’examen corrigé', () => {
    const sujet = examen(8)
    const resultat = corriger(sujet, {}, FINI_A)
    expect(resultat.examenId).toBe(sujet.id)
    expect(resultat.seed).toBe(8)
    expect(resultat.termineA).toBe(FINI_A)
  })
})

describe('appreciation', () => {
  it('monte avec le score', () => {
    expect(appreciation(95)).not.toBe(appreciation(50))
  })

  it('couvre tout l’intervalle', () => {
    for (const pct of [0, 25, 45, 61, 80, 100]) {
      expect(appreciation(pct).length, String(pct)).toBeGreaterThan(0)
    }
  })
})
