/**
 * Inventaire des sources de données.
 *
 * Tout ce que le pipeline télécharge est déclaré ici, avec sa licence et ce
 * qu'elle impose. Une source absente de ce fichier n'entre pas dans
 * l'application.
 */

export interface Source {
  readonly key: string
  readonly url: string
  /** Nom du fichier dans `scripts/data/raw/`. */
  readonly file: string
  readonly licence: string
  /** Ce que la licence impose concrètement. */
  readonly obligations: string
  /** Empreinte SHA-256 attendue, quand la source en publie une. */
  readonly sha256?: string
  /** Une source facultative n'interrompt pas le pipeline si elle échoue. */
  readonly optional?: boolean
  readonly note?: string
}

export const SOURCES: readonly Source[] = [
  {
    key: 'syllabus2025',
    url: 'https://raw.githubusercontent.com/uranbekanarbaev/hsk-3.0-vocabulary-dataset/HEAD/data/hsk-3.0-all.json',
    file: 'hsk-3.0-syllabus-2025.json',
    licence: 'Transcription du syllabus officiel — droits CLEC / CTI',
    obligations:
      'Le contenu du syllabus reste la propriété du Center for Language Education' +
      ' and Cooperation. La transcription ne crée aucune licence nouvelle.' +
      ' Usage personnel uniquement ; une redistribution demanderait leur accord.',
    note: '11 000 entrées du 《新版HSK考试大纲》 de novembre 2025. C’est la liste qui définit les niveaux.',
  },
  {
    key: 'standard2021',
    url: 'https://raw.githubusercontent.com/ivankra/hsk30/HEAD/hsk30.csv',
    file: 'hsk30-standard-2021.csv',
    licence: 'MIT',
    obligations: 'Conserver l’avis de copyright.',
    note:
      '11 092 entrées du standard GF 0025-2021. Utilisé pour les métadonnées' +
      ' (traditionnel, clé CEDICT en pinyin numéroté) et pour comparer les niveaux.',
  },
  {
    key: 'cfdict',
    url: 'https://chine.in/assets/cfdict/cfdict.u8',
    file: 'cfdict.u8',
    licence: 'CC BY-SA 3.0',
    obligations:
      'Attribution à CFDICT / Chine Informations, et partage à l’identique de' +
      ' toute donnée dérivée du dictionnaire.',
    note: 'Dictionnaire chinois-français, format CEDICT, pinyin déjà numéroté.',
  },
  {
    key: 'syllabusPdf',
    url: 'https://hsk.cn-bj.ufileos.com/3.0/%E6%96%B0%E7%89%88HSK%E8%80%83%E8%AF%95%E5%A4%A7%E7%BA%B21219.pdf',
    file: 'nouveau-syllabus-hsk-2025.pdf',
    licence: 'Document officiel CLEC / CTI, tous droits réservés',
    obligations: 'Non redistribué. Téléchargé uniquement pour vérifier une empreinte.',
    sha256: 'ec74ce0439e837bbb15154be13e747ae798903b2fd3a331629df6c3b45504941',
    optional: true,
    note:
      'PDF officiel du syllabus. On ne le lit pas : on vérifie que son empreinte' +
      ' correspond à celle déclarée par la transcription, pour prouver que les' +
      ' données viennent bien du document officiel et non d’une recopie approximative.',
  },
]

export const RAW_DIR = 'scripts/data/raw'
export const WORK_DIR = 'scripts/data/work'
export const OUT_DIR = 'public/content'
