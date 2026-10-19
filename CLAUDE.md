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

### 2026-10-19 — « Dialogues guidés », pas « Conversation IA »
Sans clé d'API, il n'y a pas d'IA dans l'application. Le module sera fait
d'arbres de dialogue écrits à l'avance, contraints au niveau de l'utilisateur.
**Pourquoi ce nom :** pour du HSK 1 à 3, les échanges réels sont formulaires, un
arbre de dialogue couvre l'essentiel — mais l'appeler « IA » serait mensonger.
