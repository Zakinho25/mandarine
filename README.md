# Mandarine

Application web installable pour apprendre le chinois mandarin quand on est
francophone, du tout premier ton jusqu'au HSK 3.

Tout se passe dans le navigateur : pas de compte, pas de serveur, pas
d'abonnement. Les révisions et la lecture fonctionnent hors ligne.

> **État : jalon 1 sur 11 terminé.** Le socle technique est en place.
> L'application s'affiche, se règle et se sauvegarde, mais n'enseigne encore
> rien : les modules pédagogiques arrivent aux jalons suivants.

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
```

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
- [ ] **2. Données** — import de la liste HSK, dictionnaire français, scripts
      reproductibles
- [ ] **3. Révisions** — moteur FSRS, cartes par compétence, session de révision
- [ ] **4. Pinyin et tons** — initiales, finales, exercices d'écoute, paires de
      tons, sandhi
- [ ] **5. Caractères** — fiches, ordre des traits animé, décomposition
- [ ] **6. Parcours et tableau de bord** — unités, progression, objectif
      quotidien
- [ ] **7. Lecture graduée** — textes segmentés, dictionnaire au toucher
- [ ] **8. Dialogues guidés** — scénarios du quotidien contraints au niveau
- [ ] **9. Prononciation** — enregistrement, courbe de hauteur, comparaison
- [ ] **10. Grammaire et examens blancs**
- [ ] **11. Finitions** — performance, accessibilité, tests de bout en bout

## Ce que l'application ne fait pas

- Elle n'enseigne pas encore : le contenu actuel est une démonstration de six
  mots, saisie à la main, étiquetée comme telle dans l'interface.
- Elle ne contient aucune intelligence artificielle. Les dialogues du jalon 8
  seront écrits à l'avance.
- Elle ne synchronise rien entre plusieurs appareils. La sauvegarde manuelle en
  JSON est le moyen de transférer sa progression.
