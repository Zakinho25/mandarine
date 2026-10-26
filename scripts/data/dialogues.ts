/**
 * Dialogues guidés.
 *
 * Ce ne sont pas des conversations avec une intelligence artificielle, et
 * l'application ne le prétend nulle part. Ce sont des arbres de dialogue
 * écrits à l'avance : à chaque tour, trois façons de répondre, dont certaines
 * sont justes, d'autres maladroites, d'autres hors de propos.
 *
 * Pour du HSK 1 à 3, les échanges du quotidien sont formulaires. Un arbre
 * couvre l'essentiel, fonctionne hors ligne et ne coûte rien.
 *
 * ### Les corrections viennent à la fin
 *
 * Le cahier des charges est explicite : les corrections arrivent **après**
 * l'échange, pas en l'interrompant. Pendant le dialogue, aucun retour n'est
 * donné, pas même une couleur. Couper quelqu'un à chaque phrase pour lui dire
 * qu'il aurait pu mieux dire est le plus sûr moyen de lui ôter l'envie de
 * parler.
 */

export type Qualite = 'juste' | 'maladroit' | 'inadapte'

export interface Replique {
  readonly zh: string
  readonly fr: string
  readonly qualite: Qualite
  /** Commentaire affiché dans le bilan, jamais pendant l'échange. */
  readonly note?: string
  /** Nœud suivant, `null` pour terminer. */
  readonly next: string | null
}

export interface Noeud {
  readonly id: string
  /** Ce que dit l'interlocuteur. */
  readonly zh: string
  readonly fr: string
  readonly repliques: readonly Replique[]
}

export interface ScenarioSource {
  readonly id: string
  readonly level: 1 | 2 | 3
  readonly titleZh: string
  readonly titleFr: string
  /** Qui est en face, en français. */
  readonly role: string
  readonly situation: string
  readonly unit: string
  readonly start: string
  readonly nodes: readonly Noeud[]
  /** Noms propres admis hors vocabulaire. */
  readonly proper?: readonly string[]
}

export const DIALOGUES: readonly ScenarioSource[] = [
  // ------------------------------------------------------------------ HSK 1
  {
    id: 'hsk1-se-presenter',
    level: 1,
    titleZh: '认识新同学',
    titleFr: 'Se présenter',
    role: 'Un nouveau camarade de classe',
    situation:
      'C’est ton premier jour à l’université. Quelqu’un vient te parler avant le cours.',
    unit: 'presentation',
    proper: ['王明', '马丁', '法国'],
    start: 'n1',
    nodes: [
      {
        id: 'n1',
        zh: '你好！我叫王明。你叫什么名字？',
        fr: 'Bonjour ! Je m’appelle Wang Ming. Comment t’appelles-tu ?',
        repliques: [
          { zh: '你好！我叫马丁。', fr: 'Bonjour ! Je m’appelle Martin.', qualite: 'juste', next: 'n2' },
          {
            zh: '我是马丁。',
            fr: 'Je suis Martin.',
            qualite: 'maladroit',
            note: 'Compréhensible, mais 我叫… est la formule normale pour donner son nom. 我是… sert plutôt à dire ce qu’on est.',
            next: 'n2',
          },
          {
            zh: '你好吗？',
            fr: 'Comment vas-tu ?',
            qualite: 'inadapte',
            note: 'Il te demande ton nom, pas comment tu vas. Et 你好吗 s’emploie entre gens qui se connaissent déjà.',
            next: 'n2',
          },
        ],
      },
      {
        id: 'n2',
        zh: '马丁，你是哪国人？',
        fr: 'Martin, de quel pays viens-tu ?',
        repliques: [
          { zh: '我是法国人。', fr: 'Je suis français.', qualite: 'juste', next: 'n3' },
          {
            zh: '法国。',
            fr: 'La France.',
            qualite: 'maladroit',
            note: 'On comprend, mais la phrase complète 我是法国人 se dit aussi vite et sonne beaucoup mieux.',
            next: 'n3',
          },
          {
            zh: '我在法国。',
            fr: 'Je suis en France.',
            qualite: 'inadapte',
            note: '在 situe où tu te trouves. Pour dire d’où tu viens, il faut 是…人.',
            next: 'n3',
          },
        ],
      },
      {
        id: 'n3',
        zh: '你会说汉语吗？',
        fr: 'Tu parles chinois ?',
        repliques: [
          { zh: '我会说一点儿。', fr: 'J’en parle un peu.', qualite: 'juste', next: 'n4' },
          {
            zh: '会。',
            fr: 'Oui.',
            qualite: 'maladroit',
            note: 'Répondre par le verbe seul est correct en chinois, mais ici un mot de plus rend l’échange plus vivant.',
            next: 'n4',
          },
          {
            zh: '我不知道。',
            fr: 'Je ne sais pas.',
            qualite: 'inadapte',
            note: 'Tu sais forcément si tu parles chinois ou non. 不知道 répond à une question de fait, pas à une question sur toi.',
            next: 'n4',
          },
        ],
      },
      {
        id: 'n4',
        zh: '很好！你学习什么？',
        fr: 'Très bien ! Qu’est-ce que tu étudies ?',
        repliques: [
          { zh: '我在大学学习汉语。', fr: 'J’étudie le chinois à l’université.', qualite: 'juste', next: 'n5' },
          { zh: '我学汉语。', fr: 'J’apprends le chinois.', qualite: 'juste', next: 'n5' },
          {
            zh: '我是学生。',
            fr: 'Je suis étudiant.',
            qualite: 'inadapte',
            note: 'Vrai, mais il demandait la matière. Tu réponds à une autre question que celle qui est posée.',
            next: 'n5',
          },
        ],
      },
      {
        id: 'n5',
        zh: '太好了！认识你很高兴。',
        fr: 'Formidable ! Enchanté de te connaître.',
        repliques: [
          { zh: '认识你我也很高兴。', fr: 'Enchanté également.', qualite: 'juste', next: null },
          { zh: '谢谢，再见！', fr: 'Merci, au revoir !', qualite: 'juste', next: null },
          {
            zh: '不客气。',
            fr: 'Je t’en prie.',
            qualite: 'inadapte',
            note: '不客气 répond à un remerciement. Ici il ne t’a pas remercié, il s’est dit content de te connaître.',
            next: null,
          },
        ],
      },
    ],
  },
  {
    id: 'hsk1-au-magasin',
    level: 1,
    titleZh: '在商店买东西',
    titleFr: 'Faire des courses',
    role: 'Le vendeur',
    situation: 'Tu entres dans un petit magasin pour acheter de quoi manger.',
    unit: 'achats',
    start: 'n1',
    nodes: [
      {
        id: 'n1',
        zh: '你好，你要什么？',
        fr: 'Bonjour, que désirez-vous ?',
        repliques: [
          { zh: '我要买水果。', fr: 'Je voudrais acheter des fruits.', qualite: 'juste', next: 'n2' },
          {
            zh: '水果。',
            fr: 'Des fruits.',
            qualite: 'maladroit',
            note: 'Le mot seul passe, mais 我要买… est la formule attendue et reste simple.',
            next: 'n2',
          },
          {
            zh: '我很好，谢谢。',
            fr: 'Je vais bien, merci.',
            qualite: 'inadapte',
            note: '你要什么 demande ce que tu veux acheter, pas comment tu vas.',
            next: 'n2',
          },
        ],
      },
      {
        id: 'n2',
        zh: '我们有苹果，很好吃。你要几个？',
        fr: 'Nous avons des pommes, elles sont très bonnes. Vous en voulez combien ?',
        repliques: [
          { zh: '我要四个。', fr: 'J’en veux quatre.', qualite: 'juste', next: 'n3' },
          {
            zh: '四。',
            fr: 'Quatre.',
            qualite: 'maladroit',
            note: 'En chinois un nombre ne se dit presque jamais seul devant un nom : il faut le classificateur, ici 个.',
            next: 'n3',
          },
          {
            zh: '我不要。',
            fr: 'Je n’en veux pas.',
            qualite: 'inadapte',
            note: 'Tu viens de dire que tu voulais des fruits. Ça coupe l’échange sans raison.',
            next: 'n3',
          },
        ],
      },
      {
        id: 'n3',
        zh: '好的。还要什么吗？',
        fr: 'Très bien. Autre chose ?',
        repliques: [
          { zh: '我还要两个鸡蛋。', fr: 'Je voudrais aussi deux œufs.', qualite: 'juste', next: 'n4' },
          { zh: '不要了，谢谢。', fr: 'Non merci, ce sera tout.', qualite: 'juste', next: 'n4' },
          {
            zh: '多少钱？',
            fr: 'Combien ça coûte ?',
            qualite: 'maladroit',
            note: 'Tu sautes une étape : il te demande si tu veux autre chose. Le prix vient juste après.',
            next: 'n4',
          },
        ],
      },
      {
        id: 'n4',
        zh: '二十块钱。',
        fr: 'Vingt yuans.',
        repliques: [
          { zh: '给你。', fr: 'Tenez.', qualite: 'juste', next: 'n5' },
          {
            zh: '太贵了。',
            fr: 'C’est trop cher.',
            qualite: 'maladroit',
            note: 'Ça se dit, mais dans un magasin à prix fixes ça surprend. Ce serait naturel au marché.',
            next: 'n5',
          },
          {
            zh: '对不起。',
            fr: 'Excusez-moi.',
            qualite: 'inadapte',
            note: '对不起 sert à s’excuser. Il t’annonce un prix, il n’y a rien à excuser.',
            next: 'n5',
          },
        ],
      },
      {
        id: 'n5',
        zh: '谢谢，再见！',
        fr: 'Merci, au revoir !',
        repliques: [
          { zh: '再见！', fr: 'Au revoir !', qualite: 'juste', next: null },
          { zh: '谢谢你，再见。', fr: 'Merci à vous, au revoir.', qualite: 'juste', next: null },
          {
            zh: '不客气。',
            fr: 'De rien.',
            qualite: 'inadapte',
            note: 'C’est lui qui te remercie pour ton achat. 不客气 ici renverse les rôles.',
            next: null,
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------ HSK 2
  {
    id: 'hsk2-au-restaurant',
    level: 2,
    titleZh: '在饭馆点菜',
    titleFr: 'Commander au restaurant',
    role: 'Le serveur',
    situation: 'Tu arrives à deux dans un petit restaurant, à l’heure du déjeuner.',
    unit: 'nourriture',
    start: 'n1',
    nodes: [
      {
        id: 'n1',
        zh: '你好，几位？',
        fr: 'Bonjour, vous êtes combien ?',
        repliques: [
          { zh: '两位。', fr: 'Deux.', qualite: 'juste', next: 'n2' },
          { zh: '我们是两个人。', fr: 'Nous sommes deux personnes.', qualite: 'juste', next: 'n2' },
          {
            zh: '你好。',
            fr: 'Bonjour.',
            qualite: 'inadapte',
            note: 'Tu salues sans répondre. Il attend un nombre pour choisir la table.',
            next: 'n2',
          },
        ],
      },
      {
        id: 'n2',
        zh: '请坐。你们要吃什么？',
        fr: 'Asseyez-vous. Que voulez-vous manger ?',
        repliques: [
          { zh: '我们要吃鱼和米饭。', fr: 'Nous voudrions du poisson et du riz.', qualite: 'juste', next: 'n3' },
          {
            zh: '鱼。',
            fr: 'Du poisson.',
            qualite: 'maladroit',
            note: 'Le plat seul suffit à se faire comprendre, mais une phrase complète est plus polie et à peine plus longue.',
            next: 'n3',
          },
          {
            zh: '我不知道。',
            fr: 'Je ne sais pas.',
            qualite: 'maladroit',
            note: 'Honnête, mais sans suite. Ajoute une question : 你们有什么？ fait avancer l’échange.',
            next: 'n3',
          },
        ],
      },
      {
        id: 'n3',
        zh: '好的。要喝什么吗？',
        fr: 'Très bien. Vous voulez boire quelque chose ?',
        repliques: [
          { zh: '我们要茶，谢谢。', fr: 'Du thé, merci.', qualite: 'juste', next: 'n4' },
          {
            zh: '水。',
            fr: 'De l’eau.',
            qualite: 'maladroit',
            note: 'Compréhensible. 我要水 reste plus naturel qu’un mot isolé.',
            next: 'n4',
          },
          {
            zh: '不要。',
            fr: 'Non.',
            qualite: 'maladroit',
            note: 'Un peu sec. 不用了，谢谢 serait la façon polie de refuser.',
            next: 'n4',
          },
        ],
      },
      {
        id: 'n4',
        // 没问题 serait naturel ici, mais ni 没问题 ni 没 seul ne figurent au
        // programme avant le niveau 3 : le vérificateur l'a refusé.
        zh: '好，请等一会儿。',
        fr: 'Très bien, un instant s’il vous plaît.',
        repliques: [
          { zh: '好的，谢谢。', fr: 'D’accord, merci.', qualite: 'juste', next: 'n5' },
          {
            zh: '快一点儿。',
            fr: 'Dépêchez-vous.',
            qualite: 'inadapte',
            note: 'Donner un ordre au serveur est impoli. Si tu es pressé, mieux vaut le dire avant de commander.',
            next: 'n5',
          },
          {
            zh: '为什么？',
            fr: 'Pourquoi ?',
            qualite: 'inadapte',
            note: 'Il t’annonce simplement que la cuisine prend un moment. Il n’y a rien à demander.',
            next: 'n5',
          },
        ],
      },
      {
        id: 'n5',
        zh: '这是你们的菜，慢慢吃！',
        fr: 'Voici vos plats, bon appétit !',
        repliques: [
          { zh: '谢谢！', fr: 'Merci !', qualite: 'juste', next: null },
          { zh: '看起来很好吃。', fr: 'Ça a l’air très bon.', qualite: 'juste', next: null },
          {
            zh: '多少钱？',
            fr: 'Combien ça coûte ?',
            qualite: 'inadapte',
            note: 'On demande l’addition à la fin du repas, pas au moment où on est servi.',
            next: null,
          },
        ],
      },
    ],
  },

  // ------------------------------------------------------------------ HSK 3
  {
    id: 'hsk3-prendre-un-taxi',
    level: 3,
    titleZh: '打车去机场',
    titleFr: 'Prendre un taxi',
    role: 'Le chauffeur de taxi',
    situation: 'Tu dois prendre un avion cet après-midi et tu montes dans un taxi.',
    unit: 'transports',
    start: 'n1',
    nodes: [
      {
        id: 'n1',
        zh: '你好，去哪儿？',
        fr: 'Bonjour, où allez-vous ?',
        repliques: [
          { zh: '请送我去机场。', fr: 'À l’aéroport, s’il vous plaît.', qualite: 'juste', next: 'n2' },
          {
            zh: '机场。',
            fr: 'L’aéroport.',
            qualite: 'maladroit',
            note: 'Ça marche et ça s’entend souvent. 请送我去… reste plus poli pour un premier échange.',
            next: 'n2',
          },
          {
            zh: '我不知道。',
            fr: 'Je ne sais pas.',
            qualite: 'inadapte',
            note: 'Tu montes dans un taxi : le chauffeur attend une destination, c’est la seule information dont il a besoin.',
            next: 'n2',
          },
        ],
      },
      {
        id: 'n2',
        zh: '好的。您要去哪个机场？',
        fr: 'Très bien. Quel aéroport ?',
        repliques: [
          { zh: '这里有几个机场？', fr: 'Il y en a combien ici ?', qualite: 'juste', next: 'n3' },
          { zh: '大的那个。', fr: 'Le grand.', qualite: 'juste', next: 'n3' },
          {
            zh: '快一点儿。',
            fr: 'Plus vite.',
            qualite: 'inadapte',
            note: 'Il te pose une question nécessaire. Le presser avant même de savoir où aller ne mène nulle part.',
            next: 'n3',
          },
        ],
      },
      {
        id: 'n3',
        zh: '有两个。一个在东边，一个在西边。您的飞机几点起飞？',
        fr: 'Il y en a deux, un à l’est et un à l’ouest. À quelle heure décolle votre avion ?',
        repliques: [
          { zh: '下午三点起飞。', fr: 'Il décolle à trois heures de l’après-midi.', qualite: 'juste', next: 'n4' },
          {
            zh: '我忘了。',
            fr: 'J’ai oublié.',
            qualite: 'maladroit',
            note: 'Ça arrive, mais ajoute ce que tu comptes faire : 我看看手机 montre que tu cherches la réponse.',
            next: 'n4',
          },
          {
            zh: '不知道。',
            fr: 'Je ne sais pas.',
            qualite: 'inadapte',
            note: 'Sans heure, il ne peut pas choisir l’aéroport ni la route. La question est pratique, pas curieuse.',
            next: 'n4',
          },
        ],
      },
      {
        id: 'n4',
        zh: '那我们去东边那个。路上车很多，可能会慢一点儿。',
        fr: 'Alors ce sera celui de l’est. Il y a du monde sur la route, ce sera peut-être un peu lent.',
        repliques: [
          { zh: '没关系，还有时间。', fr: 'Ce n’est pas grave, j’ai le temps.', qualite: 'juste', next: 'n5' },
          { zh: '我很着急。', fr: 'Je suis pressé.', qualite: 'juste', next: 'n5' },
          {
            zh: '快点！',
            fr: 'Vite !',
            qualite: 'inadapte',
            note: 'Il vient de t’expliquer que la circulation est chargée. Un ordre sec ne change rien et met mal à l’aise.',
            next: 'n5',
          },
        ],
      },
      {
        id: 'n5',
        zh: '到了。一共八十块。',
        fr: 'Nous y sommes. Quatre-vingts yuans en tout.',
        repliques: [
          { zh: '给你一百块。', fr: 'Voici cent yuans.', qualite: 'juste', next: null },
          { zh: '可以用手机吗？', fr: 'Je peux payer avec mon téléphone ?', qualite: 'juste', next: null },
          {
            zh: '太贵了。',
            fr: 'C’est trop cher.',
            qualite: 'inadapte',
            note: 'Le prix d’un taxi se lit au compteur. Le contester à l’arrivée ne se fait pas.',
            next: null,
          },
        ],
      },
    ],
  },
]
