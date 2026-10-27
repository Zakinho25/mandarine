/**
 * Génère les icônes de l'application, sans dépendance ni service en ligne.
 *
 * Le motif est la marque de l'application : un quartier de mandarine, aux
 * mêmes coordonnées que le tracé SVG de src/ui/Logo.tsx.
 *
 * Le dessin est donc écrit deux fois, en SVG là-bas et en arithmétique ici,
 * faute d'outil de rendu installé et pour tenir la promesse de zéro
 * dépendance. Toute retouche du logo doit être reportée ici, sans quoi
 * l'icône et l'en-tête finiraient par diverger.
 *
 * Usage : node scripts/make-icons.mjs
 */
import { deflateSync } from 'node:zlib'
import { mkdir, writeFile } from 'node:fs/promises'

const TUILE = [255, 232, 214] // pêche doux : le fond de la tuile
const ECORCE_COULEUR = [255, 248, 240] // presque blanc, pour que l'écorce
// se détache de la tuile. Les confondre ferait disparaître la bande claire,
// qui est ce qui fait lire « agrume » plutôt que « triangle ».
const CHAIR_SOMBRE = [194, 65, 12] // l'accent
const CHAIR_CLAIRE = [255, 122, 61] // l'accent vif

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
// Motif : le quartier de mandarine, dans le repère de 32 unités du logo.
// ---------------------------------------------------------------------------

/** Pointe du quartier, d'où partent le rayon et les nervures. */
const APEX = [6.5, 26.5]
const RAYON = 22
const ANGLE_DEBUT = -97
const ANGLE_FIN = -12
const ECORCE = 1.7

const NERVURES = [
  [6.85, 22.52, 7.63, 13.55],
  [8.79, 23.22, 13.96, 15.85],
  [10.13, 24.81, 18.28, 21.01],
]

/** Distance au carré d'un point à un segment. */
function distanceSegment2(px, py, ax, ay, bx, by) {
  const dx = bx - ax
  const dy = by - ay
  const longueur = dx * dx + dy * dy
  const t =
    longueur === 0
      ? 0
      : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / longueur))
  const qx = ax + t * dx
  const qy = ay + t * dy
  return (px - qx) ** 2 + (py - qy) ** 2
}

function mandarineIcon(size, padding) {
  const inner = size * (1 - 2 * padding)
  const echelle = inner / 32
  const marge = size * padding

  return (x, y) => {
    // Retour dans le repère du logo, où le tracé est exprimé.
    const u = (x - marge) / echelle
    const v = (y - marge) / echelle
    const du = u - APEX[0]
    const dv = v - APEX[1]
    const d = Math.hypot(du, dv)
    const angle = (Math.atan2(dv, du) * 180) / Math.PI

    if (angle < ANGLE_DEBUT || angle > ANGLE_FIN || d > RAYON) return TUILE

    // L'écorce : la bande claire le long de l'arc extérieur.
    if (d >= RAYON - ECORCE) return ECORCE_COULEUR

    for (const [ax, ay, bx, by] of NERVURES) {
      if (distanceSegment2(u, v, ax, ay, bx, by) <= 0.55 ** 2) {
        // Les nervures sont atténuées, comme dans le SVG : à pleine clarté
        // elles dessineraient une patte plutôt que des fibres.
        return [0, 1, 2].map((i) =>
          Math.round((ECORCE_COULEUR[i] + CHAIR_CLAIRE[i]) / 2),
        )
      }
    }

    // La chair, en dégradé de la pointe vers l'écorce.
    const t = Math.min(1, d / RAYON)
    return [0, 1, 2].map((i) =>
      Math.round(CHAIR_SOMBRE[i] + (CHAIR_CLAIRE[i] - CHAIR_SOMBRE[i]) * t),
    )
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
  const png = encodePng(size, size, mandarineIcon(size, padding))
  await writeFile(`public/icons/${file}`, png)
  console.log(`public/icons/${file} — ${size}x${size}, ${png.length} octets`)
}
