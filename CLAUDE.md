# Mandarine — conventions et décisions

Application web installable d'apprentissage du chinois mandarin pour
francophones, du débutant complet au HSK 3. Usage personnel, budget zéro,
aucun service payant, aucun compte.

## Commandes

| Commande | Effet |
| --- | --- |
| `npm run dev` | Serveur de développement (Vite) |
| `npm run check` | Lint + pureté du domaine + typage + tests. **À lancer avant chaque commit.** |
| `npm test` | Tests unitaires |
| `npm run test:watch` | Tests en continu pendant le développement |
| `npm run coverage` | Tests + seuils de couverture sur `src/domain` |
| `npm run build` | Build de production, service worker compris |
| `npm run preview` | Sert le build de production localement |
| `npm run icons` | Régénère les icônes de l'application |
| `npm run format` | Prettier sur tout le dépôt |

## Architecture

```
src/
  domain/     logique pédagogique en TypeScript PUR — aucun import externe
  data/       IndexedDB, contenu JSON, sauvegarde
  store/      état d'interface (Zustand)
  ui/         composants et jetons de style réutilisables
  app/        navigation et mise en page
  features/   un dossier par écran
scripts/      outils en ligne de commande (icônes, vérifications, pipeline de données)
public/content/  contenu pédagogique en JSON statique
```

### La règle la plus importante

**`src/domain/` ne doit importer que du domaine.** Pas de React, pas de DOM, pas
d'IndexedDB, pas même de module `node:`. C'est ce qui permet de tester la
planification des révisions, le sandhi tonal, la conversion du pinyin et le
calcul de progression en quelques millisecondes, et de les prouver par des
tests plutôt que de les vérifier à la main dans un navigateur.

`npm run check:domain` échoue si cette règle est violée, et la CI avec lui.
Le code qui a besoin du navigateur va dans `data/`, `ui/` ou `features/`.

### Conventions

- **Tout en français** : interface, commentaires, messages de commit, noms de
  branches. Les identifiants de code restent en anglais quand c'est l'usage
  (`loadSettings`, `targetKind`).
- **Pas de `any`** non justifié ; le typage est strict, `noUncheckedIndexedAccess`
  et `exactOptionalPropertyTypes` compris.
- **Tests obligatoires** pour tout ce qui vit dans `src/domain/`. Seuils de
  couverture appliqués en CI sur ce dossier seulement : c'est la logique
  pédagogique qui doit être prouvée, pas les composants d'affichage.
- **Aucun contenu faux présenté comme vrai.** Tout élément de contenu porte un
  `contentStatus` (`demo`, `draft_ai`, `auto_checked`, `reviewed_human`) affiché
  à l'utilisateur. Les écrans non construits le disent explicitement, avec leur
  numéro de jalon.
- Le pinyin est stocké sous sa **forme numérotée** (`ni3 hao3`). Les
  diacritiques sont toujours dérivés par `toDiacritics`, jamais stockés.

## Le pipeline de données

```bash
npm run data      # les quatre étapes, depuis le réseau jusqu'à public/content/
```

| Étape | Commande | Rôle |
| --- | --- | --- |
| 1 | `npm run data:fetch` | Télécharge dans `scripts/data/raw/` (ignoré par git) et vérifie les empreintes |
| 2 | `npm run data:normalize` | Ramène chaque source à des structures typées, sans rien joindre |
| 3 | `npm run data:merge` | Joint, réaligne les tons, écrit `docs/rapport-donnees.md` |
| 4 | `npm run data:build` | Écrit `public/content/` |

Les fichiers de `public/content/` ne se modifient **jamais** à la main : ils
sont régénérés. Une correction va dans `scripts/data/overrides.ts`, avec sa
justification. Le pipeline échoue si une correction ne s'applique plus à aucun
mot — une correction devenue inutile serait un bug silencieux.

## Journal des décisions

Chaque entrée dit ce qui a été décidé, pourquoi, et ce qu'il faudrait changer
pour revenir en arrière.

### 2026-10-26 — Les textes sont découpés à la génération, pas à l'affichage
Chaque texte est segmenté par le pipeline, et les jetons sont écrits avec leur
identifiant de mot. L'application lit une liste, elle ne découpe rien.
**Pourquoi :** le découpage doit coïncider exactement avec le vocabulaire
enseigné. Un segmenteur générique qui couperait 不客气 en trois rendrait faux
le surlignage, le compte de mots connus et l'ajout aux révisions, tous en même
temps. C'est aussi la raison d'être de `src/domain/segmentation.ts`, construit
sur notre propre lexique plutôt que sur `Intl.Segmenter`.

Un test vérifie que les jetons recollés redonnent le texte source à
l'identique : sans cette propriété, le lecteur n'affiche plus ce qui a été
rédigé.

### 2026-10-26 — Le script de vérification remplace la génération par IA
Le cahier des charges prévoyait des brouillons produits par l'API Claude puis
vérifiés automatiquement. Sans clé d'API, les textes sont rédigés directement
dans le projet. **La vérification, elle, reste** : `npm run data:textes`
échoue si un seul mot sort du vocabulaire du niveau. C'était de toute façon la
partie qui garantissait quelque chose.

Les textes portent `auto_checked`, jamais `reviewed_human` : le vocabulaire est
vérifié, le naturel de la langue ne l'est pas.

### 2026-10-26 — « Ajouter aux révisions » met en tête de file
Toutes les cartes existent dès le départ, à l'état neuf ; c'est le plafond
quotidien qui décide lesquelles sont introduites. Depuis un texte, marquer un
mot ne peut donc pas créer une carte. Ce que ça fait, c'est le faire passer
**devant** dans la file des nouveautés, pour qu'il arrive à la prochaine
session au lieu d'attendre son rang de fréquence.

### 2026-10-21 — Une application web ne peut pas programmer de notification
L'API Notification n'affiche quelque chose que si la page tourne déjà, ce qui
ne sert à rien pour un rappel. Les notifications différées passent par l'API
Push, qui exige un service de push et un serveur détenant des clés. Ce projet
n'a ni serveur ni budget.

**Ce qu'on fait à la place :** un fichier d'agenda (`.ics`) avec un événement
quotidien et une alerte. L'utilisateur l'ouvre une fois, son téléphone crée
l'événement, et c'est le système qui rappelle. Gratuit, hors ligne, et il
fonctionne même si l'application n'est jamais rouverte. L'heure est flottante,
sans fuseau : l'alerte suit l'heure locale de l'appareil.

### 2026-10-21 — L'ordre du fichier EST l'ordre d'apprentissage
Les mots de chaque niveau sont écrits du plus fréquent au moins fréquent, et
c'est cet ordre que la file de révision suit pour introduire les nouveautés.
**Pourquoi dans les données plutôt que dans le code :** le tri est fait une
fois au moment de la génération, testé, et toute la chaîne en hérite sans
avoir à y penser. Un test vérifie que les rangs sont croissants dans chaque
fichier.

### 2026-10-21 — Les unités thématiques sont calculées, pas saisies
Classer mille mots à la main n'est pas raisonnable. L'affectation se fait par
règle (liste explicite, puis mot-clé dans la définition, puis classe
grammaticale) et le pipeline signale ce qui reste non classé.

**Le piège rencontré :** la recherche par sous-chaîne envoyait 你好 dans
l'unité du calendrier, parce que « bonjour » contient « jour ». La
correspondance se fait désormais sur des frontières de mots, avec tolérance du
pluriel. 178 mots restent dans « Le reste » : un mot mal rangé serait plus
trompeur qu'un mot non rangé.

### 2026-10-21 — Le tableau de bord refuse de projeter trop tôt
L'estimation de la date d'atteinte du HSK 3 exige au moins 14 jours écoulés et
5 jours d'usage réel. En deçà, elle dit pourquoi elle ne peut pas répondre au
lieu d'afficher un tiret. Sans mot maîtrisé, elle le dit aussi. **Pourquoi :**
une date calculée sur trois jours d'usage serait un chiffre inventé avec une
décimale.

Une fois l'objectif d'une journée atteint, il le reste : changer de réglage en
cours de route n'efface pas une journée déjà gagnée.

### 2026-10-19 — Les tracés sont servis un par un, pas préchargés
Les 655 caractères pèsent 3 Mo de tracés. **Pourquoi à la demande :**
précharger ferait grossir l'installation de trois mégaoctets pour des
caractères qu'on ne consultera peut-être jamais, alors qu'un caractère coûte
3 Ko et se met en cache à la première consultation. L'index, lui, est léger
(103 Ko) et préchargé. Les fichiers sont nommés par point de code
(`u597d.json`) : un caractère chinois dans une URL demande un encodage, et
dans un nom de fichier il dépend du système.

### 2026-10-19 — Le sens d'un composant vient de deux sources
D'abord la table rédigée (`src/data/composants.ts`), ensuite le vocabulaire
lui-même quand le composant est un mot à part entière. **Pourquoi les deux :**
女 a besoin d'une entrée écrite — son sens *en tant que composant* n'est pas
forcément celui du mot — mais 不, 天 ou 可 tiennent leur traduction du lexique,
et en écrire une seconde serait du travail en double qui finirait par diverger.

**Ce qu'on assume :** 149 composants rares n'apparaissent qu'une fois chacun et
restent sans traduction. L'application affiche alors le caractère nu et dit que
le sens n'est pas renseigné. Inventer une glose serait pire. Le pipeline
signale en revanche tout composant qui revient **au moins deux fois** sans
entrée : c'est le seuil où le travail de rédaction vaut la peine.

### 2026-10-19 — Pas de traduction approximative des étymologies
La source décrit l'origine de chaque caractère par une phrase en anglais
(`etymology.hint`). On ne l'utilise pas. On se sert uniquement des champs
**structurels** `semantic` et `phonetic`, qui désignent des caractères et n'ont
donc pas de langue : ils permettent d'écrire « 女 donne le sens, 马 donne le
son » sans traduire. **Pourquoi :** une traduction automatique non relue dans
une application d'apprentissage est exactement le genre de contenu faux
présenté comme vrai que ce projet s'interdit.

### 2026-10-19 — `hanzi-writer` avec nos données, pas son CDN
La bibliothèque va chercher ses caractères sur un CDN par défaut. On lui passe
un `charDataLoader` qui lit nos fichiers. **Pourquoi :** l'application doit
fonctionner hors ligne, et dépendre d'un CDN tiers pour afficher un trait
reviendrait à annuler tout le travail de mise en cache.

### 2026-10-19 — On fait lire des caractères, jamais du pinyin
La synthèse vocale reçoit 你好, pas `ni3 hao3`. **Pourquoi :** une voix
chinoise applique elle-même le sandhi tonal et prononce correctement ; lui
donner du pinyin produirait du charabia latin. C'est aussi pourquoi les séries
de tons de `src/data/prononciation.ts` associent un **caractère réel** à chaque
ton : pour faire entendre `ma3` isolément, il faut 马.

### 2026-10-19 — Sans voix chinoise, on le dit
Quand aucune voix chinoise n'est installée, les boutons d'écoute sont
désactivés et un message explique quoi faire, système par système. **Pourquoi :**
une application de prononciation dont le bouton « écouter » ne fait rien sans
expliquer pourquoi est pire qu'une application sans audio. Les exercices
d'écoute sont verrouillés dans ce cas : ils n'auraient aucun sens.

### 2026-10-19 — Le sandhi renvoie la règle, pas seulement le résultat
`applySandhi` indique pour chaque syllabe quelle règle s'applique.
**Pourquoi :** l'application doit pouvoir expliquer *pourquoi* 你好 se dit
`ní hǎo`, pas seulement l'afficher. Une correction qu'on ne comprend pas ne
s'apprend pas.

**Limite assumée :** pour trois troisièmes tons de suite, le découpage
prosodique change le résultat (小老虎 contre 我很好). Ce découpage n'est pas
dans les données. La règle retenue est la plus enseignée, et elle est exacte
pour les mots de deux syllabes — l'immense majorité du vocabulaire HSK 1 à 3.

### 2026-10-19 — Les paires de tons viennent du vrai vocabulaire
Les vingt combinaisons sont illustrées par des mots du syllabus, pas par des
syllabes inventées pour l'exercice. **Pourquoi :** entendre la paire 2-4 sur
学校 fait d'une pierre deux coups. Les propositions d'un exercice ne diffèrent
jamais de la bonne réponse que d'**un seul ton** : sinon la seconde syllabe
devient inutile à écouter et l'exercice se résout par élimination.

### 2026-10-19 — Un test de composant là où le navigateur ne peut rien prouver
`EcouteScreen.test.tsx` simule une voix chinoise et déroule une série entière.
**Pourquoi :** la machine de développement n'a aucune voix chinoise, donc
l'exercice y est verrouillé et aucun passage dans le navigateur ne peut le
vérifier. Le test, lui, tourne en CI à chaque fois.

### 2026-10-19 — `ts-fsrs` enfermé dans un seul fichier
Toute la bibliothèque est confinée à `src/domain/srs/scheduler.ts`. Le reste de
l'application ne connaît que `SrsState` et `Note` (encore / difficile /
correct / facile). **Pourquoi :** c'est la couche d'abstraction demandée par le
cahier des charges, et elle rend l'algorithme remplaçable sans toucher à
l'interface. Les dates y sont des chaînes ISO en UTC, comme dans le stockage :
elles se comparent dans l'ordre lexicographique, ce qui supprime toute
conversion et toute surprise de fuseau horaire.

### 2026-10-19 — Un ton faux est une erreur
`checkPinyin` distingue quatre verdicts : exact, tons manquants, tons faux,
faux. Un ton oublié vaut « difficile » — la syllabe est sue, la précision ne
l'est pas. Un **ton faux relance la carte**. **Pourquoi :** dans une
application dont les tons sont la priorité annoncée, accepter `ni hao` pour
`nǐ hǎo` sans rien dire reviendrait à enseigner qu'ils sont facultatifs. La
saisie reste libre : `ni3 hao3`, `ni3hao3`, `nihao`, `nǐhǎo`, `NǏHǍO` sont
toutes lues correctement.

### 2026-10-19 — On plafonne les mots nouveaux, jamais les révisions
Le nombre de révisions dues est la conséquence de ce qu'on a appris les jours
précédents ; le seul levier honnête est d'en introduire moins aujourd'hui. Le
plafond est déduit de l'objectif quotidien (10 mots pour 20 minutes), et il
compte des **mots**, pas des cartes — sinon il couperait un mot en deux. Les
mots déjà découverts dans la journée sont comptés sur le journal, pour qu'une
seconde session n'en ajoute pas une seconde fournée.

### 2026-10-19 — Des distracteurs qu'on peut vraiment confondre
Face à 爱 (`ài`), le QCM propose 菜 (`cài`), 带 (`dài`), 太 (`tài`) : même ton,
même finale. **Pourquoi :** proposer 图书馆 face à 爱 ne teste rien, l'élève
élimine par la longueur sans lire. Le score de proximité combine schéma tonal,
caractère partagé, initiale et finale. Règle d'équité : **jamais un mot qui
partage un sens avec la cible**, sinon la « mauvaise » réponse serait
défendable.

### 2026-10-19 — Identifiants de cartes déterministes
Une carte a pour identifiant `lexeme:<mot>:<compétence>`. **Pourquoi :**
recréer les cartes d'un mot devient idempotent, sans risque de doublon, et deux
appareils qui apprennent le même mot aboutissent au même identifiant — ce qui
facilitera une synchronisation plutôt que de la compliquer. Le journal de
révisions garde des UUID v7 : il est en ajout seul, et ses entrées n'ont pas
d'équivalent ailleurs.

### 2026-10-19 — Deux compétences au jalon 3, pas cinq
Seules `zh_fr` (reconnaître) et `fr_zh` (produire) sont actives. `audio_fr` et
`tone` attendent le module audio du jalon 4 : une carte d'écoute sans son
fiable serait une carte cassée. `write` reste désactivée, le nouveau HSK
n'exigeant pas l'écriture manuscrite avant le niveau 5.

### 2026-10-19 — Le syllabus d'examen de 2025, pas le standard de 2021
Deux documents coexistent, et ils ne disent pas la même chose. Le standard
d'enseignement *GF 0025-2021* place **2 245 mots** au niveau 3 ; le syllabus
d'examen publié en **novembre 2025** en place **1 000**. Ce n'est pas une
révision de l'un par l'autre : ce sont deux textes, l'un pour l'enseignement,
l'autre pour l'examen. **Pourquoi le second :** c'est lui qui définit ce que
« HSK 3 » veut dire pour qui passe l'examen.

**Piège évité :** la majorité des jeux de données publics encodent les niveaux
de 2021. Les importer sans regarder aurait donné un parcours deux fois plus
long que prévu. Les deux niveaux sont donc stockés sur chaque mot
(`hsk2025` et `hsk2021`), et le réglage « Programme visé » choisit lequel
pilote le parcours.

### 2026-10-19 — La provenance est vérifiée, pas supposée
Le pipeline télécharge le PDF officiel du syllabus et compare son empreinte
SHA-256 à celle que déclare la transcription utilisée. Elles correspondent.
**Pourquoi :** une transcription communautaire d'un document officiel est
invérifiable sur parole ; une empreinte, elle, se vérifie. Le PDF n'est jamais
redistribué.

### 2026-10-19 — Le dictionnaire découpe, le syllabus donne les tons
学生 est `xue2 sheng5` au dictionnaire et `xuéshēng` au syllabus. Le
dictionnaire note souvent la prononciation courante, à ton neutre ; le syllabus
imprime le ton de citation. **Décision :** le syllabus fait autorité sur les
tons, le dictionnaire sur le découpage en syllabes — qu'on ne peut pas déduire
d'une suite de lettres accentuées collées. C'est le rôle de
`scripts/data/lib/retone.ts`, qui épargne 一 et 不 : le syllabus en imprime la
forme **après** sandhi, et cette règle doit rester visible pour être enseignée.

### 2026-10-19 — On affiche ce qui se prononce, pas la forme de citation
不客气 est stocké `bu4 ke4 qi5` et se prononce `bú kèqi`. Afficher la forme de
citation reviendrait à enseigner un ton faux, dans une application dont les
tons sont le sujet principal. `annotateMarked` affiche donc la forme accentuée
du syllabus, en la découpant grâce à la forme numérotée. La forme de citation
reste visible dans le détail du mot, parce que c'est elle que le sandhi
transforme.

### 2026-10-19 — `tsx` pour les scripts de données
**Pourquoi :** les scripts importent le module pinyin de `src/domain/`, qui est
en TypeScript. Node 20 ne sait pas l'exécuter directement. L'alternative aurait
été de dupliquer la logique du pinyin en JavaScript — deux sources de vérité
pour la conversion des tons, c'est-à-dire la garantie qu'elles divergent.
Les scripts sont typés par `tsconfig.scripts.json` et testés comme le reste.

### 2026-10-19 — Site web installable plutôt qu'application native
Le projet a démarré en React Native + Expo. Basculé en application web (Vite +
React) installable depuis le navigateur. **Pourquoi :** budget zéro, et
installer une application compilée sur un iPhone physique exige un compte Apple
Developer à environ 99 €/an. Une application web s'ajoute à l'écran d'accueil
gratuitement. **Effet de bord favorable :** l'accès au micro et au signal audio,
qui était le point dur du module de prononciation en natif, est direct via
l'API Web Audio.

### 2026-10-19 — Aucun backend, aucune clé d'API
Supabase, l'authentification, la synchronisation et le proxy vers l'API Claude
ont été retirés du plan. **Pourquoi :** un seul utilisateur, un seul appareil —
ces briques ne protégeaient et ne synchronisaient rien, pour un jalon entier de
travail. **Remplacé par :** une sauvegarde export/import en JSON.
**Pour revenir en arrière :** les accès au stockage passent par `src/data/`, un
adaptateur distant s'y substituerait sans toucher aux écrans.

### 2026-10-19 — IndexedDB et JSON statique, pas de SQLite
**Pourquoi :** le volume est d'environ 1 000 à 2 300 mots. Un balayage linéaire
sur quelques milliers d'entrées est instantané, là où SQLite compilé en
WebAssembly coûterait plus d'un mégaoctet de téléchargement et une couche de
migrations. Le contenu est du JSON statique mis en cache par le service worker,
les données de progression vivent dans IndexedDB : une mise à jour du contenu
ne touche jamais à ce qui a été appris.

### 2026-10-19 — Routage par ancre (`/#/revisions`)
**Pourquoi :** GitHub Pages ne redirige pas les routes inconnues vers
`index.html`. En routage classique, ouvrir un lien profond renverrait une 404 au
premier chargement. L'ancre évite le problème sans serveur et sans fichier de
redirection.

### 2026-10-19 — Pinyin canonique numéroté
**Pourquoi :** évite tout problème de normalisation Unicode dans les données,
rend la recherche triviale, et fournit les deux formes demandées sans les
stocker deux fois. La conversion inverse (diacritiques vers numéroté) **lève une
erreur** sur une suite ambiguë comme `nǐhǎo` plutôt que de deviner un découpage.

### 2026-10-19 — `y` et `w` ne sont pas des initiales
Dans `parseSyllable`, `wo` s'analyse en initiale vide + finale `uo`.
**Pourquoi :** c'est le découpage qui permet de fabriquer de bons distracteurs.
Proposer `duǒ` face à `wǒ` est un piège utile parce que les deux partagent
réellement la finale `uo` ; un découpage orthographique ne verrait pas cette
parenté.

### 2026-10-19 — Programme HSK explicite, jamais supposé
Les sources publiques divergent : la version 2021 du HSK 3.0 demande environ
2 245 mots cumulés au niveau 3, la révision de fin 2025 environ 1 000. Le
programme visé est donc un réglage (`examTrack`), et les données porteront la
révision dont elles proviennent. **À faire au jalon 2 :** sourcer la liste
officielle auprès de CTI plutôt que d'importer le premier jeu de données trouvé
— la plupart des listes ouvertes dérivent de la version 2021.

### 2026-10-19 — Polices chinoises du système
Aucune police n'est téléchargée : PingFang SC sur iPhone, Microsoft YaHei sur
Windows. **Pourquoi :** qualité équivalente à Noto Sans SC, zéro octet, et
fonctionne hors ligne dès le premier lancement.

### 2026-10-19 — Audio par `speechSynthesis`
La synthèse vocale du navigateur remplace l'audio neuronal pré-généré.
**Pourquoi :** gratuite, hors ligne, sans compte. **Limite connue :** la qualité
et les voix dépendent de l'appareil, et on ne peut pas en extraire de fichier
audio ni de courbe de hauteur de référence. Le module de tons (jalon 4) utilisera
donc des contours de référence calculés, pas mesurés.

### 2026-10-19 — Identifiants UUID v7 dès maintenant
Avec `updatedAt` et `deletedAt` en pierre tombale, alors qu'aucune
synchronisation n'est prévue. **Pourquoi :** ne coûte rien aujourd'hui ;
l'ajouter plus tard imposerait de migrer des données de progression déjà
accumulées, la seule chose ici qui ne se régénère pas.

### 2026-10-19 — `legacy-peer-deps` dans `.npmrc`
**Pourquoi :** npm 10.8.2, livré avec Node 20, plante (`edgesOut`) sur la
résolution des dépendances de pair de Vite 8. Le drapeau contourne ce bug de
npm. **À retirer** une fois le projet passé sous Node 22 et npm récent.

**Effet de bord constaté :** les dépendances de pair ne s'installent plus
toutes seules. `@testing-library/dom` a dû être ajouté à la main le jour où les
premiers tests de composant ont tourné. Si un module se dit introuvable alors
qu'il devrait venir avec un autre, c'est la première piste.

### 2026-10-19 — « Dialogues guidés », pas « Conversation IA »
Sans clé d'API, il n'y a pas d'IA dans l'application. Le module sera fait
d'arbres de dialogue écrits à l'avance, contraints au niveau de l'utilisateur.
**Pourquoi ce nom :** pour du HSK 1 à 3, les échanges réels sont formulaires, un
arbre de dialogue couvre l'essentiel — mais l'appeler « IA » serait mensonger.
