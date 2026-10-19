import { splitNumbered, stripTone, toneOf } from './pinyin'
import type { Tone } from './toneMarks'

/**
 * Sandhi tonal : les tons que l'on écrit ne sont pas toujours ceux que l'on
 * prononce.
 *
 * Trois règles, et elles comptent énormément pour un francophone débutant :
 * 你好 s'écrit `nǐ hǎo` et se dit `ní hǎo`. Un apprenant qui lit le pinyin tel
 * quel apprend une prononciation fausse dès le premier mot.
 *
 * Cette fonction est pure et testée, comme le demande le cahier des charges.
 * Surtout, elle **renvoie la règle appliquée** et non seulement le résultat :
 * l'application doit pouvoir expliquer pourquoi le ton change, pas se
 * contenter de l'afficher.
 */

export const SANDHI_RULES = [
  'tiers_consecutifs',
  'demi_troisieme',
  'yi_devant_quatrieme',
  'yi_devant_autre',
  'bu_devant_quatrieme',
] as const
export type SandhiRule = (typeof SANDHI_RULES)[number]

export const SANDHI_EXPLANATIONS: Record<SandhiRule, string> = {
  tiers_consecutifs:
    'Deux troisièmes tons de suite : le premier se prononce comme un deuxième ton. ' +
    'Enchaîner deux tons descendants-montants est impossible à dire vite.',
  demi_troisieme:
    'Troisième ton suivi d’un autre ton : il ne remonte pas. On n’entend que la ' +
    'descente, grave et courte — c’est le « demi-troisième ton ».',
  yi_devant_quatrieme:
    '一 passe au deuxième ton devant un quatrième ton : yī devient yí.',
  yi_devant_autre:
    '一 passe au quatrième ton devant un premier, deuxième ou troisième ton : ' +
    'yī devient yì.',
  bu_devant_quatrieme:
    '不 passe au deuxième ton devant un quatrième ton : bù devient bú.',
}

export interface SandhiSyllable {
  /** Syllabe sans ton, par exemple `ni`. */
  readonly syllable: string
  /** Ton tel qu'il s'écrit, hors contexte. */
  readonly citationTone: Tone
  /** Ton tel qu'il se prononce dans ce mot. */
  readonly spokenTone: Tone
  /** Règle appliquée, pour pouvoir l'expliquer. `null` si rien ne change. */
  readonly rule: SandhiRule | null
}

export interface SandhiResult {
  readonly syllables: readonly SandhiSyllable[]
  /** `true` si au moins un ton prononcé diffère du ton écrit. */
  readonly changed: boolean
  /** Pinyin numéroté tel qu'il se prononce, par exemple `ni2 hao3`. */
  readonly spokenNumbered: string
  readonly rules: readonly SandhiRule[]
}

const YI = '一'
const BU = '不'

/**
 * Applique le sandhi tonal.
 *
 * `characters` est nécessaire pour les règles de 一 et 不, qui dépendent du
 * caractère et pas seulement du ton. Quand il manque, ou qu'il ne s'aligne pas
 * avec les syllabes, seules les règles tonales s'appliquent — on préfère un
 * résultat incomplet à un résultat inventé.
 *
 * ### Limite assumée
 * Pour trois troisièmes tons de suite, le découpage prosodique change le
 * résultat : 小老虎 se dit `xiǎo láo hǔ`, mais 我很好 se dit `wó hén hǎo`. Ce
 * découpage n'est pas dans les données. La règle appliquée ici est la plus
 * enseignée — tous les troisièmes tons d'une série deviennent deuxièmes sauf
 * le dernier — et c'est la bonne réponse pour les mots de deux syllabes, qui
 * sont l'immense majorité du vocabulaire HSK 1 à 3.
 */
export function applySandhi(numbered: string, characters?: string): SandhiResult {
  const parts = splitNumbered(numbered)
  const bases = parts.map((part) => stripTone(part))
  const citation = parts.map((part) => toneOf(part))

  const chars = characters === undefined ? [] : [...characters]
  const aligned = chars.length === parts.length

  const spoken = [...citation]
  const rules: (SandhiRule | null)[] = parts.map(() => null)

  // --- 一 et 不 : le ton dépend du caractère, pas seulement du ton voisin ---
  if (aligned) {
    for (let i = 0; i < parts.length; i += 1) {
      const character = chars[i]
      const next = citation[i + 1]

      if (character === YI) {
        // 一 isolé, ou en fin de mot (un ordinal comme 第一), garde son ton.
        if (next === undefined) continue
        if (next === 4) {
          spoken[i] = 2
          rules[i] = 'yi_devant_quatrieme'
        } else {
          spoken[i] = 4
          rules[i] = 'yi_devant_autre'
        }
      } else if (character === BU && next === 4) {
        spoken[i] = 2
        rules[i] = 'bu_devant_quatrieme'
      }
    }
  }

  // --- Troisièmes tons consécutifs ---
  // On parcourt les tons écrits : 一 et 不 ne deviennent jamais troisièmes,
  // les deux passes sont donc indépendantes.
  for (let i = 0; i < citation.length - 1; i += 1) {
    if (citation[i] === 3 && citation[i + 1] === 3 && rules[i] === null) {
      spoken[i] = 2
      rules[i] = 'tiers_consecutifs'
    }
  }

  // --- Demi-troisième ton ---
  // Information de prononciation, pas changement de ton : la syllabe reste au
  // troisième ton mais ne remonte pas.
  for (let i = 0; i < citation.length; i += 1) {
    const next = citation[i + 1]
    if (spoken[i] === 3 && next !== undefined && next !== 3 && rules[i] === null) {
      rules[i] = 'demi_troisieme'
    }
  }

  const syllables: SandhiSyllable[] = bases.map((syllable, i) => ({
    syllable,
    citationTone: citation[i] ?? 5,
    spokenTone: spoken[i] ?? 5,
    rule: rules[i] ?? null,
  }))

  return {
    syllables,
    changed: syllables.some((s) => s.spokenTone !== s.citationTone),
    spokenNumbered: syllables
      .map((s) => `${s.syllable}${String(s.spokenTone)}`)
      .join(' '),
    rules: [...new Set(rules.filter((rule): rule is SandhiRule => rule !== null))],
  }
}
