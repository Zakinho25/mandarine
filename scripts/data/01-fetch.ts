/**
 * Étape 1 — Téléchargement des sources brutes.
 *
 * Les fichiers atterrissent dans `scripts/data/raw/`, qui est ignoré par git :
 * ils sont volumineux et retéléchargeables. Les étapes suivantes ne lisent
 * que ce dossier, jamais le réseau.
 *
 * Un `manifest.json` note la date, la taille et l'empreinte de chaque
 * fichier : on peut toujours dire d'où vient une donnée et quand.
 */
import { createHash } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { RAW_DIR, SOURCES, type Source } from './sources.ts'

interface FetchedFile {
  readonly key: string
  readonly url: string
  readonly file: string
  readonly bytes: number
  readonly sha256: string
  readonly sha256Verified: boolean | null
  readonly fetchedAt: string
}

function sha256(data: Uint8Array): string {
  return createHash('sha256').update(data).digest('hex')
}

function human(bytes: number): string {
  return bytes > 1_000_000
    ? `${(bytes / 1_000_000).toFixed(1)} Mo`
    : `${Math.round(bytes / 1000).toString()} Ko`
}

async function download(source: Source): Promise<FetchedFile> {
  const response = await fetch(source.url, {
    headers: { 'user-agent': 'mandarine-data-pipeline' },
  })
  if (!response.ok) {
    throw new Error(`HTTP ${String(response.status)} sur ${source.url}`)
  }

  const data = new Uint8Array(await response.arrayBuffer())
  const digest = sha256(data)
  await writeFile(join(RAW_DIR, source.file), data)

  const verified = source.sha256 === undefined ? null : digest === source.sha256

  return {
    key: source.key,
    url: source.url,
    file: source.file,
    bytes: data.byteLength,
    sha256: digest,
    sha256Verified: verified,
    fetchedAt: new Date().toISOString(),
  }
}

await mkdir(RAW_DIR, { recursive: true })

const fetched: FetchedFile[] = []
let failures = 0

for (const source of SOURCES) {
  process.stdout.write(`  ${source.key.padEnd(14)} `)
  try {
    const result = await download(source)
    fetched.push(result)

    let suffix = ''
    if (result.sha256Verified === true) suffix = ' — empreinte officielle VÉRIFIÉE'
    else if (result.sha256Verified === false) suffix = ' — EMPREINTE DIFFÉRENTE de celle déclarée'
    console.log(`${human(result.bytes).padStart(8)}${suffix}`)
  } catch (cause: unknown) {
    const message = cause instanceof Error ? cause.message : String(cause)
    if (source.optional === true) {
      console.log(`échec ignoré (source facultative) : ${message}`)
    } else {
      console.log(`ÉCHEC : ${message}`)
      failures += 1
    }
  }
}

await writeFile(
  join(RAW_DIR, 'manifest.json'),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), files: fetched }, null, 2)}\n`,
)

// Une empreinte qui ne correspond pas n'arrête pas le pipeline, mais doit se
// voir : soit le document officiel a changé, soit la transcription ne vient
// pas de celui qu'elle annonce. Les deux cas méritent qu'on regarde.
const mismatched = fetched.filter((f) => f.sha256Verified === false)
if (mismatched.length > 0) {
  console.warn(
    `\nAttention : ${String(mismatched.length)} empreinte(s) ne correspondent pas` +
      ' à ce que la source déclare. À vérifier avant de se fier aux données.',
  )
}

if (failures > 0) {
  console.error(`\n${String(failures)} source(s) obligatoire(s) en échec.`)
  process.exit(1)
}

console.log(`\n${String(fetched.length)} fichier(s) dans ${RAW_DIR}/`)
