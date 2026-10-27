/**
 * Unités thématiques du parcours.
 *
 * Le cahier des charges demande un parcours découpé par thème plutôt qu'une
 * liste alphabétique. Classer mille mots à la main n'est pas raisonnable :
 * l'affectation se fait par règle, et le pipeline signale ce qui reste non
 * classé pour qu'on affine la règle au lieu de l'ignorer.
 *
 * Trois critères, dans l'ordre :
 *  1. le mot est listé explicitement dans l'unité ;
 *  2. un mot-clé apparaît dans sa définition française ;
 *  3. sa classe grammaticale correspond.
 *
 * La classe grammaticale passe en dernier parce qu'elle est trop large :
 * placée avant, elle enverrait 快 (« rapide ») chez les adverbes au lieu des
 * mots qui décrivent. Elle sert de filet, pas de règle principale.
 *
 * L'ordre des unités compte : la première qui correspond gagne. Les unités
 * précises passent donc avant les générales.
 */

export interface Unite {
  readonly id: string
  readonly title: string
  readonly goal: string
  /** Mots attribués explicitement, prioritaires sur tout le reste. */
  readonly words?: readonly string[]
  /** Classes grammaticales qui suffisent à classer le mot. */
  readonly pos?: readonly string[]
  /** Mots cherchés dans la définition française. */
  readonly keywords?: readonly string[]
}

export const DIVERS_ID = 'divers'

const REGLES: readonly Unite[] = [
  {
    id: 'essentiels',
    title: 'Les verbes essentiels',
    goal: 'Être, avoir, pouvoir, vouloir : la charpente de toute phrase.',
    words: [
      '是', '有', '没有', '在', '得', '会', '能', '要', '让', '把', '被', '用',
      '叫', '做', '想', '可以', '应该', '需要', '觉得', '以为', '变成', '成为',
    ],
  },
  {
    id: 'degre',
    title: 'Dire le degré et la quantité',
    goal: 'Trop, très, le plus, seulement : nuancer ce qu’on affirme.',
    words: [
      '太', '最', '又', '只', '已经', '非常', '才', '先', '特别', '真', '更',
      '比较', '多么', '几乎', '完全', '一起', '一直', '总是', '常常', '有点儿',
    ],
    pos: ['adverbe'],
  },
  {
    id: 'idees',
    title: 'Les idées et les notions',
    goal: 'Les mots abstraits du quotidien : raison, moyen, problème, exemple.',
    keywords: [
      'savoir', 'connaître', 'possible', 'méthode', 'moyen', 'manière',
      'occasion', 'chance', 'raison', 'cause', 'différent', 'pareil', 'même',
      'erreur', 'faute', 'vrai', 'faux', 'problème', 'résultat', 'exemple',
      'monde', 'vie', 'vivre', 'chose', 'histoire', 'niveau', 'sorte', 'type',
      'partie', 'sens', 'effet', 'but',
    ],
  },
  {
    id: 'classificateurs',
    title: 'Les classificateurs',
    goal: 'Les mots de mesure qu’il faut placer entre le nombre et le nom.',
    pos: ['classificateur', 'numéral-classificateur'],
  },
  {
    id: 'outils',
    title: 'Les mots-outils',
    goal: 'Les particules et les pronoms qui tiennent la phrase debout.',
    words: ['的', '了', '吗', '呢', '吧', '不', '没', '很', '也', '都', '还', '就'],
    pos: ['particule', 'conjonction', 'préposition', 'pronom'],
  },
  {
    id: 'nombres',
    title: 'Les nombres et l’heure',
    goal: 'Compter, dire l’heure, donner un prix.',
    words: [
      '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '百', '千', '万',
      '零', '两', '第', '几', '号', '点', '分', '半', '刻', '小时', '分钟', '秒',
    ],
    keywords: ['nombre', 'numéro', 'heure', 'minute', 'compter', 'chiffre'],
  },
  {
    id: 'calendrier',
    title: 'Les jours et les dates',
    goal: 'Situer dans le temps : hier, demain, la semaine prochaine.',
    keywords: [
      'jour', 'semaine', 'mois', 'année', 'an ', 'hier', 'demain', 'aujourd',
      'matin', 'soir', 'midi', 'nuit', 'date', 'saison', 'printemps', 'été',
      'automne', 'hiver', 'anniversaire', 'moment', 'durée', 'maintenant',
      'tard', 'tôt', 'autrefois', 'longtemps', 'bientôt', 'horaire',
    ],
  },
  {
    id: 'presentation',
    title: 'Se présenter',
    goal: 'Dire qui on est, d’où on vient, comment on s’appelle.',
    keywords: [
      'bonjour', 'salut', 'au revoir', 's’appeler', 'appeler', 'nom', 'prénom',
      'nationalité', 'pays', 'chine', 'chinois', 'français', 'âge', 'merci',
      'excuser', 'pardon', 'content de', 'présenter',
    ],
  },
  {
    id: 'famille',
    title: 'La famille',
    goal: 'Parler des siens.',
    keywords: [
      'famille', 'père', 'mère', 'papa', 'maman', 'fils', 'fille', 'frère',
      'sœur', 'grand-père', 'grand-mère', 'mari', 'femme', 'époux', 'épouse',
      'enfant', 'parent', 'oncle', 'tante', 'cousin',
    ],
  },
  {
    id: 'nourriture',
    title: 'Manger et boire',
    goal: 'Commander, choisir un plat, parler de goûts.',
    keywords: [
      'manger', 'boire', 'repas', 'plat', 'riz', 'nouille', 'viande', 'poisson',
      'légume', 'fruit', 'pomme', 'eau', 'thé', 'café', 'lait', 'bière', 'vin',
      'restaurant', 'cuisine', 'goût', 'sucre', 'sel', 'faim', 'soif', 'œuf',
      'pain', 'soupe', 'gâteau', 'serveur', 'menu', 'déjeuner', 'dîner',
    ],
  },
  {
    id: 'achats',
    title: 'Acheter et payer',
    goal: 'Faire ses courses, demander un prix, payer.',
    keywords: [
      'acheter', 'vendre', 'prix', 'payer', 'argent', 'cher', 'magasin',
      'marché', 'monnaie', 'yuan', 'carte bancaire', 'gratuit', 'cadeau',
      'commerce', 'supermarché', 'client',
    ],
  },
  {
    id: 'transports',
    title: 'Se déplacer',
    goal: 'Prendre un bus, un taxi, un train ; demander son chemin.',
    keywords: [
      'bus', 'taxi', 'train', 'avion', 'voiture', 'vélo', 'métro', 'gare',
      'aéroport', 'billet', 'station', 'conduire', 'route', 'rue', 'chemin',
      'partir', 'arriver', 'voyage', 'valise', 'hôtel',
    ],
  },
  {
    id: 'lieux',
    title: 'Les lieux et l’orientation',
    goal: 'Dire où se trouve une chose, s’orienter.',
    keywords: [
      'lieu', 'endroit', 'ville', 'village', 'quartier', 'gauche', 'droite',
      'devant', 'derrière', 'dessus', 'dessous', 'côté', 'milieu', 'nord',
      'sud', 'est', 'ouest', 'près', 'loin', 'intérieur', 'extérieur',
      'banque', 'poste', 'hôpital', 'parc', 'bibliothèque', 'toilettes',
    ],
  },
  {
    id: 'maison',
    title: 'La maison',
    goal: 'Décrire où l’on habite et ce qu’il y a dedans.',
    keywords: [
      'maison', 'appartement', 'chambre', 'cuisine', 'salle de bain', 'porte',
      'fenêtre', 'table', 'chaise', 'lit', 'habiter', 'loger', 'meuble',
      'étage', 'ascenseur', 'clé', 'jardin',
    ],
  },
  {
    id: 'ecole',
    title: 'L’école et les études',
    goal: 'Parler de ses cours, de ses examens, de sa classe.',
    keywords: [
      'école', 'université', 'étudier', 'apprendre', 'cours', 'classe',
      'professeur', 'élève', 'étudiant', 'examen', 'devoir', 'leçon', 'livre',
      'cahier', 'stylo', 'crayon', 'question', 'réponse', 'note', 'diplôme',
      'bibliothèque', 'enseigner',
    ],
  },
  {
    id: 'travail',
    title: 'Le travail',
    goal: 'Dire ce qu’on fait, parler de son bureau et de ses collègues.',
    keywords: [
      'travail', 'travailler', 'métier', 'bureau', 'entreprise', 'société',
      'collègue', 'patron', 'employé', 'réunion', 'salaire', 'médecin',
      'ingénieur', 'avocat', 'chauffeur', 'vendeur', 'serveur', 'policier',
      'emploi', 'carrière',
    ],
  },
  {
    id: 'corps',
    title: 'Le corps et la santé',
    goal: 'Dire qu’on est malade, décrire une douleur.',
    keywords: [
      'corps', 'tête', 'main', 'pied', 'œil', 'yeux', 'oreille', 'bouche',
      'nez', 'dent', 'cheveu', 'bras', 'jambe', 'ventre', 'malade', 'maladie',
      'douleur', 'mal', 'médicament', 'hôpital', 'docteur', 'santé', 'fièvre',
      'fatigué', 'repos', 'dormir',
    ],
  },
  {
    id: 'vetements',
    title: 'Les vêtements',
    goal: 'S’habiller, essayer, choisir une taille.',
    keywords: [
      'vêtement', 'habit', 'porter', 'pantalon', 'chemise', 'robe', 'jupe',
      'manteau', 'chaussure', 'chapeau', 'taille', 'essayer', 'propre', 'sale',
      'laver',
    ],
  },
  {
    id: 'couleurs',
    title: 'Les couleurs et les formes',
    goal: 'Décrire l’aspect d’une chose.',
    keywords: [
      'couleur', 'rouge', 'bleu', 'vert', 'jaune', 'noir', 'blanc', 'gris',
      'rond', 'carré', 'long', 'court', 'grand', 'petit', 'gros', 'mince',
      'lourd', 'léger', 'haut', 'bas',
    ],
  },
  {
    id: 'meteo',
    title: 'Le temps qu’il fait',
    goal: 'Parler de la pluie, du beau temps, de la température.',
    keywords: [
      'pluie', 'pleuvoir', 'neige', 'vent', 'soleil', 'nuage', 'chaud',
      'froid', 'température', 'degré', 'climat', 'météo', 'orage',
    ],
  },
  {
    id: 'loisirs',
    title: 'Les loisirs et le sport',
    goal: 'Dire ce qu’on aime faire de son temps libre.',
    keywords: [
      'sport', 'jouer', 'jeu', 'musique', 'chanter', 'danser', 'film',
      'cinéma', 'télévision', 'lire', 'lecture', 'nager', 'courir', 'football',
      'basket', 'voyage', 'promenade', 'photo', 'loisir', 'vacances', 'fête',
    ],
  },
  {
    id: 'communication',
    title: 'Parler et communiquer',
    goal: 'Téléphoner, écrire un message, demander une explication.',
    keywords: [
      'parler', 'dire', 'demander', 'répondre', 'téléphone', 'téléphoner',
      'message', 'lettre', 'courriel', 'internet', 'ordinateur', 'écrire',
      'langue', 'mot', 'phrase', 'traduire', 'expliquer', 'comprendre',
      'entendre', 'écouter', 'raconter', 'discuter',
    ],
  },
  {
    id: 'sentiments',
    title: 'Les sentiments et les opinions',
    goal: 'Dire ce qu’on pense et ce qu’on ressent.',
    keywords: [
      'aimer', 'détester', 'content', 'heureux', 'triste', 'peur', 'colère',
      'penser', 'croire', 'espérer', 'vouloir', 'préférer', 'intéressant',
      'ennuyeux', 'inquiet', 'surprise', 'sentiment', 'avis', 'opinion',
      'important', 'facile', 'difficile',
    ],
  },
  {
    id: 'nature',
    title: 'Les animaux et la nature',
    goal: 'Nommer ce qui vit autour de soi.',
    keywords: [
      'animal', 'chien', 'chat', 'oiseau', 'cheval', 'arbre', 'fleur', 'herbe',
      'montagne', 'mer', 'rivière', 'ciel', 'terre', 'nature', 'forêt',
    ],
  },
  {
    id: 'gens',
    title: 'Les gens et les relations',
    goal: 'Parler des autres : amis, voisins, inconnus.',
    keywords: [
      'ami', 'camarade', 'voisin', 'monsieur', 'madame', 'personne', 'gens',
      'homme', 'garçon', 'jeune', 'vieux', 'ensemble', 'rencontrer', 'aider',
      'attendre', 'inviter', 'connaître',
    ],
  },
  {
    id: 'actions',
    title: 'Les actions du quotidien',
    goal: 'Les verbes qu’on emploie tous les jours.',
    keywords: [
      'faire', 'aller', 'venir', 'prendre', 'donner', 'mettre', 'ouvrir',
      'fermer', 'chercher', 'trouver', 'commencer', 'finir', 'attendre',
      'entrer', 'sortir', 'monter', 'descendre', 'tenir', 'porter', 'apporter',
      'utiliser', 'choisir', 'changer', 'essayer', 'oublier', 'se souvenir',
    ],
  },
]

/**
 * Rattrapage : les mots que la règle ne sait pas classer.
 *
 * La règle fait le gros du travail — plus de huit cents mots sur mille —
 * mais elle laisse une queue qu'aucun mot-clé n'attrape : 室 « salle », 卡
 * « carte », 刮 « gratter ». Allonger les mots-clés pour les rattraper
 * attirerait des mots qui n'ont rien à y faire, parce qu'un mot-clé large
 * agit sur les mille mots à la fois et pas seulement sur celui qu'on vise.
 *
 * Ces affectations sont donc écrites une par une. C'est exactement ce que le
 * passage par l'unité « divers » sert à révéler : la liste ci-dessous est la
 * facture de ce que la règle ne couvre pas.
 */
const RATTRAPAGE: Readonly<Record<string, readonly string[]>> = {
  degre: ['新', '少', '坏', '慢', '突然', '一般', '好多', '常见', '常用'],
  idees: [
    '关系', '安全', '服务', '看来', '发展', '差', '主要', '环境', '习惯',
    '变化', '文化', '奇怪', '合适', '有用', '有名', '安静',
  ],
  outils: ['为什么', '子', '来自'],
  nombres: ['一半', '手表'],
  calendrier: [
    '上午', '星期天', '星期日', '小时候', '最后', '以前', '刚才', '周末',
    '直到', '平时', '迟到',
  ],
  presentation: ['不客气', '欢迎', '做客'],
  famille: ['姐姐', '女朋友', '姐妹', '夫妻', '结婚'],
  nourriture: [
    '鸡蛋', '杯子', '饺子', '包子', '冰', '新鲜', '碗', '饮料', '饱', '香蕉',
    '瓶子', '西瓜', '筷子', '勺子', '冰激凌',
  ],
  achats: ['商场', '卡', '信用卡'],
  transports: ['飞', '船', '地图', '行李', '起飞', '路口', '护照', '红绿灯'],
  lieux: ['书店', '近', '离', '药店', '方向', '室', '外地'],
  maison: ['电', '纸', '灯', '刷', '扫', '冰箱', '空调', '楼梯', '伞', '打扫', '搬家'],
  ecole: [
    '小学生', '书包', '练', '数学', '练习', '校园', '学期', '复习', '课本',
    '字典', '词典', '课文',
  ],
  travail: ['长', '经理'],
  corps: ['休息', '脸', '身高'],
  vetements: ['上衣', '短裤', '雨衣'],
  couleurs: ['漂亮', '难看'],
  meteo: ['刮'],
  loisirs: [
    '好玩儿', '没意思', '球', '画', '跳', '运动员', '晚会', '锻炼', '网球',
    '体育馆', '运动会', '羽毛球',
  ],
  communication: [
    '新闻', '声音', '语言', '网站', '报纸', '对话', '邮件', '耳机',
  ],
  sentiments: [
    '笑', '坚持', '感到', '可爱', '哭', '关心', '急', '满意', '聪明',
    '热情', '放心', '着急',
  ],
  nature: ['牛', '鸡', '羊', '月亮', '草地', '开花', '大熊猫'],
  gens: ['游客', '画家'],
  actions: [
    '看见', '过', '起来', '出来', '回来', '回去', '发生', '受', '加', '检查',
    '办', '收', '查', '收到', '养', '丢', '提高', '出生', '搬', '不见',
    '分开',
  ],
}

/**
 * Les unités telles que l'application les emploie : la règle, complétée par
 * le rattrapage.
 */
export const UNITES: readonly Unite[] = REGLES.map((unite) => ({
  ...unite,
  words: [...(unite.words ?? []), ...(RATTRAPAGE[unite.id] ?? [])],
}))

export interface Classifiable {
  readonly simplified: string
  readonly glossFr: readonly string[]
  readonly pos: readonly { readonly label: string }[]
}

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Cherche un mot-clé sur des frontières de mots.
 *
 * La recherche en sous-chaîne paraissait suffisante jusqu'à ce qu'on
 * s'aperçoive que « jour » trouvait « bonjour », et envoyait 你好 dans l'unité
 * du calendrier. Les frontières règlent aussi « an » dans « grand » et
 * « est » dans « c'est ».
 */
export function matchesKeyword(gloss: string, keyword: string): boolean {
  const needle = normalize(keyword).trim()
  if (needle.length === 0) return false
  // Un `s` ou un `x` final est toléré : les définitions écrivent « légumes »
  // et « vêtements » au pluriel, et exiger la forme exacte ferait perdre des
  // dizaines de mots pour rien.
  return new RegExp(`(^|[^a-z0-9])${escapeRegex(needle)}[sx]?([^a-z0-9]|$)`).test(gloss)
}

/**
 * Attribue un mot à une unité. Renvoie `divers` quand aucune règle ne
 * s'applique : un mot mal rangé serait plus trompeur qu'un mot non rangé.
 */
export function assignUnit(
  lexeme: Classifiable,
  units: readonly Unite[] = UNITES,
): string {
  for (const unit of units) {
    if (unit.words?.includes(lexeme.simplified) === true) return unit.id
  }

  const glosses = lexeme.glossFr.map((gloss) => normalize(gloss))
  for (const unit of units) {
    if (unit.keywords === undefined) continue
    for (const keyword of unit.keywords) {
      if (glosses.some((gloss) => matchesKeyword(gloss, keyword))) return unit.id
    }
  }

  for (const unit of units) {
    if (unit.pos === undefined) continue
    if (lexeme.pos.some((part) => unit.pos?.includes(part.label) === true)) {
      return unit.id
    }
  }

  return DIVERS_ID
}
