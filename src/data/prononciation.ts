/**
 * Table des sons du mandarin, expliquée pour un francophone.
 *
 * Contenu rédigé, pas importé : il porte le statut `reviewed_human`.
 *
 * Les comparaisons au français sont des **amorces**, pas des équivalences. Le
 * français n'a ni tons ni rétroflexes ; aucune analogie n'est exacte. Elles
 * servent à placer la langue au bon endroit la première fois, l'oreille fait
 * le reste. Les pièges signalés sont ceux qui, non corrigés, s'installent pour
 * des années : `x` lu comme « ch », `r` lu comme un r français, `e` lu comme
 * un e français.
 */

export interface SoundEntry {
  /** Le son lui-même, en pinyin. */
  readonly sound: string
  /** Caractère donné à lire à la synthèse vocale. */
  readonly example: string
  readonly examplePinyin: string
  readonly exampleGloss: string
  /** Piège ou repère pour un francophone. `null` quand il n'y a rien à dire. */
  readonly note: string | null
}

export interface SoundGroup {
  readonly title: string
  readonly intro: string
  readonly entries: readonly SoundEntry[]
}

export const INITIAL_GROUPS: readonly SoundGroup[] = [
  {
    title: 'b p m f',
    intro:
      'La différence entre b et p n’est pas celle du français. Les deux sont sourds : ' +
      'ce qui les oppose, c’est le souffle. Mets ta main devant ta bouche — p la fait ' +
      'bouger, b non.',
    entries: [
      { sound: 'b', example: '八', examplePinyin: 'ba1', exampleGloss: 'huit', note: 'Sans souffle, proche du p de « papa ».' },
      { sound: 'p', example: '跑', examplePinyin: 'pao3', exampleGloss: 'courir', note: 'Avec un souffle net, comme en anglais « pen ».' },
      { sound: 'm', example: '妈', examplePinyin: 'ma1', exampleGloss: 'maman', note: null },
      { sound: 'f', example: '饭', examplePinyin: 'fan4', exampleGloss: 'repas', note: null },
    ],
  },
  {
    title: 'd t n l',
    intro: 'Même opposition de souffle entre d et t qu’entre b et p.',
    entries: [
      { sound: 'd', example: '大', examplePinyin: 'da4', exampleGloss: 'grand', note: 'Sans souffle, proche du t de « table ».' },
      { sound: 't', example: '天', examplePinyin: 'tian1', exampleGloss: 'ciel, jour', note: 'Avec souffle.' },
      { sound: 'n', example: '你', examplePinyin: 'ni3', exampleGloss: 'tu', note: null },
      { sound: 'l', example: '来', examplePinyin: 'lai2', exampleGloss: 'venir', note: null },
    ],
  },
  {
    title: 'g k h',
    intro: 'g et k suivent la même règle du souffle. h, lui, n’a pas d’équivalent français.',
    entries: [
      { sound: 'g', example: '高', examplePinyin: 'gao1', exampleGloss: 'haut', note: 'Sans souffle, proche du k de « car ».' },
      { sound: 'k', example: '看', examplePinyin: 'kan4', exampleGloss: 'regarder', note: 'Avec souffle.' },
      {
        sound: 'h',
        example: '好',
        examplePinyin: 'hao3',
        exampleGloss: 'bien',
        note: 'Raclé au fond de la gorge, comme la jota espagnole. Surtout pas le h muet du français.',
      },
    ],
  },
  {
    title: 'j q x',
    intro:
      'La série la plus mal prononcée par les francophones. La pointe de la langue ' +
      'reste derrière les dents du bas, le dos de la langue monte vers le palais. ' +
      'Ces trois sons ne sont jamais suivis de ou, o ou e : après eux, un u écrit se lit ü.',
    entries: [
      { sound: 'j', example: '家', examplePinyin: 'jia1', exampleGloss: 'maison', note: 'Entre « di » et « dj », langue à plat. Pas le j de « jour ».' },
      { sound: 'q', example: '七', examplePinyin: 'qi1', exampleGloss: 'sept', note: 'Le même avec un souffle. Pas « k », jamais.' },
      {
        sound: 'x',
        example: '西',
        examplePinyin: 'xi1',
        exampleGloss: 'ouest',
        note: 'Un s mouillé, langue à plat et étalée. Le dire « ch » est le piège numéro un.',
      },
    ],
  },
  {
    title: 'zh ch sh r',
    intro:
      'Les rétroflexes : la pointe de la langue se retrousse vers l’arrière du palais. ' +
      'Le français n’a rien de tel — c’est l’articulation à travailler le plus longtemps.',
    entries: [
      { sound: 'zh', example: '中', examplePinyin: 'zhong1', exampleGloss: 'milieu, Chine', note: 'Comme « dj » mais langue retroussée, sans souffle.' },
      { sound: 'ch', example: '吃', examplePinyin: 'chi1', exampleGloss: 'manger', note: 'Le même avec un souffle.' },
      { sound: 'sh', example: '书', examplePinyin: 'shu1', exampleGloss: 'livre', note: 'Un « ch » langue retroussée, plus sourd que le ch français.' },
      {
        sound: 'r',
        example: '热',
        examplePinyin: 're4',
        exampleGloss: 'chaud',
        note: 'Rien à voir avec le r français. Pars du j de « jour », retrousse la langue et ne fais pas vibrer la gorge.',
      },
    ],
  },
  {
    title: 'z c s',
    intro: 'Sifflantes, langue à plat derrière les dents du bas.',
    entries: [
      { sound: 'z', example: '坐', examplePinyin: 'zuo4', exampleGloss: 's’asseoir', note: 'Comme « dz » dans « adzuki ».' },
      { sound: 'c', example: '菜', examplePinyin: 'cai4', exampleGloss: 'plat, légume', note: 'Comme « ts » dans « tsé-tsé ». Jamais « k » ni « s ».' },
      { sound: 's', example: '三', examplePinyin: 'san1', exampleGloss: 'trois', note: null },
    ],
  },
]

export const FINAL_GROUPS: readonly SoundGroup[] = [
  {
    title: 'Voyelles simples',
    intro: 'Trois d’entre elles n’existent pas telles quelles en français.',
    entries: [
      { sound: 'a', example: '他', examplePinyin: 'ta1', exampleGloss: 'il', note: null },
      { sound: 'o', example: '我', examplePinyin: 'wo3', exampleGloss: 'je', note: null },
      {
        sound: 'e',
        example: '喝',
        examplePinyin: 'he1',
        exampleGloss: 'boire',
        note: 'Un « eu » prononcé au fond, bouche à peine ouverte. Pas le é ni le è français.',
      },
      { sound: 'i', example: '你', examplePinyin: 'ni3', exampleGloss: 'tu', note: null },
      { sound: 'u', example: '不', examplePinyin: 'bu4', exampleGloss: 'ne… pas', note: 'Comme « ou », jamais comme le u de « tu ».' },
      {
        sound: 'ü',
        example: '女',
        examplePinyin: 'nü3',
        exampleGloss: 'femme',
        note: 'Le u de « tu ». C’est le seul son chinois que tu possèdes déjà — profites-en.',
      },
      {
        sound: 'i (après zh ch sh r z c s)',
        example: '吃',
        examplePinyin: 'chi1',
        exampleGloss: 'manger',
        note: 'Ce i-là ne se prononce pas « i » : c’est un bourdonnement qui prolonge la consonne.',
      },
    ],
  },
  {
    title: 'Diphtongues',
    intro: 'Deux voyelles enchaînées, la première plus longue.',
    entries: [
      { sound: 'ai', example: '爱', examplePinyin: 'ai4', exampleGloss: 'aimer', note: 'Comme « aïe ».' },
      { sound: 'ei', example: '杯', examplePinyin: 'bei1', exampleGloss: 'verre', note: 'Comme « eille » dans « bouteille ».' },
      { sound: 'ao', example: '好', examplePinyin: 'hao3', exampleGloss: 'bien', note: 'Comme « aou », pas « o ».' },
      { sound: 'ou', example: '走', examplePinyin: 'zou3', exampleGloss: 'marcher', note: 'Comme « ô-ou ».' },
      { sound: 'ia', example: '家', examplePinyin: 'jia1', exampleGloss: 'maison', note: null },
      { sound: 'ie', example: '谢', examplePinyin: 'xie4', exampleGloss: 'remercier', note: 'Comme « ié », pas « i-eu ».' },
      { sound: 'uo', example: '说', examplePinyin: 'shuo1', exampleGloss: 'parler', note: null },
      { sound: 'üe', example: '学', examplePinyin: 'xue2', exampleGloss: 'étudier', note: 'u français puis « é », d’un seul geste.' },
    ],
  },
  {
    title: 'Finales nasales',
    intro:
      'La difficulté française par excellence : -n et -ng sont deux sons différents, ' +
      'et le français ne fait pas la distinction. -n se termine langue contre les dents, ' +
      '-ng bouche ouverte, son dans le nez.',
    entries: [
      { sound: 'an', example: '看', examplePinyin: 'kan4', exampleGloss: 'regarder', note: 'Langue aux dents à la fin.' },
      { sound: 'ang', example: '忙', examplePinyin: 'mang2', exampleGloss: 'occupé', note: 'Bouche ouverte, rien ne touche.' },
      { sound: 'en', example: '很', examplePinyin: 'hen3', exampleGloss: 'très', note: null },
      { sound: 'eng', example: '冷', examplePinyin: 'leng3', exampleGloss: 'froid', note: null },
      { sound: 'in', example: '新', examplePinyin: 'xin1', exampleGloss: 'nouveau', note: null },
      { sound: 'ing', example: '听', examplePinyin: 'ting1', exampleGloss: 'écouter', note: null },
      {
        sound: 'ian',
        example: '天',
        examplePinyin: 'tian1',
        exampleGloss: 'ciel, jour',
        note: 'Se dit « ienn », pas « iane ».',
      },
      { sound: 'ong', example: '中', examplePinyin: 'zhong1', exampleGloss: 'milieu', note: 'Comme « oung ».' },
      { sound: 'un', example: '春', examplePinyin: 'chun1', exampleGloss: 'printemps', note: null },
      { sound: 'ün', example: '云', examplePinyin: 'yun2', exampleGloss: 'nuage', note: null },
    ],
  },
  {
    title: 'Le cas de er',
    intro: 'Une finale à elle seule, et le suffixe qui transforme les autres.',
    entries: [
      { sound: 'er', example: '二', examplePinyin: 'er4', exampleGloss: 'deux', note: 'Un « eu » avec la langue retroussée en cours de route.' },
      {
        sound: '-r (érhua)',
        example: '一点儿',
        examplePinyin: 'yi1 dian3 r5',
        exampleGloss: 'un peu',
        note: 'Suffixe très courant à Pékin : il retrousse la fin de la syllabe.',
      },
    ],
  },
]

export interface ToneSetEntry {
  readonly tone: 1 | 2 | 3 | 4
  readonly character: string
  readonly pinyinNum: string
  readonly gloss: string
}

export interface ToneSet {
  /** Syllabe sans ton, commune aux quatre caractères. */
  readonly syllable: string
  readonly entries: readonly ToneSetEntry[]
}

/**
 * Séries minimales : la même syllabe aux quatre tons, avec un caractère réel
 * pour chacun.
 *
 * Indispensable parce que la synthèse vocale lit des caractères, pas du
 * pinyin : pour faire entendre `ma3` isolément, il faut lui donner 马. Ces
 * séries servent au module d'écoute et aux exercices d'identification.
 */
export const TONE_SETS: readonly ToneSet[] = [
  {
    syllable: 'ma',
    entries: [
      { tone: 1, character: '妈', pinyinNum: 'ma1', gloss: 'maman' },
      { tone: 2, character: '麻', pinyinNum: 'ma2', gloss: 'chanvre' },
      { tone: 3, character: '马', pinyinNum: 'ma3', gloss: 'cheval' },
      { tone: 4, character: '骂', pinyinNum: 'ma4', gloss: 'insulter' },
    ],
  },
  {
    syllable: 'ba',
    entries: [
      { tone: 1, character: '八', pinyinNum: 'ba1', gloss: 'huit' },
      { tone: 2, character: '拔', pinyinNum: 'ba2', gloss: 'arracher' },
      { tone: 3, character: '把', pinyinNum: 'ba3', gloss: 'poignée' },
      { tone: 4, character: '爸', pinyinNum: 'ba4', gloss: 'papa' },
    ],
  },
  {
    syllable: 'shu',
    entries: [
      { tone: 1, character: '书', pinyinNum: 'shu1', gloss: 'livre' },
      { tone: 2, character: '熟', pinyinNum: 'shu2', gloss: 'cuit, mûr' },
      { tone: 3, character: '数', pinyinNum: 'shu3', gloss: 'compter' },
      { tone: 4, character: '树', pinyinNum: 'shu4', gloss: 'arbre' },
    ],
  },
  {
    syllable: 'tang',
    entries: [
      { tone: 1, character: '汤', pinyinNum: 'tang1', gloss: 'soupe' },
      { tone: 2, character: '糖', pinyinNum: 'tang2', gloss: 'sucre' },
      { tone: 3, character: '躺', pinyinNum: 'tang3', gloss: 's’allonger' },
      { tone: 4, character: '烫', pinyinNum: 'tang4', gloss: 'brûlant' },
    ],
  },
  {
    syllable: 'xi',
    entries: [
      { tone: 1, character: '西', pinyinNum: 'xi1', gloss: 'ouest' },
      { tone: 2, character: '习', pinyinNum: 'xi2', gloss: 's’exercer' },
      { tone: 3, character: '洗', pinyinNum: 'xi3', gloss: 'laver' },
      { tone: 4, character: '细', pinyinNum: 'xi4', gloss: 'fin, mince' },
    ],
  },
  {
    syllable: 'wen',
    entries: [
      { tone: 1, character: '温', pinyinNum: 'wen1', gloss: 'tiède' },
      { tone: 2, character: '文', pinyinNum: 'wen2', gloss: 'écrit' },
      { tone: 3, character: '稳', pinyinNum: 'wen3', gloss: 'stable' },
      { tone: 4, character: '问', pinyinNum: 'wen4', gloss: 'demander' },
    ],
  },
  {
    syllable: 'fei',
    entries: [
      { tone: 1, character: '飞', pinyinNum: 'fei1', gloss: 'voler' },
      { tone: 2, character: '肥', pinyinNum: 'fei2', gloss: 'gras' },
      { tone: 3, character: '匪', pinyinNum: 'fei3', gloss: 'bandit' },
      { tone: 4, character: '费', pinyinNum: 'fei4', gloss: 'frais, coût' },
    ],
  },
]
