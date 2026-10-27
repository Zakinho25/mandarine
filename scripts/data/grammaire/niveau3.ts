import type { PointSource } from './types.ts'

/**
 * Grammaire du niveau 3 : les constructions qui n'ont pas d'équivalent
 * français direct.
 *
 * 把, 被, les compléments de degré et de potentiel, les paires de
 * connecteurs. C'est la partie du programme où traduire mot à mot cesse de
 * fonctionner, donc celle où le piège francophone compte le plus.
 */
export const NIVEAU_3: readonly PointSource[] = [
  {
    id: 'ba-objet',
    level: 3,
    categorie: 'phrase',
    titre: '把 : agir sur l’objet, et dire ce qu’il devient',
    markers: ['把'],
    resume: '把 fait remonter l’objet devant le verbe, pour dire ce qui lui arrive.',
    explication: [
      '我把门关了 : « j’ai fermé la porte ». L’objet passe devant le verbe, introduit par 把, et le verbe est suivi de ce qui résulte de l’action.',
      '把 n’est pas une option de style : il devient obligatoire dès qu’on précise où l’objet a été mis. 我把书放在桌子上 ne peut pas se dire autrement.',
      'L’objet doit être connu des deux interlocuteurs. On ne dit pas 我把一本书看完了 mais 我把这本书看完了.',
    ],
    piege:
      'Le verbe ne peut pas rester seul après 把. 我把门关 est faux : il faut 我把门关了. 把 annonce un changement, donc il faut dire lequel.',
    exemples: [
      { zh: '我把门关了。', fr: 'J’ai fermé la porte.' },
      { zh: '请把书放在桌子上。', fr: 'Pose le livre sur la table, s’il te plaît.' },
      { zh: '他把我的手机拿走了。', fr: 'Il a emporté mon téléphone.' },
    ],
    ordre: ['请', '把', '这些', '东西', '放在', '桌子上'],
    ordreFr: 'Pose ces objets sur la table, s’il te plaît.',
  },

  {
    id: 'bei-passif',
    level: 3,
    categorie: 'phrase',
    titre: '被 : le passif, et pourquoi on l’évite',
    markers: ['被'],
    resume: '被 met en tête ce qui subit. Plus rare qu’en français, et souvent négatif.',
    explication: [
      '我的手机被他拿走了 : « mon téléphone a été emporté par lui ». La structure est : ce qui subit, 被, l’agent, le verbe, puis le résultat.',
      'L’agent peut disparaître si on l’ignore : 我的自行车被借走了.',
      'Le chinois préfère souvent l’actif là où le français passive. Avant de construire une phrase en 被, demande-toi si l’actif ne dirait pas mieux la même chose.',
    ],
    piege:
      '被 porte une nuance désagréable : il arrive quelque chose de fâcheux au sujet. 我被老师帮助了 pour « j’ai été aidé » sonne étrange ; on dit 老师帮助了我.',
    exemples: [
      { zh: '我的手机被他拿走了。', fr: 'Mon téléphone a été emporté par lui.' },
      { zh: '蛋糕被孩子们吃完了。', fr: 'Le gâteau a été fini par les enfants.' },
      { zh: '我的自行车被人借走了。', fr: 'Quelqu’un a emprunté mon vélo.' },
    ],
    ordre: ['我的', '蛋糕', '被', '弟弟', '吃完', '了'],
    ordreFr: 'Mon gâteau a été mangé par mon petit frère.',
  },

  {
    id: 'trois-de',
    level: 3,
    categorie: 'determination',
    titre: '的, 得, 地 : trois mots, une seule prononciation',
    markers: ['的', '得', '地'],
    resume:
      'La place les distingue : 的 devant un nom, 地 devant un verbe, 得 après un verbe.',
    explication: [
      '的 précède un nom et le détermine : 我的书, 很好的朋友.',
      '地 précède un verbe et dit la manière : 慢慢地说.',
      '得 suit un verbe et dit le degré : 说得很好, « parler bien ».',
    ],
    piege:
      'À l’oral, aucune différence : les trois se prononcent « de ». Seule l’écriture tranche, et la règle de place est fiable. Si tu hésites en écrivant, regarde ce qui vient juste après.',
    exemples: [
      { zh: '这是我的词典。', fr: 'C’est mon dictionnaire.' },
      { zh: '他慢慢地走过来。', fr: 'Il s’est approché lentement.' },
      { zh: '他说得很清楚。', fr: 'Il parle très clairement.' },
    ],
    ordre: ['他', '写', '汉字', '写得', '非常', '好'],
    ordreFr: 'Il écrit très bien les caractères.',
  },

  {
    id: 'complement-degre',
    level: 3,
    categorie: 'complement',
    titre: '得 : dire comment l’action est faite',
    markers: ['得'],
    resume: 'Verbe + 得 + appréciation. Notre adverbe, mais placé après.',
    explication: [
      '他说得很好 : « il parle bien ». 得 relie le verbe à son appréciation, qui garde son 很, contrairement à ce qui se passe avec 比.',
      'La négation porte sur l’appréciation, pas sur le verbe : 他说得不好, « il parle mal ».',
      'S’il y a un complément, on répète le verbe : 他说汉语说得很好.',
    ],
    piege:
      '他不说得好 est faux. Ce qui est nié, c’est la qualité, pas l’action : 他说得不好.',
    exemples: [
      { zh: '他说得很好。', fr: 'Il parle très bien.' },
      { zh: '你来得太早了。', fr: 'Tu es arrivé trop tôt.' },
      { zh: '他说汉语说得很清楚。', fr: 'Il parle chinois très clairement.' },
    ],
    ordre: ['我', '弟弟', '跑得', '比', '我', '快'],
    ordreFr: 'Mon petit frère court plus vite que moi.',
  },

  {
    id: 'direction-composee',
    level: 3,
    categorie: 'complement',
    titre: 'Les directions composées : 拿出来, 走进去',
    markers: ['出来', '进去', '回来', '起来'],
    resume: 'Un verbe, puis l’axe (出, 进, 上, 下, 回), puis 来 ou 去.',
    explication: [
      'Trois morceaux s’empilent : 拿出来, « sortir quelque chose en l’amenant vers moi ». 拿 est le geste, 出 l’axe, 来 le point de vue.',
      '起来 a pris des sens figurés très courants : 看起来 « avoir l’air », 听起来 « sonner comme ».',
    ],
    piege:
      'L’empilement n’existe pas en français, qui dit tout avec un seul verbe. Pour construire, décompose : quel geste, dans quelle direction, vu d’où.',
    exemples: [
      { zh: '请把你的护照拿出来。', fr: 'Sortez votre passeport, s’il vous plaît.' },
      { zh: '他走进去了。', fr: 'Il est entré.' },
      { zh: '这件衣服看起来很新。', fr: 'Ce vêtement a l’air neuf.' },
    ],
    ordre: ['他', '从', '箱子里', '拿出来', '一些', '照片'],
    ordreFr: 'Il a sorti des photos de la valise.',
  },

  {
    id: 'complement-potentiel',
    level: 3,
    categorie: 'complement',
    titre: '听得懂 et 听不懂 : le pouvoir, dans le résultat',
    markers: ['得', '不'],
    resume:
      '得 entre le verbe et son résultat : c’est possible. 不 à la même place : ce n’est pas possible.',
    explication: [
      '我听懂了 dit que j’ai compris. 我听得懂 dit que je suis capable de comprendre, et 我听不懂 que je n’en suis pas capable.',
      'La forme négative est de loin la plus fréquente à l’oral : 看不见, 买不到, 找不到.',
      'La question se pose en opposant les deux : 你听得懂听不懂.',
    ],
    piege:
      'Ne passe pas par 能 là où le chinois emploie cette forme. « Je n’arrive pas à le trouver » n’est pas 我不能找到 mais 我找不到.',
    exemples: [
      { zh: '我听不懂。', fr: 'Je n’arrive pas à comprendre.' },
      { zh: '你看得见吗？', fr: 'Tu arrives à voir ?' },
      { zh: '我在商店里找不到那本书。', fr: 'Je n’arrive pas à trouver ce livre dans le magasin.' },
    ],
    ordre: ['我', '一个人', '搬不动', '这个', '箱子'],
    ordreFr: 'Tout seul, je n’arrive pas à déplacer cette valise.',
  },

  {
    id: 'ruguo-jiu',
    level: 3,
    categorie: 'connecteur',
    titre: '如果…的话，就… : l’hypothèse',
    markers: ['如果', '的话', '就'],
    resume: '如果 ouvre l’hypothèse, 就 introduit la conséquence.',
    explication: [
      '如果明天下雨，我就不去了 : « s’il pleut demain, je n’irai pas ». 就 se place après le sujet de la seconde partie.',
      '的话 peut fermer l’hypothèse, et se combine avec 如果 : 如果你有时间的话. Les deux ensemble sont très courants à l’oral.',
      'Le chinois n’a pas de concordance des temps : les deux propositions gardent la même forme verbale.',
    ],
    piege:
      '就 n’est pas « alors » placé en tête. 如果下雨，就我不去 est faux : d’abord le sujet, puis 就.',
    exemples: [
      { zh: '如果明天下雨，我就不去了。', fr: 'S’il pleut demain, je n’irai pas.' },
      { zh: '如果你有时间的话，我们一起去。', fr: 'Si tu as le temps, nous y allons ensemble.' },
      { zh: '如果你不舒服，就休息一下。', fr: 'Si tu ne te sens pas bien, repose-toi.' },
    ],
    ordre: ['如果', '你', '有时间，', '就', '来', '我家', '吃饭'],
    ordreFr: 'Si tu as le temps, viens manger chez moi.',
  },

  {
    id: 'zhiyao-zhiyou',
    level: 3,
    categorie: 'connecteur',
    titre: '只要…就 et 只有…才 : il suffit, ou il faut',
    markers: ['只要', '只有', '才', '就'],
    resume: '只要…就 : il suffit que. 只有…才 : il faut absolument que.',
    explication: [
      '只要你来，我就很高兴 : il suffit que tu viennes. La condition est facile à remplir, et 就 suit.',
      '只有努力，才能提高水平 : seul le travail permet de progresser. La condition est la seule possible, et c’est 才 qui suit.',
      'Le couple est fixe : 只要 va avec 就, 只有 va avec 才.',
    ],
    piege:
      'Le français traduit les deux par « si » ou « seulement si », ce qui écrase la différence. Demande-toi si la condition est suffisante (只要) ou indispensable (只有).',
    exemples: [
      { zh: '只要你来，我就很高兴。', fr: 'Il suffit que tu viennes pour que je sois content.' },
      { zh: '只有努力，才能提高水平。', fr: 'Seul le travail permet de progresser.' },
      { zh: '只要有时间，我就去图书馆。', fr: 'Dès que j’ai le temps, je vais à la bibliothèque.' },
    ],
    ordre: ['只有', '认真', '练习，', '才能', '写好', '汉字'],
    ordreFr: 'Seul un travail sérieux permet de bien écrire les caractères.',
  },

  {
    id: 'budan-erqie',
    level: 3,
    categorie: 'connecteur',
    titre: '不但…而且 : non seulement, mais encore',
    markers: ['不但', '而且', '还'],
    resume: 'Deux qualités du même sujet, la seconde plus forte que la première.',
    explication: [
      '他不但会说汉语，而且说得很好 : « non seulement il parle chinois, mais il le parle bien ».',
      'Si le sujet est le même dans les deux parties, 不但 se place après lui. S’il change, 不但 passe en tête.',
      '而且 peut être remplacé par 也 ou 还 dans un registre plus léger.',
    ],
    piege:
      'La place de 不但 dépend du sujet : même sujet, il vient après ; sujet différent, il vient avant. Le français ne connaît pas cette contrainte.',
    exemples: [
      {
        zh: '他不但会说汉语，而且说得很好。',
        fr: 'Non seulement il parle chinois, mais il le parle bien.',
      },
      { zh: '这个房子不但大，而且很干净。', fr: 'Cette maison est non seulement grande, mais très propre.' },
      {
        zh: '她不但是我的同事，而且是我的邻居。',
        fr: 'Elle est non seulement ma collègue, mais aussi ma voisine.',
      },
    ],
    ordre: ['这个', '地方', '不但', '干净，', '而且', '很', '安静'],
    ordreFr: 'Cet endroit est non seulement propre, mais aussi très calme.',
  },

  {
    id: 'chule-yiwai',
    level: 3,
    categorie: 'connecteur',
    titre: '除了…以外 : à part, ou en plus',
    markers: ['除了', '以外', '都', '还'],
    resume: 'La suite décide du sens : 都 exclut, 还 ajoute.',
    explication: [
      '除了他以外，我们都去了 : « à part lui, nous y sommes tous allés ». Avec 都, l’élément est mis de côté.',
      '除了汉语以外，他还会说别的外语 : « en plus du chinois, il parle d’autres langues ». Avec 还 ou 也, l’élément est inclus.',
      '以外 peut tomber : 除了他，我们都去了.',
    ],
    piege:
      'La même entrée 除了 donne deux sens opposés. Ne traduis pas avant d’avoir lu la fin de la phrase : cherche 都 ou 还.',
    exemples: [
      { zh: '除了他以外，我们都去了。', fr: 'À part lui, nous y sommes tous allés.' },
      { zh: '除了汉语以外，他还会说别的外语。', fr: 'En plus du chinois, il parle d’autres langues.' },
      { zh: '除了星期天，我每天都上班。', fr: 'Sauf le dimanche, je travaille tous les jours.' },
    ],
    ordre: ['除了', '我', '以外，', '他们', '都', '参加了', '比赛'],
    ordreFr: 'À part moi, ils ont tous participé à la compétition.',
  },

  {
    id: 'yue-yue',
    level: 3,
    categorie: 'comparaison',
    titre: '越…越 : plus… plus…',
    markers: ['越'],
    resume: 'Deux 越, un dans chaque partie : la seconde suit la première.',
    explication: [
      '他越说越快 : « plus il parle, plus il va vite ». Le premier 越 porte sur la cause, le second sur l’effet.',
      '越来越 décrit une évolution sans cause nommée : 天气越来越冷, « il fait de plus en plus froid ».',
    ],
    piege:
      'Aucun mot entre 越 et ce qu’il modifie : 越说越快, pas 越说得越快. Et il faut bien deux 越 : un seul ne fait pas la construction.',
    exemples: [
      { zh: '他越说越快。', fr: 'Plus il parle, plus il va vite.' },
      { zh: '天气越来越冷了。', fr: 'Il fait de plus en plus froid.' },
      { zh: '这本书越看越有意思。', fr: 'Plus on lit ce livre, plus il est intéressant.' },
    ],
    ordre: ['这个', '故事', '越', '听', '越', '有意思'],
    ordreFr: 'Plus on écoute cette histoire, plus elle est intéressante.',
  },

  {
    id: 'gen-yiyang',
    level: 3,
    categorie: 'comparaison',
    titre: '跟…一样 : être pareil',
    markers: ['跟', '一样', '像', '好像'],
    resume: 'A 跟 B 一样 + adjectif. L’égalité, là où 比 disait la différence.',
    explication: [
      '我的手机跟你的一样 : « mon téléphone est comme le tien ». On peut préciser sur quoi porte l’égalité : 我跟他一样高.',
      'La négation se place avant 一样 : 我跟他不一样.',
      '像 et 好像 expriment la ressemblance plutôt que l’égalité : 他像他爸爸, 好像要下雨了.',
    ],
    piege:
      'Ne mélange pas les deux structures. 比 cherche une différence et refuse 很 ; 一样 constate une égalité et prend l’adjectif nu. 我跟他一样很高 est faux.',
    exemples: [
      { zh: '我的手机跟你的一样。', fr: 'Mon téléphone est comme le tien.' },
      { zh: '我跟他一样高。', fr: 'Je suis aussi grand que lui.' },
      { zh: '今天的天气跟昨天不一样。', fr: 'Le temps n’est pas le même qu’hier.' },
    ],
    ordre: ['我的', '自行车', '跟', '他的', '一样', '旧'],
    ordreFr: 'Mon vélo est aussi vieux que le sien.',
  },

  {
    id: 'bijiao-geng',
    level: 3,
    categorie: 'comparaison',
    titre: '比较 et 更 : nuancer sans vraiment comparer',
    markers: ['比较', '更', '挺'],
    resume: '比较 atténue, 更 renforce une comparaison déjà posée.',
    explication: [
      '这个比较贵 veut dire « c’est plutôt cher », sans dire par rapport à quoi. 比较 adoucit, il ne compare pas.',
      '更 suppose une comparaison déjà en place : 这个更贵, « celui-ci est encore plus cher ».',
      '挺 est l’équivalent familier de 很 : 挺好的.',
    ],
    piege:
      '比较 ressemble à 比 sans en être la version longue. 这个比较贵 ne compare rien ; 这个比那个贵 compare.',
    exemples: [
      { zh: '这个比较贵。', fr: 'Celui-ci est plutôt cher.' },
      { zh: '这件更贵。', fr: 'Celui-ci est encore plus cher.' },
      { zh: '今天挺热的。', fr: 'Il fait assez chaud aujourd’hui.' },
    ],
    ordre: ['这个', '办法', '比较', '简单，', '也', '更', '方便'],
    ordreFr: 'Cette méthode est plutôt simple, et plus pratique aussi.',
  },

  {
    id: 'cai-jiu',
    level: 3,
    categorie: 'phrase',
    titre: '才 et 就 : trop tard, ou déjà',
    markers: ['才', '就'],
    resume: '就 dit que c’est arrivé tôt ou facilement, 才 que ça a tardé ou coûté.',
    explication: [
      '他七点就来了 : il est arrivé dès sept heures. 他九点才来 : il n’est arrivé qu’à neuf heures. Les deux décrivent le même type de fait et jugent son moment.',
      'Les deux se placent avant le verbe. 才 refuse le 了 final, parce qu’il insiste sur la difficulté plutôt que sur l’achèvement.',
    ],
    piege:
      'Le français rend les deux par « seulement » ou « déjà », mots qu’on peut déplacer. En chinois la place est fixe, avant le verbe, et le choix porte un jugement.',
    exemples: [
      { zh: '他七点就来了。', fr: 'Il est arrivé dès sept heures.' },
      { zh: '他九点才来。', fr: 'Il n’est arrivé qu’à neuf heures.' },
      {
        zh: '我昨天很累，九点就睡觉了。',
        fr: 'J’étais fatigué hier, je me suis couché dès neuf heures.',
      },
    ],
    ordre: ['我', '等了', '一个', '小时，', '他', '才', '来'],
    ordreFr: 'J’ai attendu une heure avant qu’il arrive.',
  },

  {
    id: 'you-zai-hai',
    level: 3,
    categorie: 'phrase',
    titre: '又, 再, 还 : trois façons de refaire',
    markers: ['又', '再', '还'],
    resume: '又 pour ce qui est déjà refait, 再 pour ce qui reste à refaire.',
    explication: [
      '他又来了 : il est revenu, c’est déjà arrivé. 他明天再来 : il reviendra demain, ce n’est pas encore fait.',
      '还 ajoute sans refaire : 我还想吃一点儿, « j’en veux encore un peu ».',
      '又 sert aussi à empiler deux qualités : 又便宜又好.',
    ],
    piege:
      'La règle est simple et pourtant souvent ratée : 又 regarde en arrière, 再 regarde en avant. « Répète » se dit 再说一次, jamais 又说一次.',
    exemples: [
      { zh: '他又来了。', fr: 'Le voilà encore.' },
      { zh: '请再说一次。', fr: 'Répète, s’il te plaît.' },
      { zh: '这个饭馆又便宜又好。', fr: 'Ce restaurant est à la fois bon marché et bon.' },
    ],
    ordre: ['请', '你', '再', '检查', '一', '遍'],
    ordreFr: 'Vérifie encore une fois, s’il te plaît.',
  },

  {
    id: 'hui-neng-keyi',
    level: 3,
    categorie: 'modal',
    titre: '会, 能, 可以 : trois « pouvoir »',
    markers: ['会', '能', '可以'],
    resume: '会 c’est appris, 能 c’est possible maintenant, 可以 c’est permis.',
    explication: [
      '我会说汉语 : j’ai appris, je sais. 我能说汉语 ajouterait que rien ne m’en empêche à cet instant.',
      '可以 demande ou accorde la permission : 我可以进来吗.',
      '会 sert aussi à la probabilité : 明天会下雨, « il va pleuvoir demain ».',
    ],
    piege:
      'Pour une compétence acquise, c’est 会 et pas 能. 我能说汉语 s’entend, mais répond à une autre question : « est-ce que tu peux, là, maintenant ? »',
    exemples: [
      { zh: '我会说一点儿汉语。', fr: 'Je parle un peu chinois.' },
      { zh: '我今天不能去，我很忙。', fr: 'Je ne peux pas y aller aujourd’hui, je suis très occupé.' },
      { zh: '明天可能会下雨。', fr: 'Il va peut-être pleuvoir demain.' },
    ],
    ordre: ['我', '姐姐', '会', '说', '三', '种', '外语'],
    ordreFr: 'Ma grande sœur parle trois langues étrangères.',
  },

  {
    id: 'bixu-yinggai',
    level: 3,
    categorie: 'modal',
    titre: '必须, 应该, 需要 : trois « devoir »',
    markers: ['必须', '应该', '需要', '不用'],
    resume: '必须 l’obligation, 应该 le conseil, 需要 le besoin.',
    explication: [
      '你必须去 : tu dois y aller, sans discussion. 你应该去 : tu devrais, ce serait mieux. 你需要休息 : tu as besoin de repos.',
      'La négation de 必须 n’est pas 不必须 mais 不用 : 你不用去, « ce n’est pas la peine ».',
      '得, prononcé « děi », est la forme orale de 必须 : 我得走了.',
    ],
    piege:
      'Chercher 不必须 est le réflexe naturel, et c’est une impasse. L’obligation se nie par 不用, qui retire la nécessité au lieu de l’interdire.',
    exemples: [
      { zh: '你必须先完成作业。', fr: 'Tu dois d’abord finir tes devoirs.' },
      { zh: '你应该早一点儿睡觉。', fr: 'Tu devrais te coucher plus tôt.' },
      { zh: '你不用担心，没事。', fr: 'Pas besoin de t’inquiéter, tout va bien.' },
    ],
    ordre: ['你', '必须', '先', '完成', '今天的', '作业'],
    ordreFr: 'Tu dois d’abord finir les devoirs d’aujourd’hui.',
  },
]
