# Sources de données et licences

Ce fichier recense toute donnée externe utilisée par Mandarine, sa licence, et
ce que cette licence impose.

**Contexte d'usage : personnel et non commercial.** Cela retire tout obstacle
juridique sérieux à ce projet. Les obligations qui restent sont des obligations
d'attribution, et elles sont tenues ici. La colonne « si usage commercial »
existe pour le cas où le projet changerait de nature — ne pas la supprimer sans
y réfléchir.

## Dépendances logicielles

| Source | Licence | Usage | Si usage commercial |
| --- | --- | --- | --- |
| [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) | MIT | Planification des révisions | Sans problème |
| [hanzi-writer](https://hanziwriter.org/) | MIT | Animation de l'ordre des traits | Sans problème |
| React, Vite, Tailwind, Zustand, idb | MIT | Socle technique | Sans problème |

## Données linguistiques

> Statut : **aucune donnée linguistique externe n'est encore importée.** Le
> contenu présent dans `public/content/` est une démonstration de six mots
> saisie à la main, étiquetée `demo` dans l'interface. Ce tableau est le plan du
> jalon 2 ; chaque ligne devra être vérifiée à ce moment-là, pas avant.

| Source | Licence annoncée | Ce qu'elle apporte | Obligations | À vérifier au jalon 2 |
| --- | --- | --- | --- | --- |
| Programme HSK 3.0 (CTI / ministère de l'Éducation chinois) | Document officiel, non libre | La liste de vocabulaire par niveau | Ne pas reproduire les sujets d'examen ni les supports pédagogiques officiels | **Quelle révision ?** La version 2021 donne environ 2 245 mots cumulés au niveau 3, la révision de fin 2025 environ 1 000. La plupart des listes ouvertes dérivent de la version 2021. Sourcer la liste officielle. En usage commercial, vérifier aussi le droit *sui generis* des bases de données, qui existe dans l'Union européenne. |
| [CFDICT](https://chine.in/mandarin/dictionnaire/CFDICT/) | CC BY-SA 3.0 (à confirmer) | Dictionnaire chinois-français | Attribution, et partage à l'identique des données dérivées | Version exacte de la licence, et couverture réelle des mots HSK 1 à 3 |
| [CC-CEDICT](https://www.mdbg.net/chinese/dictionary?page=cc-cedict) | CC BY-SA (version à confirmer) | Dictionnaire chinois-anglais, pour combler les trous de CFDICT | Attribution, partage à l'identique | Version de la licence ; toute traduction française dérivée reste sous partage à l'identique |
| [Make Me a Hanzi](https://github.com/skishore/makemeahanzi) / `hanzi-writer-data` | Arphic Public License (données dérivées de polices Arphic) + LGPL pour le code | Tracés, médianes et décomposition des caractères | Conserver l'avis de licence ; les données dérivées restent sous la même licence | L'usage commercial est autorisé mais conditionné : relire l'Arphic Public License avant toute distribution payante |

## Audio

Aucun fichier audio n'est distribué avec l'application. La prononciation est
produite à la demande par la **synthèse vocale du navigateur**
(`speechSynthesis`), à partir des voix chinoises déjà installées sur l'appareil.

Conséquences : rien à héberger, rien à payer, aucune licence de voix à
respecter — mais la qualité dépend de l'appareil, et aucun fichier audio ne
peut en être extrait. C'est pourquoi le module de tons s'appuiera sur des
contours de hauteur **calculés** plutôt que mesurés sur un enregistrement de
référence.

## Polices

Aucune police n'est redistribuée. L'application utilise les polices chinoises
du système (PingFang SC, Microsoft YaHei, Noto Sans SC selon l'appareil), via
une liste de replis en CSS.

## Contenu produit par l'application

Les textes de lecture et les dialogues seront rédigés dans le cadre du projet,
et non repris d'une source existante. Chacun porte un `contentStatus` visible
dans l'interface :

- `demo` — démonstration technique, aucune valeur pédagogique ;
- `draft_ai` — brouillon rédigé, non vérifié ;
- `auto_checked` — vérifié par script : chaque mot appartient au niveau visé.
  Cela ne garantit **pas** que la formulation soit naturelle ;
- `reviewed_human` — relu phrase par phrase.

Cette distinction n'est pas cosmétique : la vérification automatique attrape les
mots hors programme, elle n'attrape pas une tournure que personne ne dirait.
L'étiquette doit donc dire exactement ce qui a été vérifié.
