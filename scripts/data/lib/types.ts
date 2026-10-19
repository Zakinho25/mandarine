import type { PartOfSpeech } from './pos.ts'

/** Entrée du 《新版HSK考试大纲》 de novembre 2025 — fait autorité sur les niveaux. */
export interface SyllabusEntry {
  readonly id: number
  /** 1 à 6, et 7 pour la bande 7-9 que le syllabus ne subdivise pas. */
  readonly level: number
  readonly levelLabel: string
  readonly simplified: string
  /** Pinyin à diacritiques, tel qu'imprimé dans le syllabus. */
  readonly pinyinMark: string
  readonly pos: readonly PartOfSpeech[]
  /** Rang de l'homographe, quand le syllabus distingue deux entrées identiques. */
  readonly homograph: number | null
  readonly sourcePdfPage: number
}

/** Entrée du standard GF 0025-2021 — source des métadonnées. */
export interface StandardEntry {
  readonly id: string
  readonly simplified: string
  readonly traditional: string | null
  readonly pinyinMark: string
  readonly posLatin: string
  readonly level: number
  /** Pinyin numéroté, extrait de la clé CEDICT. Forme canonique du projet. */
  readonly pinyinNum: string | null
}

export interface DictEntry {
  readonly traditional: string
  readonly simplified: string
  readonly pinyinNum: string
  readonly definitions: readonly string[]
}
