/**
 * Les compétences évaluées, et les cartes qui en découlent.
 *
 * Un mot n'est pas « su » ou « pas su » : on peut reconnaître 学习 à l'écrit
 * sans savoir le produire, et le comprendre à l'oral sans le reconnaître
 * écrit. Chaque compétence a donc sa propre carte, avec sa propre
 * planification — c'est l'exigence du cahier des charges, et c'est ce qui
 * évite de réviser inutilement ce qui est déjà acquis dans un sens.
 */

export const CARD_SKILLS = ['zh_fr', 'fr_zh', 'audio_fr', 'tone', 'write'] as const
export type CardSkill = (typeof CARD_SKILLS)[number]

export const CARD_TARGET_KINDS = ['lexeme', 'hanzi', 'sentence', 'tone_pair'] as const
export type CardTargetKind = (typeof CARD_TARGET_KINDS)[number]

export const SKILL_LABELS: Record<CardSkill, string> = {
  zh_fr: 'Reconnaître',
  fr_zh: 'Produire',
  audio_fr: 'Comprendre à l’oral',
  tone: 'Identifier le ton',
  write: 'Écrire',
}

export const SKILL_PROMPTS: Record<CardSkill, string> = {
  zh_fr: 'Que veut dire ce mot ?',
  fr_zh: 'Écris le pinyin de ce mot',
  audio_fr: 'Qu’as-tu entendu ?',
  tone: 'Quel ton entends-tu ?',
  write: 'Trace ce caractère',
}

/**
 * Compétences effectivement révisées aujourd'hui.
 *
 * `audio_fr` et `tone` attendent le module audio du jalon 4 : une carte
 * d'écoute sans son fiable serait une carte cassée. `write` reste désactivée,
 * le nouveau HSK n'exigeant pas l'écriture manuscrite avant le niveau 5.
 */
export const ACTIVE_SKILLS: readonly CardSkill[] = ['zh_fr', 'fr_zh']

/**
 * Clé stable d'une carte : même cible, même compétence, même carte.
 *
 * Elle ne contient aucune donnée de progression, ce qui permet de la
 * recalculer à tout moment sans risquer de créer un doublon.
 */
export function cardKey(
  targetKind: CardTargetKind,
  targetId: string,
  skill: CardSkill,
): string {
  return `${targetKind}:${targetId}:${skill}`
}

export interface CardSeed {
  readonly key: string
  readonly targetKind: CardTargetKind
  readonly targetId: string
  readonly skill: CardSkill
}

/** Les cartes à créer pour un mot, une par compétence active. */
export function seedsForLexeme(
  lexemeId: string,
  skills: readonly CardSkill[] = ACTIVE_SKILLS,
): CardSeed[] {
  return skills.map((skill) => ({
    key: cardKey('lexeme', lexemeId, skill),
    targetKind: 'lexeme' as const,
    targetId: lexemeId,
    skill,
  }))
}
