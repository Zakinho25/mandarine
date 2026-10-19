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

## Dépendances logicielles

| Source | Licence | Usage |
| --- | --- | --- |
| [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) | MIT | Planification des révisions (jalon 3) |
| [hanzi-writer](https://hanziwriter.org/) | MIT | Ordre des traits (jalon 5) |
| React, Vite, Tailwind, Zustand, idb, tsx | MIT | Socle technique |

## Pas encore utilisé

**Fréquence d'usage.** Le syllabus classe les mots par ordre alphabétique de
pinyin, pas par fréquence. Le parcours du jalon 6 aura besoin d'un ordre
d'introduction fondé sur la fréquence réelle.
[SUBTLEX-CH](http://crr.ugent.be/programs-data/subtitle-frequencies) (Cai et
Brysbaert, 2010) est le candidat : 33,5 millions de mots de sous-titres, libre
avec attribution. À intégrer, pas à inventer.

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
