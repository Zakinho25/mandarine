# Sources de données et licences

Toute donnée externe utilisée par Mandarine, sa licence, et ce que cette
licence impose.

**Contexte d'usage : personnel et non commercial.** Les obligations qui
subsistent sont des obligations d'attribution, tenues ici et reprises dans les
fichiers de données eux-mêmes. La colonne « si usage commercial » existe pour
le cas où le projet changerait de nature — ne pas la supprimer sans y réfléchir.

## Vocabulaire et niveaux

| Source | Licence | Apport | Si usage commercial |
| --- | --- | --- | --- |
| **《新版HSK考试大纲》** (nouveau syllabus HSK), publié en novembre 2025 par le Center for Language Education and Cooperation | Document officiel, droits réservés | Les 11 000 mots, leurs niveaux, leur pinyin et leur classe grammaticale | **Point bloquant.** La liste et sa structure appartiennent au CLEC. Une diffusion publique demanderait leur accord. S'ajoute, dans l'Union européenne, le droit *sui generis* des bases de données. |
| [uranbekanarbaev/hsk-3.0-vocabulary-dataset](https://github.com/uranbekanarbaev/hsk-3.0-vocabulary-dataset) | Transcription : droits du CLEC. Ajouts du dépôt : CC BY 4.0 et MIT | La transcription exploitable du syllabus | Voir ci-dessus : la transcription ne crée aucune licence nouvelle |
| [ivankra/hsk30](https://github.com/ivankra/hsk30) | MIT | Formes traditionnelles, pinyin numéroté, niveaux du standard GF 0025-2021 | Sans problème, avec l'avis de copyright |

**Provenance vérifiée.** Le PDF officiel du syllabus est téléchargé à chaque
exécution du pipeline, et son empreinte SHA-256 est comparée à celle que
déclare la transcription. Les deux correspondent. Les données viennent donc du
document officiel, et pas d'une recopie approximative. Le PDF n'est jamais
redistribué : il sert uniquement à cette vérification.

**Deux documents, pas une révision.** Le standard d'enseignement
*GF 0025-2021* (juillet 2021) et le syllabus d'examen (novembre 2025) sont deux
textes distincts. Le premier place 2 245 mots au niveau 3, le second 1 000. Ce
sont les niveaux du **syllabus d'examen** qui pilotent l'application ; ceux du
standard sont conservés dans les données et consultables.

## Dictionnaire

| Source | Licence | Apport | Obligations |
| --- | --- | --- | --- |
| [CFDICT](https://chine.in/mandarin/dictionnaire/CFDICT/), par Chine Informations | **CC BY-SA 3.0** | Les définitions françaises de 99,5 % du vocabulaire des niveaux 1 à 3 | Attribution, et **partage à l'identique de toute donnée dérivée du dictionnaire** |

Le partage à l'identique est une contrainte réelle : les fichiers de
`public/content/` contiennent des définitions dérivées de CFDICT et sont donc
eux-mêmes sous CC BY-SA 3.0 pour cette partie. C'est pourquoi l'attribution
voyage **à l'intérieur** de chaque fichier de données, dans un champ
`attribution`, et pas seulement dans ce document : une donnée séparée de sa
licence finit toujours par être réutilisée sans elle.

## Caractères

| Source | Licence | Apport | Si usage commercial |
| --- | --- | --- | --- |
| [Make Me a Hanzi](https://github.com/skishore/makemeahanzi) | **Arphic Public License** — les données dérivent de polices Arphic | Tracés et médianes de chaque trait, décomposition, clé et nature des 655 caractères des niveaux 1 à 3 | Autorisé mais **conditionné** : l'avis de licence doit être conservé et les données dérivées restent sous la même licence. À relire avant toute distribution payante. |

Le pipeline télécharge `dictionary.txt` (décomposition, clé, étymologie
structurelle) et `graphics.txt` (tracés, 29 Mo). Seuls les 655 caractères du
vocabulaire sont extraits ; les 3 Mo qui en résultent sont servis un caractère
à la fois. L'attribution voyage dans `public/content/hanzi/index.json`.

**Ce qui n'est volontairement pas repris :** le champ `etymology.hint` de la
source est une phrase en anglais. Plutôt que de la traduire approximativement
ou de l'afficher telle quelle dans une application française, on n'utilise que
les champs **structurels** — `semantic` et `phonetic` — qui désignent des
caractères et n'ont donc pas de langue. C'est ce qui permet d'écrire « 女 donne
le sens, 马 donne le son » sans traduire quoi que ce soit.

Le sens français des composants (`src/data/composants.ts`) est rédigé pour ce
projet. 149 composants rares restent sans traduction : l'application le dit au
lieu d'inventer.

## Dépendances logicielles

| Source | Licence | Usage |
| --- | --- | --- |
| [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) | MIT | Planification des révisions (jalon 3) |
| [hanzi-writer](https://hanziwriter.org/) | MIT | Animation de l'ordre des traits (jalon 5) |
| React, Vite, Tailwind, Zustand, idb, tsx | MIT | Socle technique |

## Fréquence d'usage

| Source | Licence | Apport | Si usage commercial |
| --- | --- | --- | --- |
| [drkameleon/complete-hsk-vocabulary](https://github.com/drkameleon/complete-hsk-vocabulary) | MIT | Rang de fréquence d'usage pour 990 des 1 000 mots | Sans problème, avec l'avis de copyright |

Le rang vient de **SUBTLEX-CH** (Cai et Brysbaert, 2010), un corpus de
33,5 millions de mots de sous-titres. C'est lui qui détermine l'ordre
d'introduction des mots : du plus courant au moins courant, comme le demande le
cahier des charges. Le syllabus, lui, classe par ordre alphabétique de pinyin,
ce qui ne dit rien de l'utilité d'un mot.

Les 10 mots sans rang passent en fin de liste, dans l'ordre du syllabus.

## Audio

Aucun fichier audio n'est distribué. La prononciation est produite à la demande
par la synthèse vocale du navigateur (`speechSynthesis`), à partir des voix
chinoises installées sur l'appareil : rien à héberger, aucune licence de voix à
respecter. En contrepartie, la qualité dépend de l'appareil et aucun fichier
audio ne peut en être extrait.

## Polices

Aucune police redistribuée. L'application utilise les polices chinoises du
système (PingFang SC, Microsoft YaHei, Noto Sans SC selon l'appareil) via une
liste de replis en CSS.

## Textes de lecture et dialogues

Les 10 textes de `scripts/data/textes.ts` et les 4 dialogues de
`scripts/data/dialogues.ts` ont été **rédigés pour ce projet**, sans source
externe. Ils n'emploient que le vocabulaire de leur niveau, ce
qu'un script vérifie mot par mot : `npm run data:textes` échoue si un seul mot
en sort.

Cette vérification garantit la conformité du vocabulaire. Elle ne garantit pas
que la formulation soit naturelle. Les textes portent donc `auto_checked` et
non `reviewed_human` : une relecture par un locuteur natif reste à faire, et
l'interface le dit.

## Contenu produit par l'application

Chaque élément porte un `contentStatus` visible dans l'interface :

- `demo` — démonstration technique, aucune valeur pédagogique ;
- `draft_ai` — rédigé, non vérifié ;
- `auto_checked` — mot et niveau issus du syllabus officiel, définition reprise
  de CFDICT. La conformité du vocabulaire est vérifiée par script ; **le
  naturel de la langue ne l'est pas** ;
- `reviewed_human` — rédigé et relu.

Les 9 définitions absentes de CFDICT ont été rédigées à la main dans
`scripts/data/overrides.ts`, chacune avec sa justification, et portent le
statut `reviewed_human`.

## Polices de caractères

| Police | Usage | Auteur | Licence |
| --- | --- | --- | --- |
| [Figtree](https://github.com/erikdkennedy/figtree) | interface | Erik Kennedy | SIL Open Font License 1.1 |
| [Bricolage Grotesque](https://github.com/ateliertriay/bricolage) | titres et logotype | Mathieu Triay, Atelier Triay | SIL Open Font License 1.1 |

Les deux sont hébergées dans `public/fonts/`, en sous-ensembles latin et
latin-ext, plutôt qu'appelées chez Google. Deux raisons : l'application doit
fonctionner hors ligne, et aucune requête ne doit partir vers un tiers.

Le sous-ensemble **latin-ext est indispensable** : le pinyin s'écrit avec
ā ǎ ē ě ī ǐ ō ǒ ū ǔ ǖ ǚ, qui n'appartiennent pas au latin de base.

La licence OFL autorise cet hébergement et cette redistribution, y compris
dans un projet modifié, tant que les polices ne sont pas vendues seules.
