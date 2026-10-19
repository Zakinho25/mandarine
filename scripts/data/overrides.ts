/**
 * Corrections écrites à la main.
 *
 * CFDICT couvre 99,5 % du vocabulaire des niveaux 1 à 3. Le reste est corrigé
 * ici, explicitement, plutôt que laissé vide ou deviné par un appariement de
 * plus en plus permissif. Chaque entrée dit pourquoi elle existe.
 *
 * Ces définitions sont rédigées, pas importées : elles portent le statut
 * `reviewed_human` dans le contenu généré.
 */

export interface Override {
  readonly simplified: string
  /** Pinyin du syllabus, pour viser le bon homographe le cas échéant. */
  readonly pinyinMark?: string
  /** Pinyin numéroté sous sa forme de citation, **avant** sandhi tonal. */
  readonly pinyinNum?: string
  readonly glossFr?: readonly string[]
  readonly reason: string
}

export const OVERRIDES: readonly Override[] = [
  // --- Définitions absentes de CFDICT --------------------------------------
  {
    simplified: '好玩儿',
    pinyinNum: 'hao3 wan2 r5',
    glossFr: ['amusant', 'distrayant', 'rigolo'],
    reason: 'Absent de CFDICT, y compris sous la forme sans érhua 好玩.',
  },
  {
    simplified: '岁',
    pinyinNum: 'sui4',
    glossFr: ['an', 'année (pour l’âge)'],
    reason:
      'CFDICT ne donne pas d’entrée exploitable pour ce classificateur, pourtant' +
      ' indispensable dès le niveau 1 (« j’ai vingt ans »).',
  },
  {
    simplified: '高铁',
    pinyinNum: 'gao1 tie3',
    glossFr: ['train à grande vitesse', 'TGV chinois'],
    reason: 'Mot récent, absent de CFDICT.',
  },
  {
    simplified: '后年',
    pinyinNum: 'hou4 nian2',
    glossFr: ['dans deux ans', 'l’année suivant la prochaine'],
    reason: 'Absent de CFDICT.',
  },
  {
    simplified: '检票',
    pinyinNum: 'jian3 piao4',
    glossFr: ['contrôler les billets', 'poinçonner un billet'],
    reason: 'Absent de CFDICT, et pinyin numéroté introuvable ailleurs.',
  },

  // --- Pinyin numéroté seul -------------------------------------------------
  // Le dictionnaire note ces mots avec un ton neutre là où le syllabus note un
  // ton plein. On retient la forme du syllabus, qui fait autorité ici.
  {
    simplified: '那里',
    pinyinNum: 'na4 li3',
    reason: 'CFDICT note la seconde syllabe au ton neutre ; le syllabus donne le ton 3.',
  },
  {
    simplified: '起来',
    pinyinNum: 'qi3 lai2',
    reason: 'CFDICT note `lai5` ; le syllabus donne `lái`, ton 2.',
  },

  // --- Sandhi du 一 ---------------------------------------------------------
  // Le syllabus imprime le pinyin **après** sandhi : 一下 s'y lit `yíxià`.
  // On stocke la forme de citation `yi1 xia4`, et c'est la fonction de sandhi
  // du jalon 4 qui produira la prononciation réelle. Stocker la forme déjà
  // transformée rendrait la règle invisible et impossible à enseigner.
  {
    simplified: '一下',
    pinyinNum: 'yi1 xia4',
    reason: 'Forme de citation ; le `yí` du syllabus est le résultat du sandhi de 一.',
  },
  {
    simplified: '一会儿',
    pinyinNum: 'yi1 hui4 r5',
    reason: 'Forme de citation ; même sandhi de 一 que 一下.',
  },
]

export function overrideKey(simplified: string, pinyinMark?: string): string {
  return pinyinMark === undefined ? simplified : `${simplified}\u0000${pinyinMark}`
}
