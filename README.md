# Mandarine

Application web installable pour apprendre le chinois mandarin quand on est
francophone, du tout premier ton jusqu'au HSK 3.

Tout se passe dans le navigateur : pas de compte, pas de serveur, pas
d'abonnement. Les révisions et la lecture fonctionnent hors ligne.

> **État : les onze jalons sont terminés.** L'application enseigne : les
> **1 000 mots du HSK 3** sont révisables en répétition espacée et classés du
> plus courant au moins courant, répartis en 26 unités thématiques, sans reste. Le module
> de prononciation couvre les tons et le sandhi, les **655 caractères** ont
> leur fiche avec l'ordre des traits animé, le tableau de bord suit la
> progression réelle, **10 textes de lecture** se lisent mot par mot avec leur
> définition au toucher, et 4 dialogues guidés mettent en situation. Un
> exercice de prononciation compare la courbe de ta voix au contour du ton
> visé. **48 fiches de grammaire** expliquent chaque point du programme avec
> le piège qu'il tend aux francophones, et des **examens blancs** chronométrés
> se fabriquent à la demande à partir de tout ce contenu.

## Prérequis

- Node.js 20 ou plus récent (22 recommandé)
- Un navigateur à jour

## Démarrer

```bash
npm install
npm run dev
```

Ouvre l'adresse affichée dans le terminal.

## Commandes

```bash
npm run check      # lint + pureté du domaine + accessibilité + typage + tests
npm test           # tests unitaires et de composants
npm run test:e2e   # tests de bout en bout, dans Chromium et WebKit
npm run coverage   # tests + seuils de couverture de la logique pédagogique
npm run build      # build de production
npm run preview    # sert le build de production
npm run data       # régénère tout le vocabulaire depuis les sources
```

Les tests de bout en bout ont besoin des navigateurs de Playwright, à
installer une fois :

```bash
npx playwright install chromium webkit
```

## D'où vient le vocabulaire

Les 1 000 mots viennent du **《新版HSK考试大纲》**, le syllabus d'examen publié
en novembre 2025 par le Center for Language Education and Cooperation. Le PDF
officiel est téléchargé à chaque exécution du pipeline et son empreinte
SHA-256 est vérifiée.

Attention à un piège : le standard d'enseignement de 2021 place **2 245 mots**
au niveau 3, le syllabus d'examen de 2025 en place **1 000**. Ce sont deux
documents différents, pas une révision. La plupart des jeux de données publics
encodent les niveaux de 2021. Chaque mot porte donc les deux niveaux, et le
réglage « Programme visé » choisit lequel pilote le parcours.

Les définitions françaises viennent de **CFDICT** (CC BY-SA 3.0) et couvrent
99,5 % du vocabulaire ; les 9 manquantes ont été rédigées à la main. Le détail
chiffré est dans [docs/rapport-donnees.md](docs/rapport-donnees.md), généré
automatiquement.

## Tester sur iPhone

Le serveur de développement est accessible depuis le réseau local, mais le
micro et l'installation exigent HTTPS. Deux façons de faire :

1. **Pour un simple coup d'œil** — lance `npm run dev -- --host`, puis ouvre
   l'adresse `http://192.168.x.x:5173` affichée dans le terminal depuis Safari,
   le téléphone étant sur le même Wi-Fi.
2. **Pour l'usage réel** — déploie sur GitHub Pages (voir ci-dessous), puis dans
   Safari : bouton Partager → **Sur l'écran d'accueil**.

**Installer l'application sur l'écran d'accueil n'est pas facultatif.** Safari
efface les données d'un site non installé après sept jours sans visite. Une fois
installée, la progression est conservée. Pense tout de même à exporter ta
sauvegarde de temps en temps depuis les réglages : l'historique de révisions est
la seule donnée qui ne se régénère pas.

## Déployer gratuitement

Le dépôt contient un workflow prêt à l'emploi :

1. pousse le dépôt sur GitHub ;
2. dans *Settings → Pages*, choisis **GitHub Actions** comme source ;
3. chaque push sur `main` publie le site. Le chemin de base est déduit
   automatiquement du nom du dépôt.

## Structure

```
src/domain/     logique pédagogique en TypeScript pur, testée unitairement
src/data/       IndexedDB, chargement du contenu, sauvegarde export/import
src/ui/         composants et jetons de style
src/features/   un dossier par écran
scripts/        outils en ligne de commande
public/content/ contenu pédagogique en JSON
```

Les conventions, la règle de pureté du domaine et le journal des décisions
techniques sont dans [CLAUDE.md](CLAUDE.md). Les sources de données et leurs
licences sont dans [DATA_LICENSES.md](DATA_LICENSES.md).

## Feuille de route

- [x] **1. Socle** — projet, navigation, thème clair/sombre, couleurs des tons,
      IndexedDB, sauvegarde, PWA installable, CI, module pinyin testé
- [x] **2. Données** — les 1 000 mots du syllabus 2025, définitions françaises,
      pipeline reproductible, validation en CI
- [x] **3. Révisions** — moteur FSRS, deux cartes par mot, distracteurs
      proches, correction du pinyin tolérante à la saisie mais stricte sur les tons
- [x] **4. Pinyin et tons** — initiales, finales, exercices d'écoute, paires de
      tons, sandhi
- [x] **5. Caractères** — fiches, ordre des traits animé, décomposition en
      composants avec leur sens en français
- [x] **6. Parcours et tableau de bord** — 26 unités thématiques, mots classés
      par fréquence, série de jours, estimation honnête, rappel par agenda
- [x] **7. Lecture graduée** — 10 textes rédigés et vérifiés, lecteur segmenté,
      dictionnaire au toucher, surlignage des mots connus
- [x] **8. Dialogues guidés** — 4 scénarios du quotidien, trois réponses par
      tour, corrections rassemblées à la fin de l'échange
- [x] **9. Prononciation** — enregistrement au micro, détection de hauteur par
      YIN, comparaison au contour attendu
- [x] **10. Grammaire et examens blancs** — 48 fiches avec exercice de remise
      en ordre, examens chronométrés fabriqués à partir du contenu vérifié,
      points faibles renvoyés vers les révisions
- [x] **11. Finitions** — écrans chargés à la demande, chinois étiqueté pour
      les lecteurs d'écran, couche de stockage testée, tests de bout en bout
      dans Chromium et Safari

## Ce que l'application ne fait pas

- **L'audio dépend de ton appareil.** La prononciation vient de la synthèse
  vocale du navigateur : c'est gratuit et hors ligne, mais il faut une voix
  chinoise installée. L'iPhone en a une d'origine ; sous Windows, il faut
  ajouter le chinois simplifié dans les réglages de langue. Sans elle,
  l'application le dit et désactive les boutons d'écoute.
- **Il n'y a aucune intelligence artificielle dedans.** Les dialogues sont des
  arbres écrits à l'avance, et l'interface le dit.
- **Les cartes d'écoute dépendent de ton appareil.** Elles sont créées partout,
  mais ne te sont proposées que là où une voix chinoise est installée : sans
  elle, la carte serait muette. L'iPhone en a une d'origine ; sous Windows, il
  faut ajouter le chinois simplifié dans les réglages de langue. Rien n'est
  perdu entre-temps, les cartes attendent.
- Un mot reste **maîtrisé** quand tu sais le reconnaître et le produire : la
  définition n'inclut pas l'écoute, pour que le compteur veuille dire la même
  chose sur le téléphone et sur l'ordinateur.
- Les exercices de tons et l'écriture manuscrite ne sont pas planifiés. Les
  tons se travaillent dans le module de prononciation, qui compte dans le temps
  d'écoute ; le tracé des caractères reste libre, sur leurs fiches.
- **Elle ne peut pas t'envoyer de notification.** Une application web ne sait
  pas programmer un rappel quand elle est fermée : il faudrait un serveur de
  push. Les réglages produisent à la place un événement d'agenda quotidien, que
  ton téléphone se charge de rappeler.
- Les définitions sont reprises d'un dictionnaire, et les textes comme les
  dialogues ont été rédigés sans relecture par un locuteur natif : la
  conformité au niveau est vérifiée par script, la justesse de nuance ne l'est
  pas. L'interface l'affiche sur chaque contenu concerné.
- **L'exercice de prononciation ne juge que les tons.** Il mesure la forme de
  la courbe de hauteur, pas les consonnes ni les voyelles. Les contours de
  référence sont calculés à partir de la notation de Chao, pas mesurés sur un
  locuteur : assez pour voir qu'un troisième ton ne redescend pas, pas assez
  pour juger un niveau avancé. Un service d'évaluation payant ferait mieux,
  mais le projet tient à zéro euro.
- **Le score d'un examen blanc n'est pas une note officielle.** C'est un
  pourcentage de bonnes réponses sur un examen fabriqué à partir du contenu de
  l'application. Aucun sujet officiel n'est reproduit : ils sont protégés.
  Seul le seuil de 60 % est emprunté au barème réel. La structure s'inspire de
  l'épreuve publiée du HSK 3 ; le syllabus 3.0 de novembre 2025 n'a pas encore
  publié de nouvelle répartition des items.
- **L'épreuve d'écriture n'est pas couverte** : elle demande de tracer des
  caractères à la main. Sa première partie, la remise en ordre d'une phrase, se
  travaille dans les fiches de grammaire.
- Elle ne synchronise rien entre plusieurs appareils. La sauvegarde manuelle en
  JSON est le moyen de transférer sa progression.
