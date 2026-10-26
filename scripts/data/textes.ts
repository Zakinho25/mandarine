/**
 * Textes de lecture graduée.
 *
 * Rédigés pour ce projet, pas repris d'une source existante. Chaque texte
 * n'emploie que le vocabulaire de son niveau et des niveaux précédents :
 * `npm run data:textes` le vérifie mot par mot et **échoue** si un seul mot
 * sort de la liste autorisée.
 *
 * Ce que cette vérification prouve et ce qu'elle ne prouve pas : elle garantit
 * qu'aucun mot inconnu ne traîne, elle ne garantit pas que la phrase soit
 * naturelle. Les textes portent donc le statut `auto_checked`, pas
 * `reviewed_human`. Une relecture par un locuteur natif reste à faire.
 */

export interface Paragraphe {
  readonly zh: string
  readonly fr: string
}

export interface TexteSource {
  readonly id: string
  readonly level: 1 | 2 | 3
  readonly titleZh: string
  readonly titleFr: string
  /** Unité thématique de rattachement, pour retrouver le texte depuis un thème. */
  readonly unit: string
  readonly paragraphs: readonly Paragraphe[]
  /**
   * Noms propres admis bien qu'absents du vocabulaire.
   * Aucun pour l'instant : les textes s'en passent volontairement, un nom
   * inventé n'apprenant rien à personne.
   */
  readonly proper?: readonly string[]
}

export const TEXTES: readonly TexteSource[] = [
  // ------------------------------------------------------------------ HSK 1
  {
    id: 'hsk1-ma-famille',
    level: 1,
    titleZh: '我的家',
    titleFr: 'Ma famille',
    unit: 'famille',
    paragraphs: [
      {
        zh: '我家有四个人：爸爸、妈妈、姐姐和我。',
        fr: 'Dans ma famille, nous sommes quatre : mon père, ma mère, ma grande sœur et moi.',
      },
      {
        zh: '爸爸是医生，在医院上班。他很忙。',
        fr: 'Mon père est médecin, il travaille à l’hôpital. Il est très occupé.',
      },
      {
        zh: '妈妈是老师，在小学工作。她很喜欢孩子。',
        fr: 'Ma mère est professeure, elle travaille dans une école primaire. Elle aime beaucoup les enfants.',
      },
      {
        zh: '姐姐是大学生。她在大学学习中文。',
        fr: 'Ma sœur est étudiante. Elle apprend le chinois à l’université.',
      },
      {
        zh: '我今年十二岁，是中学生。',
        fr: 'J’ai douze ans cette année, je suis au collège.',
      },
      {
        zh: '我们家有猫。它很漂亮，我非常喜欢它。',
        fr: 'Nous avons un chat. Il est très beau, je l’aime beaucoup.',
      },
    ],
  },
  {
    id: 'hsk1-ma-journee',
    level: 1,
    titleZh: '我的一天',
    titleFr: 'Ma journée',
    unit: 'calendrier',
    paragraphs: [
      {
        zh: '今天天气很好，不冷也不热。',
        fr: 'Aujourd’hui il fait beau, il ne fait ni froid ni chaud.',
      },
      {
        zh: '早上我在家吃早饭，喝牛奶。',
        fr: 'Le matin je prends mon petit-déjeuner à la maison et je bois du lait.',
      },
      { zh: '八点我开车去学校。', fr: 'À huit heures je pars à l’école en voiture.' },
      {
        zh: '中午我和同学在饭店吃午饭。我们吃面条儿和饺子。',
        fr: 'À midi je déjeune au restaurant avec mes camarades. Nous mangeons des nouilles et des raviolis.',
      },
      { zh: '下午我上课。', fr: 'L’après-midi j’ai cours.' },
      {
        zh: '晚上我回家，看电视，九点睡觉。',
        fr: 'Le soir je rentre, je regarde la télévision, et je me couche à neuf heures.',
      },
    ],
  },
  {
    id: 'hsk1-au-magasin',
    level: 1,
    titleZh: '在商店',
    titleFr: 'Au magasin',
    unit: 'achats',
    paragraphs: [
      {
        zh: '下午我去商店买东西。',
        fr: 'L’après-midi je vais faire des courses au magasin.',
      },
      {
        zh: '我买了苹果和鸡蛋。苹果很好吃，也很便宜。',
        fr: 'J’ai acheté des pommes et des œufs. Les pommes sont bonnes, et pas chères.',
      },
      {
        zh: '我还买了一本书和两个杯子。',
        fr: 'J’ai aussi acheté un livre et deux verres.',
      },
      { zh: '请问，多少钱？', fr: 'Excusez-moi, combien ça coûte ?' },
      { zh: '五十块。', fr: 'Cinquante yuans.' },
      {
        zh: '我给他钱，说谢谢。他说不客气。',
        fr: 'Je lui donne l’argent et je dis merci. Il répond : je vous en prie.',
      },
    ],
  },
  {
    id: 'hsk1-mon-amie',
    level: 1,
    titleZh: '我的朋友',
    titleFr: 'Mon amie',
    unit: 'gens',
    paragraphs: [
      {
        zh: '我有一个好朋友。她也是我的同学。',
        fr: 'J’ai une bonne amie. Elle est aussi ma camarade de classe.',
      },
      {
        zh: '她住在学校那边，我住在这边。',
        fr: 'Elle habite de ce côté-là de l’école, moi de ce côté-ci.',
      },
      {
        zh: '她喜欢看书，我喜欢看电影。',
        fr: 'Elle aime lire, j’aime regarder des films.',
      },
      {
        zh: '星期天我们去书店买书，也去电影院看电影。',
        fr: 'Le dimanche nous allons acheter des livres à la librairie, et voir un film au cinéma.',
      },
      {
        zh: '她的汉语很好，我想和她学习汉语。',
        fr: 'Son chinois est très bon, je voudrais l’apprendre avec elle.',
      },
    ],
  },

  // ------------------------------------------------------------------ HSK 2
  {
    id: 'hsk2-mon-dimanche',
    level: 2,
    titleZh: '我的星期天',
    titleFr: 'Mon dimanche',
    unit: 'loisirs',
    paragraphs: [
      {
        zh: '星期天我没有课，所以我很快乐。',
        fr: 'Le dimanche je n’ai pas cours, alors je suis content.',
      },
      {
        zh: '早上我跟朋友一起去运动。我们踢足球，他踢得很好。',
        fr: 'Le matin je fais du sport avec un ami. Nous jouons au football, il joue très bien.',
      },
      {
        zh: '中午我们在饭馆吃饭。那家饭馆的菜不错，但是有点儿贵。',
        fr: 'À midi nous mangeons au restaurant. La cuisine y est bonne, mais un peu chère.',
      },
      {
        zh: '下午我在家休息，看了一会儿电视。',
        fr: 'L’après-midi je me repose à la maison et je regarde un peu la télévision.',
      },
      {
        zh: '晚上我开始准备明天的考试。我希望考得好。',
        fr: 'Le soir je commence à préparer l’examen de demain. J’espère bien réussir.',
      },
    ],
  },
  {
    id: 'hsk2-demander-son-chemin',
    level: 2,
    titleZh: '问路',
    titleFr: 'Demander son chemin',
    unit: 'transports',
    paragraphs: [
      {
        zh: '我想去机场，但是不知道路。',
        fr: 'Je veux aller à l’aéroport, mais je ne connais pas le chemin.',
      },
      {
        zh: '我问一个人：不好意思，请问机场在哪儿？',
        fr: 'Je demande à quelqu’un : excusez-moi, où est l’aéroport ?',
      },
      {
        zh: '他说：从这里走路太远了。你可以坐地铁，也可以打车。',
        fr: 'Il répond : c’est trop loin à pied d’ici. Vous pouvez prendre le métro, ou un taxi.',
      },
      {
        zh: '地铁站就在前面，走五分钟就到。',
        fr: 'La station de métro est juste devant, cinq minutes à pied et vous y êtes.',
      },
      { zh: '我说：谢谢你！他说：不客气。', fr: 'Je dis merci. Il répond : je vous en prie.' },
    ],
  },
  {
    id: 'hsk2-ma-chambre',
    level: 2,
    titleZh: '我的房间',
    titleFr: 'Ma chambre',
    unit: 'maison',
    paragraphs: [
      {
        zh: '我住在学校的楼里，房间不大，但是很舒服。',
        fr: 'J’habite dans un bâtiment de l’école. Ma chambre n’est pas grande, mais elle est confortable.',
      },
      {
        zh: '房间里有床、桌子和椅子。',
        fr: 'Il y a un lit, une table et une chaise.',
      },
      {
        zh: '床的旁边是桌子，桌子上面有我的书和笔。',
        fr: 'La table est à côté du lit, et dessus il y a mes livres et mes stylos.',
      },
      { zh: '门口有我的书包。', fr: 'Mon sac est près de la porte.' },
      {
        zh: '我的房间有两个颜色：白色和绿色。我很喜欢。',
        fr: 'Ma chambre a deux couleurs : le blanc et le vert. Je l’aime beaucoup.',
      },
      {
        zh: '每天晚上我在房间里看书，有时上网。',
        fr: 'Tous les soirs je lis dans ma chambre, et parfois je vais sur internet.',
      },
    ],
  },

  // ------------------------------------------------------------------ HSK 3
  {
    id: 'hsk3-pourquoi-le-chinois',
    level: 3,
    titleZh: '我为什么学中文',
    titleFr: 'Pourquoi j’apprends le chinois',
    unit: 'ecole',
    paragraphs: [
      {
        zh: '很多人问我为什么学习中文。',
        fr: 'Beaucoup de gens me demandent pourquoi j’apprends le chinois.',
      },
      {
        zh: '因为我觉得中文很有意思，而且中国的文化很有意思。',
        fr: 'Parce que je trouve le chinois passionnant, et la culture chinoise aussi.',
      },
      {
        zh: '我第一次听到中文的时候，觉得声音很好听。',
        fr: 'La première fois que j’ai entendu du chinois, j’ai trouvé que ça sonnait bien.',
      },
      {
        zh: '学习汉字不容易，有时我觉得很难。',
        fr: 'Apprendre les caractères n’est pas facile, et parfois je trouve ça très dur.',
      },
      {
        zh: '但是我每天坚持练习，写汉字，听音乐，看中国的电影。',
        fr: 'Mais je m’entraîne tous les jours sans lâcher : j’écris des caractères, j’écoute de la musique, je regarde des films chinois.',
      },
      {
        zh: '现在我已经能跟中国朋友聊天儿了。',
        fr: 'Maintenant je peux déjà discuter avec des amis chinois.',
      },
      {
        zh: '我相信只要努力，就一定能学好。',
        fr: 'Je crois qu’avec des efforts, on finit forcément par y arriver.',
      },
    ],
  },
  {
    id: 'hsk3-a-l-hopital',
    level: 3,
    titleZh: '在医院',
    titleFr: 'À l’hôpital',
    unit: 'corps',
    paragraphs: [
      {
        zh: '上个星期我感冒了，发烧，头很疼。',
        fr: 'La semaine dernière j’ai attrapé froid : de la fièvre, et un gros mal de tête.',
      },
      {
        zh: '妈妈很担心，带我去医院。',
        fr: 'Ma mère s’est inquiétée et m’a emmené à l’hôpital.',
      },
      {
        zh: '医生给我检查了身体，说没有大问题。',
        fr: 'Le médecin m’a examiné et a dit qu’il n’y avait rien de grave.',
      },
      {
        zh: '他说：你要多休息，多喝水，记得吃药。',
        fr: 'Il a dit : reposez-vous bien, buvez beaucoup d’eau, et n’oubliez pas vos médicaments.',
      },
      {
        zh: '我在药店买了药。三天以后，我好多了。',
        fr: 'J’ai acheté les médicaments à la pharmacie. Trois jours après, j’allais beaucoup mieux.',
      },
      {
        zh: '这次生病让我明白了健康很重要。',
        fr: 'Cette maladie m’a fait comprendre que la santé compte beaucoup.',
      },
    ],
  },
  {
    id: 'hsk3-un-voyage',
    level: 3,
    titleZh: '一次旅游',
    titleFr: 'Un voyage',
    unit: 'transports',
    paragraphs: [
      {
        zh: '去年夏天，我和家人一起去南方旅游。',
        fr: 'L’été dernier, je suis parti en voyage dans le sud avec ma famille.',
      },
      {
        zh: '我们坐高铁去，三个小时就到了。',
        fr: 'Nous y sommes allés en train à grande vitesse : trois heures et nous y étions.',
      },
      {
        zh: '那个城市很漂亮，有山有海。',
        fr: 'Cette ville est très belle, avec des montagnes et la mer.',
      },
      {
        zh: '我们住在一个宾馆，房间干净，服务也很好。',
        fr: 'Nous logions dans un hôtel : chambres propres, bon service.',
      },
      {
        zh: '每天早上我们去公园跑步，下午在街上走走。',
        fr: 'Chaque matin nous allions courir au parc, et l’après-midi nous marchions dans les rues.',
      },
      {
        zh: '晚上我们在饭馆尝那里的菜，很新鲜。',
        fr: 'Le soir nous goûtions la cuisine locale au restaurant : très fraîche.',
      },
      {
        zh: '我们照了很多照片。这次旅游我很满意，希望明年还能去。',
        fr: 'Nous avons pris beaucoup de photos. Ce voyage m’a beaucoup plu, j’espère pouvoir y retourner l’an prochain.',
      },
    ],
  },
]
