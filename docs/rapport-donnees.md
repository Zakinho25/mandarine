# Rapport de données — jalon 2

Généré automatiquement par `npm run data`. Ne pas modifier à la main.

Date : 2026-10-19

## Provenance

Le vocabulaire et les niveaux viennent du **《新版HSK考试大纲》** publié en
novembre 2025 par le Center for Language Education and Cooperation. Le PDF
officiel a été téléchargé et **son empreinte SHA-256 correspond** à celle que
déclare la transcription utilisée : les données proviennent bien de ce
document, et non d'une recopie approximative.

Totaux par niveau relevés dans les données : 300, 200, 500, 1 000, 1 600,
1 800 et 5 600 nouveaux mots — soit **300, 500 et 1 000 mots cumulés** aux
niveaux 1 à 3. Conforme au syllabus.

## Couverture

| Niveau | Mots | Présents dans le standard 2021 | Pinyin numéroté | Définition française |
|---|---|---|---|---|
| 1 | 300 | 94.0 % | 100.0 % | 100.0 % |
| 2 | 200 | 98.5 % | 100.0 % | 100.0 % |
| 3 | 500 | 98.4 % | 100.0 % | 100.0 % |
| 4 | 1000 | 97.3 % | 99.6 % | 99.2 % |
| 5 | 1600 | 96.4 % | 99.9 % | 99.5 % |
| 6 | 1800 | 93.0 % | 99.5 % | 98.9 % |
| 7-9 | 5600 | 82.4 % | 97.9 % | 94.7 % |

Pour les trois niveaux qui nous intéressent (1000 mots) :

- **100.0 %** ont une définition française issue de CFDICT ;
- **100.0 %** ont un pinyin numéroté ;
- **99.9 %** ont une forme traditionnelle.

Mots des niveaux 1 à 3 sans définition française : **0**.
Ils sont rédigés à la main dans `scripts/data/overrides.ts`, ou marqués comme
manquants dans le contenu s'ils ne l'ont pas encore été.

### Rapprochements approximatifs

Trois écarts systématiques séparent le syllabus du dictionnaire, et chacun a sa
tolérance. Elles sont comptées ici parce qu'une tolérance invisible devient une
erreur qui se propage :

- `ton-ignoré` : 252 mots
- `candidat-unique` : 15 mots

Ces mots portent `glossSource: "cfdict-approx"` dans les données, et leur
pinyin numéroté n'est jamais emprunté au dictionnaire : il pourrait être celui
d'une autre lecture du même caractère.

### Tons réalignés sur le syllabus

**182 mots** sur l'ensemble du lexique avaient, au dictionnaire, un ton
différent de celui qu'imprime le syllabus — presque toujours un ton neutre là
où le syllabus donne un ton plein : 学生 est `xue2 sheng5` au dictionnaire et
`xuéshēng` au syllabus.

Le dictionnaire fournit le découpage en syllabes, le syllabus fournit les tons.
C'est le syllabus qui fait autorité ici, puisque c'est lui qu'on enseigne. Les
tons de 一 et 不 sont exclus de ce réalignement : le syllabus en imprime la
forme après sandhi, et c'est la règle de sandhi qui doit rester visible.

### Corrections écrites à la main

9 entrées de `scripts/data/overrides.ts` ont été appliquées, chacune avec
sa justification. Elles portent `glossSource: "manuel"` et le statut
`reviewed_human`. Le pipeline échoue si l'une d'elles ne correspond plus à
aucun mot : une correction devenue inutile serait un bug silencieux.

À noter : pour 一下 et 一会儿, le syllabus imprime le pinyin **après** sandhi
(`yíxià`). Les données stockent la forme de citation `yi1 xia4`, et c'est
la fonction de sandhi du jalon 4 qui produira la prononciation réelle. Stocker
la forme déjà transformée rendrait la règle invisible, donc impossible à
enseigner.

## Divergences de niveau entre 2021 et 2025

Le standard de 2021 et le syllabus de 2025 n'attribuent pas les mêmes niveaux.
C'est attendu : le niveau 1 est passé de 500 à 300 mots, le niveau 3 de 2 245 à
1 000. Un mot « niveau 2 » en 2025 peut donc être « niveau 1 » en 2021.

- Mots du syllabus 2025 absents du standard 2021 : **1224**
- Désaccords de niveau, tous niveaux : **4076**
- Désaccords sur les niveaux 1 à 3 : **564**

Premiers désaccords sur les niveaux 1 à 3 :

| Mot | Pinyin | Niveau 2025 | Niveau 2021 |
|---|---|---|---|
| 边 | biān | 1 | 2 |
| 不要 | búyào | 1 | 2 |
| 超市 | chāoshì | 1 | 2 |
| 出租车 | chūzūchē | 1 | 2 |
| 大家 | dàjiā | 1 | 2 |
| 店 | diàn | 1 | 2 |
| 分钟 | fēnzhōng | 1 | 2 |
| 公司 | gōngsī | 1 | 2 |
| 狗 | gǒu | 1 | 2 |
| 件 | jiàn | 1 | 2 |
| 饺子 | jiǎozi | 1 | 2 |
| 可以 | kěyǐ | 1 | 2 |
| 卖 | mài | 1 | 2 |
| 猫 | māo | 1 | 2 |
| 女士 | nǚshì | 1 | 4 |
| 便宜 | piányi | 1 | 2 |
| 漂亮 | piàoliang | 1 | 2 |
| 苹果 | píngguǒ | 1 | 3 |
| 千 | qiān | 1 | 2 |
| 它 | tā | 1 | 2 |
| 它们 | tāmen | 1 | 2 |
| 喂 | wèi | 1 | 2 |
| 问题 | wèntí | 1 | 2 |
| 些 | xiē | 1 | 4 |
| 雪 | xuě | 1 | 2 |
| 椅子 | yǐzi | 1 | 2 |
| 怎么样 | zěnmeyàng | 1 | 2 |
| 只 | zhī | 1 | 3 |
| 做饭 | zuò fàn | 1 | 2 |
| 爱好 | àihào | 2 | 1 |
| 班 | bān | 2 | 1 |
| 帮 | bāng | 2 | 1 |
| 帮忙 | bāngmáng | 2 | 1 |
| 包 | bāo | 2 | 1 |
| 本子 | běnzi | 2 | 1 |
| 比 | bǐ | 2 | 1 |
| 别 | bié | 2 | 1 |
| 车站 | chēzhàn | 2 | 1 |
| 出 | chū | 2 | 1 |
| 出来 | chūlái | 2 | 1 |

**Ce que l'application en fait :** chaque mot porte les deux niveaux. Le réglage
« Programme visé » choisit lequel pilote le parcours, par défaut celui de 2025.
Aucun arbitrage n'est fait dans les données.

## Limite connue

Aucune donnée de fréquence n'est encore intégrée. Le syllabus classe les mots
par ordre alphabétique de pinyin, pas par fréquence d'usage. L'ordre
d'introduction des mots dans le parcours (jalon 6) en aura besoin : c'est une
source à ajouter, pas une donnée à inventer.
