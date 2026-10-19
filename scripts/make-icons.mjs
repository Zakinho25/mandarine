/**
 * Génère les icônes de l'application, sans dépendance ni service en ligne.
 *
 * Le motif est le contour du 3e ton — descendant puis montant — parce que
 * c'est le ton qui pose le plus de difficulté aux francophones et le sujet
 * central de l'application.
 *
 * Usage : node scripts/make-icons.mjs
 */
import { deflateSync } from 'node:zlib'
import { mkdir, writeFile } from 'node:fs/promises'

const BACKGROUND = [224, 122, 47] // orange mandarine
const STROKE = [255, 252, 248]

// ---------------------------------------------------------------------------
// Encodeur PNG minimal (couleur vraie 8 bits, sans canal alpha).
// ---------------------------------------------------------------------------
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

function crc32(buffer) {
  let c = 0xffffffff
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, crc])
}

function encodePng(width, height, pixels) {
  const header = Buffer.alloc(13)
  header.writeUInt32BE(width, 0)
  header.writeUInt32BE(height, 4)
  header[8] = 8 // profondeur
  header[9] = 2 // couleur vraie RVB
  // Les octets 10 à 12 (compression, filtre, entrelacement) restent à zéro.

  // Chaque ligne est préfixée par son type de filtre, ici 0 (aucun).
  const raw = Buffer.alloc(height * (1 + width * 3))
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (1 + width * 3)
    raw[rowStart] = 0
    for (let x = 0; x < width; x += 1) {
      const [r, g, b] = pixels(x, y)
      const offset = rowStart + 1 + x * 3
      raw[offset] = r
      raw[offset + 1] = g
      raw[offset + 2] = b
    }
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ---------------------------------------------------------------------------
// Motif : contour du 3e ton, tracé par distance au point le plus proche.
// ---------------------------------------------------------------------------
function toneCurveIcon(size, padding) {
  const inner = size * (1 - 2 * padding)
  const left = size * padding
  const amplitude = inner * 0.34
  const top = size / 2 - amplitude / 2
  const thickness = Math.max(2, size * 0.075)

  /** Ordonnée de la courbe pour une abscisse normalisée t dans [0, 1]. */
  const curveY = (t) => top + amplitude * (1 - (2 * t - 1) ** 2)

  // Échantillonnage dense : plus simple et plus robuste qu'un calcul exact de
  // distance à une parabole, pour un coût négligeable à cette taille.
  const samples = []
  for (let i = 0; i <= 600; i += 1) {
    const t = i / 600
    samples.push([left + t * inner, curveY(t)])
  }

  return (x, y) => {
    let best = Infinity
    for (const [sx, sy] of samples) {
      const d = (x - sx) ** 2 + (y - sy) ** 2
      if (d < best) best = d
    }
    return Math.sqrt(best) <= thickness / 2 ? STROKE : BACKGROUND
  }
}

const TARGETS = [
  { file: 'icon-192.png', size: 192, padding: 0.16 },
  { file: 'icon-512.png', size: 512, padding: 0.16 },
  // Une icône masquable peut être recadrée en cercle : on garde 25 % de marge.
  { file: 'icon-maskable-512.png', size: 512, padding: 0.26 },
]

await mkdir('public/icons', { recursive: true })
for (const { file, size, padding } of TARGETS) {
  const png = encodePng(size, size, toneCurveIcon(size, padding))
  await writeFile(`public/icons/${file}`, png)
  console.log(`public/icons/${file} — ${size}x${size}, ${png.length} octets`)
}
