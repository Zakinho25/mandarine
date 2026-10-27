import type { PointSource } from './types.ts'

/**
 * Grammaire du niveau 2 : l'aspect, la comparaison, les premiers
 * connecteurs.
 *
 * C'est ici que le chinois cesse de ressembler au français mot pour mot. Les
 * fiches insistent donc moins sur la règle que sur l'écart : ce que le
 * français fait autrement, et où le réflexe francophone trahit.
 */
export const NIVEAU_2: readonly PointSource[] = [
  {
    id: 'guo-experience',
    level: 2,
    categorie: 'aspect',
    titre: '过 : l’expérience, au moins une fois',
    markers: ['过'],
    resume: '过 après le verbe dit qu’on a déjà fait la chose, sans dire quand.',
    explication: [
      '我去过中国 veut dire « je suis déjà allé en Chine ». Ce qui compte n’est pas le moment mais le fait d’en avoir l’expérience : 你去过中国吗 cherche à savoir si tu connais le pays.',
      'La négation est 没 et 过 reste en place : 我没去过中国. C’est une différence importante avec 了, qui disparaît à la négative.',
    ],
    piege:
      '了 et 过 se traduisent tous deux par un passé français, mais ils ne disent pas la même chose. 我吃了 répond à « as-tu mangé ? » ; 我吃过 répond à « as-tu déjà goûté ? ».',
    exemples: [
      { zh: '我去过中国。', fr: 'Je suis déjà allé en Chine.' },
      { zh: '你吃过中国菜吗？', fr: 'As-tu déjà mangé chinois ?' },
      { zh: '我没有去过外国。', fr: 'Je ne suis jamais allé à l’étranger.' },
    ],
    ordre: ['你', '吃过', '这个', '饭馆的', '鱼', '吗'],
    ordreFr: 'As-tu déjà mangé le poisson de ce restaurant ?',
  },

  {
    id: 'zai-progressif',
    level: 2,
    categorie: 'aspect',
    titre: '在 et 正在 : l’action en cours',
    markers: ['在', '正在', '正'],
    resume: '在 devant le verbe : « être en train de ».',
    explication: [
      '他在吃饭 veut dire « il est en train de manger ». 正在 insiste sur le moment précis. On ajoute souvent 呢 à la fin : 他在吃饭呢.',
      'Cette construction ne va pas avec 了 : une action en cours n’est pas achevée.',
    ],
    piege:
      'Ne confonds pas les deux 在. Devant un lieu, il situe (他在家) ; devant un verbe, il indique le déroulement (他在吃饭). Les deux peuvent coexister : 他在家吃饭呢.',
    exemples: [
      { zh: '他正在吃饭。', fr: 'Il est en train de manger.' },
      { zh: '我在看电视呢。', fr: 'Je suis en train de regarder la télévision.' },
      { zh: '妈妈在洗衣服。', fr: 'Maman est en train de laver le linge.' },
    ],
    ordre: ['我弟弟', '正在', '房间里', '看', '书'],
    ordreFr: 'Mon petit frère est en train de lire dans sa chambre.',
  },

  {
    id: 'zhe-duratif',
    level: 2,
    categorie: 'aspect',
    titre: '着 : l’état qui dure',
    markers: ['着'],
    resume:
      '着 après le verbe décrit une position ou un état maintenu, pas une action qui avance.',
    explication: [
      '他坐着 veut dire « il est assis ». Le verbe désigne le geste, 着 indique qu’on en est resté là : 门开着, la porte est ouverte.',
      'Il sert aussi à dire qu’une action accompagne une autre : 他笑着说, « il a dit en souriant ». Le verbe porteur de 着 est la manière, celui qui suit est l’action principale.',
    ],
    piege:
      '在 et 着 se traduisent tous deux par « être en train de », mais 在 décrit une action qui progresse et 着 un état qui dure. 他在穿衣服 : il s’habille. 他穿着红色的衣服 : il porte du rouge.',
    exemples: [
      { zh: '他坐着看书。', fr: 'Il lit assis.' },
      { zh: '门开着。', fr: 'La porte est ouverte.' },
      { zh: '她笑着告诉我。', fr: 'Elle me l’a dit en souriant.' },
    ],
    ordre: ['她', '穿着', '一件', '白色的', '衣服'],
    ordreFr: 'Elle porte un vêtement blanc.',
  },

  {
    id: 'yijing-le',
    level: 2,
    categorie: 'aspect',
    titre: '已经…了 : c’est déjà fait',
    markers: ['已经', '了', '快要'],
    resume: '已经 devant le verbe, 了 à la fin : la situation a changé.',
    explication: [
      '他已经走了 : il est déjà parti. Le 了 final n’est pas celui du verbe accompli, il marque le changement d’état par rapport à avant.',
      'Le pendant à l’autre bout du temps est 快要…了 : 他快要来了, « il va bientôt arriver ».',
    ],
    piege:
      'La négation n’est pas 已经不 mais 还没 : 他还没走, « il n’est pas encore parti ». 已经 et 还没 fonctionnent en paire dans la conversation.',
    exemples: [
      { zh: '他已经走了。', fr: 'Il est déjà parti.' },
      { zh: '我已经吃过了。', fr: 'J’ai déjà mangé.' },
      { zh: '他还没有来呢。', fr: 'Il n’est toujours pas là.' },
    ],
    ordre: ['我', '已经', '看过', '这个', '电影', '了'],
    ordreFr: 'J’ai déjà vu ce film.',
  },

  {
    id: 'bi-comparaison',
    level: 2,
    categorie: 'comparaison',
    titre: '比 : comparer deux choses',
    markers: ['比'],
    resume: 'A 比 B + adjectif. Et surtout : plus de 很.',
    explication: [
      '他比我高 : il est plus grand que moi. L’adjectif reste nu, sans 很, parce que la comparaison fait déjà le travail que 很 faisait.',
      'Pour dire de combien, on l’ajoute après l’adjectif : 他比我高一点儿.',
      'La négation habituelle n’est pas 不比 mais 没有 : 我没有他高, « je ne suis pas aussi grand que lui ».',
    ],
    piege:
      '他比我很高 est faux, et c’est l’erreur la plus fréquente sur ce point. Dès que 比 apparaît, 很 doit partir.',
    exemples: [
      { zh: '他比我高。', fr: 'Il est plus grand que moi.' },
      { zh: '今天比昨天热。', fr: 'Il fait plus chaud aujourd’hui qu’hier.' },
      { zh: '这个比那个便宜一点儿。', fr: 'Celui-ci est un peu moins cher que celui-là.' },
    ],
    ordre: ['这件', '衣服', '比', '那件', '贵', '一点儿'],
    ordreFr: 'Ce vêtement est un peu plus cher que celui-là.',
  },

  {
    id: 'zui-superlatif',
    level: 2,
    categorie: 'comparaison',
    titre: '最 : le superlatif',
    markers: ['最'],
    resume: '最 devant l’adjectif ou le verbe : le plus, le mieux.',
    explication: [
      '最 se place comme les autres adverbes, entre le sujet et ce qu’il qualifie : 这个最贵, 我最喜欢这个.',
      'Pas besoin d’article ni de « de tous » : 最 suffit. Pour préciser le groupe, il passe devant : 我们班他最高.',
    ],
    piege:
      'Comme avec 比, l’adjectif perd son 很 : 最很贵 n’existe pas.',
    exemples: [
      { zh: '这个最便宜。', fr: 'C’est le moins cher.' },
      { zh: '我最喜欢这个颜色。', fr: 'C’est la couleur que je préfère.' },
      { zh: '他是我们班最高的。', fr: 'C’est le plus grand de notre classe.' },
    ],
    ordre: ['我', '最', '喜欢', '这个', '饭馆的', '鱼'],
    ordreFr: 'Ce que je préfère, c’est le poisson de ce restaurant.',
  },

  {
    id: 'yinwei-suoyi',
    level: 2,
    categorie: 'connecteur',
    titre: '因为…所以 : la cause et sa conséquence',
    markers: ['因为', '所以'],
    resume: 'Les deux mots se disent, là où le français n’en garde qu’un.',
    explication: [
      '因为下雨，所以我没去 : « comme il pleuvait, je n’y suis pas allé ». Le chinois pose la cause d’abord, la conséquence ensuite, et marque les deux bouts.',
      'On peut n’employer que l’un des deux, mais garder la paire est plus naturel à ce niveau. L’ordre inverse existe aussi : 我没去，因为下雨.',
    ],
    piege:
      'En français, « parce que… donc » serait une faute. En chinois c’est la norme : ne coupe pas la paire par réflexe.',
    exemples: [
      { zh: '因为下雨，所以我没有去。', fr: 'Comme il pleuvait, je n’y suis pas allé.' },
      { zh: '因为他很忙，所以不能来。', fr: 'Comme il est très occupé, il ne peut pas venir.' },
      {
        zh: '我今天很累，因为我昨天没有睡觉。',
        fr: 'Je suis fatigué aujourd’hui, parce que je n’ai pas dormi hier.',
      },
    ],
    ordre: ['因为', '下雨，', '所以', '我们', '没有', '出门'],
    ordreFr: 'Comme il pleuvait, nous ne sommes pas sortis.',
  },

  {
    id: 'suiran-danshi',
    level: 2,
    categorie: 'connecteur',
    titre: '虽然…但是 : concéder, puis s’opposer',
    markers: ['虽然', '但是', '但'],
    resume: 'Même fonctionnement en paire que 因为…所以.',
    explication: [
      '虽然很贵，但是很好吃 : « c’est cher, mais c’est très bon ». 虽然 annonce la concession, 但是 apporte l’opposition.',
      '但 est la forme courte, un peu plus écrite. 还是 renforce volontiers la seconde partie : 虽然很累，但是我还是去了.',
    ],
    piege:
      '但是 ouvre la seconde proposition, il ne s’insère pas en incise au milieu d’une phrase comme le « mais » français peut le faire.',
    exemples: [
      { zh: '虽然很贵，但是很好吃。', fr: 'C’est cher, mais c’est très bon.' },
      {
        zh: '虽然他很忙，但是他每天都运动。',
        fr: 'Il est très occupé, mais il fait du sport tous les jours.',
      },
      { zh: '虽然我很累，但是我还是去了。', fr: 'J’étais fatigué, mais j’y suis allé quand même.' },
    ],
    ordre: ['虽然', '天气', '很冷，', '但是', '我', '很快乐'],
    ordreFr: 'Il fait froid, mais je suis heureux.',
  },

  {
    id: 'rang-causatif',
    level: 2,
    categorie: 'phrase',
    titre: '让 : faire faire, laisser faire',
    markers: ['让', '帮', '教'],
    resume:
      '让 + quelqu’un + verbe. La personne au milieu est à la fois objet et sujet.',
    explication: [
      '妈妈让我洗手 : « maman m’a dit de me laver les mains ». 我 est l’objet de 让 et le sujet de 洗手 en même temps.',
      '帮 et 教 se construisent de la même façon : 他帮我打车, 老师教我们说汉语.',
    ],
    piege:
      'Rien ne vient entre 让 et la personne, rien entre la personne et le verbe. Le français intercale « de » ou « à » ; le chinois enchaîne directement.',
    exemples: [
      { zh: '妈妈让我洗手。', fr: 'Maman m’a dit de me laver les mains.' },
      { zh: '他帮我打车。', fr: 'Il m’a aidé à prendre un taxi.' },
      { zh: '老师教我们说汉语。', fr: 'Le professeur nous apprend à parler chinois.' },
    ],
    ordre: ['我妈妈', '不让', '我', '晚上', '上网'],
    ordreFr: 'Ma mère ne me laisse pas aller sur Internet le soir.',
  },

  {
    id: 'cong-dao-li',
    level: 2,
    categorie: 'phrase',
    titre: '从…到 et 离 : le trajet et la distance',
    markers: ['从', '到', '离'],
    resume: '从 le départ, 到 l’arrivée, 离 l’écart entre les deux.',
    explication: [
      '从我家到学校很远 : « de chez moi à l’école, c’est loin ». La paire fonctionne pour l’espace comme pour le temps : 从早上到晚上.',
      '离 mesure un écart. Ce qui le suit est le point de référence, et l’adjectif vient en dernier : 我家离车站很近.',
    ],
    piege:
      'Ne traduis pas « loin de l’école » par 远离学校. L’ordre chinois est : ce qu’on situe, 离, le repère, puis 远 ou 近.',
    exemples: [
      { zh: '从我家到学校很远。', fr: 'De chez moi à l’école, c’est loin.' },
      { zh: '我家离车站很近。', fr: 'Ma maison est près de la gare.' },
      {
        zh: '我从早上九点工作到晚上六点。',
        fr: 'Je travaille de neuf heures du matin à six heures du soir.',
      },
    ],
    ordre: ['我们的', '教室', '离', '洗手间', '很近'],
    ordreFr: 'Notre salle de classe est près des toilettes.',
  },

  {
    id: 'complement-resultat',
    level: 2,
    categorie: 'complement',
    titre: 'Le résultat se colle au verbe : 完, 到, 错, 懂, 见',
    markers: ['完', '到', '错', '懂', '见', '开'],
    resume: 'Un second verbe collé au premier dit comment l’action a fini.',
    explication: [
      '看 c’est regarder, 看见 c’est voir ; 听 c’est écouter, 听懂 c’est comprendre. Le premier verbe porte l’action, le second son résultat : 吃完, avoir fini de manger ; 买到, avoir réussi à acheter.',
      'La négation est 没 devant tout le groupe : 我没听懂, « je n’ai pas compris ». Le résultat n’a pas été atteint.',
    ],
    piege:
      'Le français a un seul verbe là où le chinois en a deux. « Je n’ai pas compris » n’est pas 我不懂, qui dit une incompréhension durable, mais 我没听懂, « je n’ai pas réussi à comprendre ce qui vient d’être dit ».',
    exemples: [
      { zh: '我吃完了。', fr: 'J’ai fini de manger.' },
      { zh: '我没有听懂。', fr: 'Je n’ai pas compris.' },
      { zh: '我在路上看见他了。', fr: 'Je l’ai vu dans la rue.' },
    ],
    ordre: ['我', '昨天', '没有', '做完', '那些', '题'],
    ordreFr: 'Hier, je n’ai pas fini ces exercices.',
    ordreAussi: [['昨天', '我', '没有', '做完', '那些', '题']],
  },

  {
    id: 'direction-lai-qu',
    level: 2,
    categorie: 'complement',
    titre: '来 et 去 après le verbe : vers moi, ou loin de moi',
    markers: ['来', '去', '进来', '出去', '回来'],
    resume: '来 si l’action vient vers celui qui parle, 去 si elle s’en éloigne.',
    explication: [
      '进来 et 进去 décrivent le même geste vu de deux endroits. Si tu es dans la pièce, tu dis 进来 ; si tu es dehors, 进去. Même logique pour 上来 et 上去, 回来 et 回去, 出来 et 出去.',
      'Le point de référence est celui qui parle, pas celui qui bouge. C’est pourquoi la même action change de mot selon qui la raconte.',
    ],
    piege:
      'Le français ne fait pas cette distinction : « entre ! » se dit 进来 ou 进去 selon où tu te trouves. Demande-toi toujours où est le locuteur.',
    exemples: [
      { zh: '请进来。', fr: 'Entrez.' },
      { zh: '他出去了。', fr: 'Il est sorti.' },
      { zh: '我明天回来。', fr: 'Je rentre demain.' },
    ],
    ordre: ['他', '已经', '从', '外面', '回来', '了'],
    ordreFr: 'Il est déjà rentré du dehors.',
  },

  {
    id: 'verbe-redouble',
    level: 2,
    categorie: 'phrase',
    titre: 'Redoubler le verbe : essayer un peu',
    markers: [],
    resume: '看看, 走走 : faire la chose brièvement, sans y mettre de poids.',
    explication: [
      '你看看 est plus léger que 你看 : « jette un œil ». Le redoublement adoucit la demande et raccourcit l’action. 我们走走吧 : « marchons un peu ».',
      'Avec un verbe de deux syllabes, on redouble le groupe entier : 休息休息. On peut aussi glisser 一 au milieu : 看一看.',
    ],
    piege:
      'C’est le moyen le plus simple de ne pas sonner sec. Une demande au verbe nu passe facilement pour un ordre ; redouble, ou ajoute 吧.',
    exemples: [
      { zh: '你看看这个。', fr: 'Regarde un peu ça.' },
      { zh: '我们休息休息吧。', fr: 'Reposons-nous un peu.' },
      { zh: '我想问一问。', fr: 'J’aimerais poser une petite question.' },
    ],
    ordre: ['我们', '出去', '走走', '吧'],
    ordreFr: 'Sortons marcher un peu.',
  },

  {
    id: 'compter-les-fois',
    level: 2,
    categorie: 'mesure',
    titre: '次 : compter les occurrences',
    markers: ['次', '一会儿', '一下'],
    resume: 'Le nombre de fois se place après le verbe, pas avant.',
    explication: [
      '我去过两次 : « j’y suis allé deux fois ». 两次 vient après le verbe parce qu’il mesure l’action, pas le sujet.',
      'Avec un complément, l’ordre le plus simple est verbe, nombre de fois, complément : 我看过两次这个电影.',
      '一下 et 一会儿 occupent la même place : 等一下, 休息一会儿.',
    ],
    piege:
      'Le français place « deux fois » à peu près où il veut ; le chinois l’exige après le verbe. 我两次去过 est faux.',
    exemples: [
      { zh: '我去过两次。', fr: 'J’y suis allé deux fois.' },
      { zh: '请等一下。', fr: 'Attendez un instant.' },
      { zh: '我们休息一会儿吧。', fr: 'Reposons-nous un moment.' },
    ],
    ordre: ['我', '看过', '两次', '这个', '电影'],
    ordreFr: 'J’ai vu ce film deux fois.',
  },

  {
    id: 'de-adverbial-di',
    level: 2,
    categorie: 'complement',
    titre: '地 : transformer un adjectif en manière',
    markers: ['地'],
    resume: 'Adjectif + 地 + verbe : c’est le « -ment » du français.',
    explication: [
      '慢慢地说 : « parler lentement ». 地 accroche la manière au verbe, et le groupe reste devant le verbe comme tous les compléments de ce type.',
      'Avec un adjectif redoublé, 地 est presque obligatoire. Avec un adjectif court seul, on peut souvent s’en passer : 快走.',
    ],
    piege:
      'Trois mots se prononcent « de » et ne s’écrivent pas pareil. Retiens la place : 的 devant un nom, 地 devant un verbe. Le troisième, 得, arrive au niveau 3.',
    exemples: [
      { zh: '请慢慢地说。', fr: 'Parle lentement, s’il te plaît.' },
      { zh: '她很快地写完了。', fr: 'Elle a fini d’écrire très vite.' },
      { zh: '她高兴地告诉我这件事情。', fr: 'Elle m’a annoncé la nouvelle avec joie.' },
    ],
    ordre: ['请', '你', '慢慢地', '说', '这个', '词'],
    ordreFr: 'Prononce ce mot lentement, s’il te plaît.',
  },
]
