# Mandarine

Application web installable pour apprendre le chinois mandarin quand on est
francophone, du tout premier ton jusqu'au HSK 3.

Tout se passe dans le navigateur : pas de compte, pas de serveur, pas
d'abonnement. Les révisions et la lecture fonctionnent hors ligne.

> **État : jalons 1 à 5 sur 11 terminés.** L'application enseigne : les
> **1 000 mots du HSK 3** sont révisables en répétition espacée, le module de
> prononciation couvre les tons et le sandhi avec des exercices d'écoute, et
> les **655 caractères** ont leur fiche avec l'ordre des traits animé et la
> décomposition expliquée.

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
npm run check      # lint + pureté du domaine + typage + tests (avant chaque commit)
npm test           # tests unitaires
npm run coverage   # tests + seuils de couverture de la logique pédagogique
npm run build      # build de production
npm run preview    # sert le build de production
npm run data       # régénère tout le vocabulaire depuis les sources
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
- [ ] **6. Parcours et tableau de bord** — unités, progression, objectif
      quotidien
- [ ] **7. Lecture graduée** — textes segmentés, dictionnaire au toucher
- [ ] **8. Dialogues guidés** — scénarios du quotidien contraints au niveau
- [ ] **9. Prononciation** — enregistrement, courbe de hauteur, comparaison
- [ ] **10. Grammaire et examens blancs**
- [ ] **11. Finitions** — performance, accessibilité, tests de bout en bout

## Ce que l'application ne fait pas

- **L'audio dépend de ton appareil.** La prononciation vient de la synthèse
  vocale du navigateur : c'est gratuit et hors ligne, mais il faut une voix
  chinoise installée. L'iPhone en a une d'origine ; sous Windows, il faut
  ajouter le chinois simplifié dans les réglages de langue. Sans elle,
  l'application le dit et désactive les boutons d'écoute.
- Les cartes d'écoute ne sont pas encore dans les révisions : deux compétences
  sur cinq sont actives. Les exercices de tons sont pour l'instant un module à
  part, qui compte dans le temps d'écoute mais pas dans la planification.
- Elle ne propose pas encore de parcours guidé : les mots sont introduits dans
  l'ordre du syllabus, pas par fréquence d'usage.
- Les définitions sont reprises d'un dictionnaire : leur conformité au niveau
  est vérifiée par script, leur justesse de nuance ne l'est pas.
- Elle ne contient aucune intelligence artificielle. Les dialogues du jalon 8
  seront écrits à l'avance.
- Elle ne synchronise rien entre plusieurs appareils. La sauvegarde manuelle en
  JSON est le moyen de transférer sa progression.
