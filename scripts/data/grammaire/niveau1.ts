import type { PointSource } from './types.ts'

/**
 * Grammaire du niveau 1 : la charpente de la phrase.
 *
 * Tous les exemples n'emploient que le vocabulaire du niveau 1. La contrainte
 * est forte et elle est voulue : une fiche qui illustre l'ordre des mots avec
 * un mot inconnu fait travailler deux choses à la fois, et n'en apprend
 * aucune.
 */
export const NIVEAU_1: readonly PointSource[] = [
  {
    id: 'ordre-de-base',
    level: 1,
    categorie: 'phrase',
    titre: 'L’ordre de base : qui, fait quoi, sur quoi',
    markers: [],
    resume: 'Sujet, puis verbe, puis complément. Cet ordre ne bouge presque jamais.',
    explication: [
      'Le chinois place le sujet avant le verbe et le complément après, comme le français. 我喝茶 se lit mot à mot « je bois thé » : tant que la phrase reste simple, tu peux traduire dans l’ordre.',
      'La différence apparaît dès qu’on ajoute un moment ou un lieu. Ces éléments se glissent entre le sujet et le verbe, là où le français les rejette souvent à la fin. 我今天在家吃饭 veut dire « aujourd’hui, je mange à la maison ».',
    ],
    piege:
      'Ne traduis pas « je mange à la maison » en plaçant 在家 après 吃饭. Tout ce qui situe l’action passe devant le verbe.',
    exemples: [
      { zh: '我喝茶。', fr: 'Je bois du thé.' },
      { zh: '妈妈做饭。', fr: 'Maman fait la cuisine.' },
      { zh: '我今天在家吃饭。', fr: 'Aujourd’hui, je mange à la maison.' },
    ],
    ordre: ['我', '今天', '在家', '吃饭'],
    ordreFr: 'Aujourd’hui, je mange à la maison.',
    ordreAussi: [['今天', '我', '在家', '吃饭']],
  },

  {
    id: 'verbe-invariable',
    level: 1,
    categorie: 'phrase',
    titre: 'Le verbe ne change jamais',
    markers: [],
    resume: 'Pas de conjugaison : la même forme pour je, tu, il, hier et demain.',
    explication: [
      '是 reste 是 avec tous les sujets. Il n’y a ni personne, ni nombre, ni temps dans la forme du verbe : 我是学生 et 他们是学生 emploient exactement le même mot.',
      'Ce que le français porte dans la terminaison, le chinois le porte ailleurs : un mot de temps comme 昨天, une particule comme 了, ou simplement le contexte.',
    ],
    piege:
      'L’économie est réelle, mais elle a un prix : rien ne signale le temps si tu ne le dis pas. 我去学校 peut se comprendre « j’y vais », « j’y vais d’habitude » ou « j’irai ». Ajoute 昨天, 今天 ou 明天 dès que ça compte.',
    exemples: [
      { zh: '我是学生。', fr: 'Je suis étudiant.' },
      { zh: '他们都是学生。', fr: 'Ils sont tous étudiants.' },
      { zh: '我昨天去学校。', fr: 'Hier, je suis allé à l’école.' },
    ],
    ordre: ['我们', '明天', '去', '她的', '学校'],
    ordreFr: 'Demain, nous allons à son école.',
    ordreAussi: [['明天', '我们', '去', '她的', '学校']],
  },

  {
    id: 'shi-deux-noms',
    level: 1,
    categorie: 'phrase',
    titre: '是 relie deux noms, jamais un adjectif',
    markers: ['是'],
    resume: '是 veut dire « être » entre deux noms. Devant un adjectif, il disparaît.',
    explication: [
      '是 met un signe d’égalité entre deux groupes nominaux : 他是医生, 这是我的书. On peut presque toujours le remplacer par « c’est ».',
      'Devant un adjectif, le chinois ne met pas 是 : on dit 天气很好, pas 天气是很好. L’adjectif chinois se comporte comme un verbe, il n’a besoin de rien pour s’accrocher au sujet.',
    ],
    piege:
      'C’est l’erreur de débutant la plus fréquente chez les francophones, parce que « il est grand » et « il est médecin » ont la même forme en français. En chinois ce sont deux constructions différentes : 他是医生 mais 他很高.',
    exemples: [
      { zh: '他是我的老师。', fr: 'C’est mon professeur.' },
      { zh: '这不是我的手机。', fr: 'Ce n’est pas mon téléphone.' },
      { zh: '今天的天气很好。', fr: 'Le temps est beau aujourd’hui.' },
    ],
    ordre: ['那个女士', '是', '我妈妈的', '朋友'],
    ordreFr: 'Cette dame est une amie de ma mère.',
  },

  {
    id: 'adjectif-hen',
    level: 1,
    categorie: 'phrase',
    titre: '很 + adjectif : le 很 qui ne veut pas dire « très »',
    markers: ['很', '太', '非常', '真'],
    resume: 'Un adjectif seul sonne comme une comparaison inachevée. 很 le rend neutre.',
    explication: [
      '他高 n’est pas une phrase finie : elle appelle une suite, « il est plus grand que… ». Pour dire simplement « il est grand », on met 很 devant : 他很高.',
      'Ce 很 ne porte donc pas de sens d’intensité, c’est un support. Pour insister vraiment, emploie 非常 ou 真. 太 ajoute l’excès et appelle souvent 了 : 太贵了.',
    ],
    piege:
      'Ne traduis pas 他很高 par « il est très grand ». La traduction juste est « il est grand ». Pour « très », il faut 非常.',
    exemples: [
      { zh: '这个苹果很好吃。', fr: 'Cette pomme est bonne.' },
      { zh: '这件衣服太贵了。', fr: 'Ce vêtement est trop cher.' },
      { zh: '今天非常热。', fr: 'Il fait très chaud aujourd’hui.' },
    ],
    ordre: ['这些', '水果', '都', '非常', '好吃'],
    ordreFr: 'Tous ces fruits sont très bons.',
  },

  {
    id: 'negation-bu',
    level: 1,
    categorie: 'negation',
    titre: '不 : nier ce qui n’a pas lieu',
    markers: ['不'],
    resume: '不 devant le verbe, pour le présent, le futur, le goût et l’habitude.',
    explication: [
      '不 se place juste avant le verbe ou l’adjectif : 我不去, 他不忙. Il nie une volonté, une habitude, un état, ou un fait à venir.',
      'Avec un verbe en deux parties, 不 se glisse devant le premier élément : 我不想去, 我不可以去.',
    ],
    piege:
      '不 ne nie jamais un fait passé. « Je n’y suis pas allé hier » n’est pas 我昨天不去 mais 我昨天没去. Le passé a sa propre négation.',
    exemples: [
      { zh: '我不喝茶。', fr: 'Je ne bois pas de thé.' },
      { zh: '他今天不忙。', fr: 'Il n’est pas occupé aujourd’hui.' },
      { zh: '我不想去商店。', fr: 'Je ne veux pas aller au magasin.' },
    ],
    ordre: ['我', '明天', '不想', '去', '学校'],
    ordreFr: 'Demain, je ne veux pas aller à l’école.',
    ordreAussi: [['明天', '我', '不想', '去', '学校']],
  },

  {
    id: 'negation-mei',
    level: 1,
    categorie: 'negation',
    titre: '没 : ce qui n’a pas eu lieu, et ce qu’on n’a pas',
    markers: ['没有', '没'],
    resume: '没 nie le passé et la possession. Il fait aussi tomber le 了.',
    explication: [
      '没有 est la seule négation possible de 有 : 我没有钱. Devant un autre verbe, on peut dire 没 tout court : 我没吃饭.',
      'Devant un verbe, 没 dit que l’action n’a pas eu lieu. Et comme elle n’a pas eu lieu, le 了 de l’accompli disparaît : 我吃了饭 devient 我没吃饭.',
    ],
    piege:
      'Deux fautes à éviter du même coup : 不有 n’existe pas, et 没…了 non plus. Demande-toi si l’action a eu lieu ; si la réponse est non et qu’il s’agit du passé, c’est 没.',
    exemples: [
      { zh: '我没有钱。', fr: 'Je n’ai pas d’argent.' },
      { zh: '我昨天没有看电视。', fr: 'Je n’ai pas regardé la télévision hier.' },
      { zh: '他还没有来。', fr: 'Il n’est pas encore arrivé.' },
    ],
    ordre: ['我', '昨天', '没有', '看见', '他'],
    ordreFr: 'Hier, je ne l’ai pas vu.',
    ordreAussi: [['昨天', '我', '没有', '看见', '他']],
  },

  {
    id: 'question-ma',
    level: 1,
    categorie: 'question',
    titre: '吗 : la question qui ne change rien à la phrase',
    markers: ['吗', '吧', '呢'],
    resume: 'Garde la phrase telle quelle et ajoute 吗 à la fin.',
    explication: [
      'Pas d’inversion, pas de « est-ce que » : 你是学生 devient 你是学生吗. L’ordre des mots reste identique, ce qui en fait la question la plus simple du chinois.',
      '吧 pose une question dont on croit déjà connaître la réponse, « tu es étudiant, non ? ». 呢 renvoie la question sans la répéter : 我很好，你呢.',
    ],
    piege:
      '吗 ne s’ajoute pas à une phrase qui contient déjà un mot interrogatif. 你去哪里吗 est faux : 哪里 pose déjà la question.',
    exemples: [
      { zh: '你是学生吗？', fr: 'Es-tu étudiant ?' },
      { zh: '这个贵吗？', fr: 'Est-ce que c’est cher ?' },
      { zh: '我很好，你呢？', fr: 'Je vais bien, et toi ?' },
    ],
    ordre: ['你', '今天', '下午', '有', '时间', '吗'],
    ordreFr: 'As-tu du temps cet après-midi ?',
  },

  {
    id: 'question-mot-interrogatif',
    level: 1,
    categorie: 'question',
    titre: 'Les mots interrogatifs restent à leur place',
    markers: ['什么', '谁', '哪里', '几', '多少'],
    resume: 'Mets le mot interrogatif exactement là où se trouverait la réponse.',
    explication: [
      'Le chinois ne déplace rien : la question se construit en remplaçant l’inconnue par 谁, 什么, 哪里… 他吃饭 devient 他吃什么, et 你去学校 devient 你去哪里.',
      'C’est une bonne nouvelle pour apprendre : formule d’abord la réponse, puis remplace le mot qui te manque.',
    ],
    piege:
      'Le français déplace le mot interrogatif en tête, « que mange-t-il ? ». Le chinois jamais : 什么他吃 n’a aucun sens.',
    exemples: [
      { zh: '你去哪里？', fr: 'Où vas-tu ?' },
      { zh: '他吃什么？', fr: 'Que mange-t-il ?' },
      { zh: '这是谁的书？', fr: 'À qui est ce livre ?' },
    ],
    ordre: ['你们', '明天', '想', '吃', '什么'],
    ordreFr: 'Qu’est-ce que vous voulez manger demain ?',
    ordreAussi: [['明天', '你们', '想', '吃', '什么']],
  },

  {
    id: 'question-a-pas-a',
    level: 1,
    categorie: 'question',
    titre: '去不去 : la question par répétition',
    markers: [],
    resume: 'Verbe, puis 不, puis le même verbe : « tu y vas ou pas ? »',
    explication: [
      '你去吗 et 你去不去 posent la même question. La seconde répète le verbe autour de 不 et sonne plus directe, plus orale.',
      'Elle marche avec les adjectifs (贵不贵) et avec 是 (是不是). Avec un verbe de deux syllabes, on peut n’en répéter qu’une : 喜欢不喜欢 ou 喜不喜欢.',
    ],
    piege:
      'Cette forme refuse 吗 : 你去不去吗 est faux. Elle refuse aussi 很 : on ne dit pas 很贵不贵.',
    exemples: [
      { zh: '你去不去？', fr: 'Tu y vas, ou pas ?' },
      { zh: '这个贵不贵？', fr: 'C’est cher, ou pas ?' },
      { zh: '你是不是学生？', fr: 'Tu es étudiant, oui ou non ?' },
    ],
    ordre: ['你', '喜欢', '不', '喜欢', '这个', '电影'],
    ordreFr: 'Est-ce que tu aimes ce film ?',
  },

  {
    id: 'de-determination',
    level: 1,
    categorie: 'determination',
    titre: '的 : tout ce qui précise vient avant le nom',
    markers: ['的'],
    resume:
      'Le possesseur, l’adjectif, la précision : tout passe devant le nom, relié par 的.',
    explication: [
      '的 relie un déterminant à son nom, dans l’ordre inverse du français : 我的书 « mon livre », 老师的名字 « le nom du professeur ».',
      'On l’omet pour les liens de famille proches et les appartenances évidentes : 我妈妈, 我们公司. Avec un adjectif accompagné de 很, 的 revient : 很好的朋友.',
    ],
    piege:
      'L’ordre est le contraire du français, qui met le complément après le nom. « Le livre du professeur » se construit 老师的书, littéralement « professeur de livre ».',
    exemples: [
      { zh: '这是我的手机。', fr: 'C’est mon téléphone.' },
      { zh: '老师的名字很好听。', fr: 'Le nom du professeur est joli.' },
      { zh: '他是我哥哥的朋友。', fr: 'C’est un ami de mon frère.' },
    ],
    ordre: ['这些', '是', '我弟弟的', '衣服'],
    ordreFr: 'Ce sont les vêtements de mon petit frère.',
  },

  {
    id: 'classificateurs',
    level: 1,
    categorie: 'mesure',
    titre: 'Les classificateurs : un mot entre le nombre et le nom',
    markers: ['个', '本', '件', '块', '口'],
    resume: 'Jamais de nombre directement devant un nom : il faut un classificateur.',
    explication: [
      'On ne dit pas 三书 mais 三本书. Entre le nombre et le nom se place un mot choisi selon la nature de l’objet : 本 pour les livres, 件 pour les vêtements, 块 pour les morceaux, 口 pour les personnes d’un foyer.',
      '个 est le passe-partout : il fonctionne avec presque tout et sauve n’importe quelle phrase. Mieux vaut un 个 approximatif qu’un blocage.',
      '这, 那 et 几 se comportent comme des nombres et demandent eux aussi un classificateur : 这本书, 几个人.',
    ],
    piege:
      'Le français a quelque chose de comparable dans « trois tranches de pain », mais c’est facultatif. En chinois le classificateur est obligatoire : il n’existe pas de forme courte.',
    exemples: [
      { zh: '我买了三本书。', fr: 'J’ai acheté trois livres.' },
      { zh: '这件衣服很漂亮。', fr: 'Ce vêtement est très beau.' },
      { zh: '我家有四口人。', fr: 'Nous sommes quatre à la maison.' },
    ],
    ordre: ['我', '昨天', '买了', '两件', '衣服'],
    ordreFr: 'Hier, j’ai acheté deux vêtements.',
    ordreAussi: [['昨天', '我', '买了', '两件', '衣服']],
  },

  {
    id: 'place-du-temps',
    level: 1,
    categorie: 'phrase',
    titre: 'Le temps se dit avant le verbe, du plus grand au plus petit',
    markers: ['今天', '明天', '现在'],
    resume: 'Le moment vient en tête de phrase ou juste après le sujet, jamais à la fin.',
    explication: [
      '明天我去学校 et 我明天去学校 sont tous deux corrects. En tête, le moment cadre toute la phrase ; après le sujet, il porte sur l’action.',
      'À l’intérieur d’une date ou d’une heure, l’ordre va du plus grand au plus petit : 今天早上七点, « aujourd’hui, matin, sept heures ». C’est l’inverse du français, et la règle vaut aussi pour les lieux.',
    ],
    piege:
      '我去学校明天 est faux. Dès qu’un mot de temps apparaît en fin de phrase française, il faut le remonter.',
    exemples: [
      { zh: '我明天去学校。', fr: 'J’irai à l’école demain.' },
      { zh: '他现在在家。', fr: 'Il est à la maison en ce moment.' },
      { zh: '我今天早上七点起床。', fr: 'Je me suis levé à sept heures ce matin.' },
    ],
    ordre: ['我', '昨天', '晚上', '看了', '一个', '电影'],
    ordreFr: 'Hier soir, j’ai vu un film.',
    ordreAussi: [['昨天', '晚上', '我', '看了', '一个', '电影']],
  },

  {
    id: 'zai-lieu',
    level: 1,
    categorie: 'phrase',
    titre: '在 : où l’on est, où l’on fait',
    markers: ['在'],
    resume:
      '在 + lieu. Seul, il veut dire « se trouver » ; devant un verbe, il situe l’action.',
    explication: [
      'Employé comme verbe, 在 dit la localisation : 他在家. Il n’a alors besoin d’aucun 是.',
      'Placé entre le sujet et le verbe, il situe l’action : 我在家吃饭. L’ordre est toujours sujet, lieu, verbe.',
    ],
    piege:
      'Le lieu ne se met pas après le verbe. « Je mange à la maison » n’est pas 我吃饭在家 mais 我在家吃饭. C’est une des erreurs les plus tenaces, parce que le français fait exactement l’inverse.',
    exemples: [
      { zh: '他在家。', fr: 'Il est à la maison.' },
      { zh: '我在学校学习。', fr: 'J’étudie à l’école.' },
      { zh: '我妈妈在医院工作。', fr: 'Ma mère travaille à l’hôpital.' },
    ],
    ordre: ['我姐姐', '在', '那个', '商店', '工作'],
    ordreFr: 'Ma grande sœur travaille dans ce magasin.',
  },

  {
    id: 'le-accompli',
    level: 1,
    categorie: 'aspect',
    titre: '了 : l’action est allée au bout',
    markers: ['了'],
    resume: '了 après le verbe marque l’achèvement, et non le passé.',
    explication: [
      '了 dit que l’action est accomplie : 我吃了饭, « j’ai mangé ». Il se place juste après le verbe, avant le complément s’il y en a un.',
      'Ce n’est pas un temps du passé mais une étape franchie, ce qui explique qu’on le trouve aussi dans des phrases tournées vers l’avenir. Inversement, une habitude passée se raconte sans 了.',
    ],
    piege:
      'La négation fait tomber 了 : 我没吃饭, jamais 我没吃了饭. Une action qui n’a pas eu lieu ne peut pas être achevée.',
    exemples: [
      { zh: '我吃了饭。', fr: 'J’ai mangé.' },
      { zh: '他买了两本书。', fr: 'Il a acheté deux livres.' },
      { zh: '我昨天看了那个电影。', fr: 'J’ai vu ce film hier.' },
    ],
    ordre: ['我', '今天', '上午', '买了', '一些', '水果'],
    ordreFr: 'J’ai acheté des fruits ce matin.',
    ordreAussi: [['今天', '上午', '我', '买了', '一些', '水果']],
  },

  {
    id: 'ye-dou',
    level: 1,
    categorie: 'phrase',
    titre: '也 et 都 se placent avant le verbe',
    markers: ['也', '都', '还', '只'],
    resume: 'Les adverbes courts vivent entre le sujet et le verbe.',
    explication: [
      '也 « aussi » et 都 « tous » ne se déplacent pas en fin de phrase comme en français : 我也去, 我们都去. Quand les deux apparaissent, 也 passe devant : 我们也都去.',
      'La même place accueille 还, 只, 再 et les autres adverbes courts.',
    ],
    piege:
      '都 porte sur ce qui est avant lui, pas après. 我们都喜欢 veut dire « nous aimons tous », et non « nous aimons tout ».',
    exemples: [
      { zh: '我也想去。', fr: 'Moi aussi, je veux y aller.' },
      { zh: '他们都是我的同学。', fr: 'Ce sont tous mes camarades.' },
      { zh: '我们都很喜欢这里。', fr: 'Nous aimons tous beaucoup cet endroit.' },
    ],
    ordre: ['我的', '朋友', '也', '都', '喜欢', '中国菜'],
    ordreFr: 'Mes amis aussi aiment tous la cuisine chinoise.',
  },

  {
    id: 'modaux-de-base',
    level: 1,
    categorie: 'modal',
    titre: '想, 要, 能, 可以 : vouloir et pouvoir',
    markers: ['想', '要', '能', '可以'],
    resume: 'Quatre verbes qui se placent devant un autre verbe, avec quatre nuances.',
    explication: [
      '想 est l’envie : 我想喝茶, « j’ai envie de boire du thé ». 要 est plus ferme, c’est la volonté ou la commande : 我要一杯茶.',
      '能 est la capacité ou la possibilité du moment : 我今天不能去. 可以 est la permission : 我可以进来吗.',
      'Tous se nient avec 不 placé devant eux : 不想, 不能, 不可以.',
    ],
    piege:
      '要 peut heurter : il est normal au restaurant, brusque adressé à une personne. Et 不要 ne veut pas dire « ne pas vouloir » : c’est une interdiction, « ne fais pas ».',
    exemples: [
      { zh: '我想喝一点儿茶。', fr: 'J’aimerais boire un peu de thé.' },
      { zh: '我今天不能去你家。', fr: 'Je ne peux pas aller chez toi aujourd’hui.' },
      { zh: '我可以问一个问题吗？', fr: 'Puis-je poser une question ?' },
    ],
    ordre: ['我', '今天', '不能', '去', '你的', '公司'],
    ordreFr: 'Je ne peux pas aller à ton entreprise aujourd’hui.',
    ordreAussi: [['今天', '我', '不能', '去', '你的', '公司']],
  },
]
