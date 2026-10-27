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
 * Compétences pour lesquelles une carte est créée, sur tous les appareils.
 *
 * La création ne dépend pas du matériel, et c'est voulu : une sauvegarde
 * exportée depuis le téléphone doit pouvoir être relue sur l'ordinateur
 * sans que des cartes y manquent. C'est la **sélection** qui tient compte
 * de ce que l'appareil sait faire, pas le stockage.
 */
export const SKILLS_PLANIFIEES: readonly CardSkill[] = ['zh_fr', 'fr_zh', 'audio_fr']

/** Compétences qui ont besoin d’une voix chinoise installée. */
export const SKILLS_SONORES: readonly CardSkill[] = ['audio_fr', 'tone']

/**
 * Compétences qui définissent la **maîtrise** d'un mot.
 *
 * L'écoute n'en fait pas partie, et ce n'est pas un oubli. Si elle comptait,
 * le compteur de mots maîtrisés vaudrait autre chose selon l'appareil — il
 * s'effondrerait sur une machine sans voix chinoise, pour une raison qui n'a
 * rien à voir avec ce que l'utilisateur sait. La définition reste donc
 * « reconnaître et produire », identique partout et comparable dans le temps.
 * L'écoute ajoute de l'entraînement, elle ne déplace pas la cible.
 */
export const ACTIVE_SKILLS: readonly CardSkill[] = ['zh_fr', 'fr_zh']

/**
 * Compétences révisables sur cet appareil.
 *
 * Sans voix chinoise, une carte d'écoute est une carte muette : elle ne
 * teste rien et bloque la session. On l'écarte de la file plutôt que de ne
 * pas la créer.
 */
export function skillsRevisables(aUneVoix: boolean): readonly CardSkill[] {
  if (aUneVoix) return SKILLS_PLANIFIEES
  return SKILLS_PLANIFIEES.filter((skill) => !SKILLS_SONORES.includes(skill))
}

/*
 * `tone` et `write` restent hors de la planification, pour deux raisons
 * différentes. `tone` ferait double emploi avec le module de prononciation,
 * qui entraîne déjà l'identification des tons avec de meilleurs outils qu'une
 * carte. `write` demande un apprentissage à part entière, et le programme du
 * HSK 3.0 n'exige pas l'écriture manuscrite à ce niveau.
 */

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
  skills: readonly CardSkill[] = SKILLS_PLANIFIEES,
): CardSeed[] {
  return skills.map((skill) => ({
    key: cardKey('lexeme', lexemeId, skill),
    targetKind: 'lexeme' as const,
    targetId: lexemeId,
    skill,
  }))
}
