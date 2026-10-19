/**
 * Identifiants UUID v7 pour les données utilisateur.
 *
 * Pourquoi pas un simple compteur, ni `crypto.randomUUID()` (qui produit du
 * v4) : la version 7 préfixe l'identifiant d'un horodatage en millisecondes.
 * Les identifiants sont donc **triables chronologiquement**, ce qui rend le
 * journal de révisions lisible dans l'ordre sans index supplémentaire, et
 * restent uniques sans coordination — indispensable le jour où une
 * synchronisation devra fusionner des données créées hors ligne.
 *
 * Format (RFC 9562) : 48 bits d'horodatage, 4 bits de version (7),
 * 12 bits aléatoires, 2 bits de variante (10), 62 bits aléatoires.
 */

const HEX = '0123456789abcdef'

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length)
  globalThis.crypto.getRandomValues(bytes)
  return bytes
}

function toHex(bytes: Uint8Array): string {
  let out = ''
  for (const byte of bytes) {
    out += HEX.charAt(byte >> 4) + HEX.charAt(byte & 0x0f)
  }
  return out
}

/** Génère un UUID v7. `now` est injectable pour rendre les tests déterministes. */
export function uuidv7(now: number = Date.now()): string {
  const bytes = randomBytes(16)

  // 48 bits d'horodatage, octets 0 à 5, de poids fort à poids faible.
  const timestamp = Math.floor(now)
  for (let i = 0; i < 6; i += 1) {
    bytes[i] = Math.floor(timestamp / 2 ** (8 * (5 - i))) & 0xff
  }

  // Version 7 sur les 4 bits hauts de l'octet 6.
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x70
  // Variante RFC (10) sur les 2 bits hauts de l'octet 8.
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80

  const hex = toHex(bytes)
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-')
}

/** Extrait l'horodatage de création d'un UUID v7, en millisecondes. */
export function timestampOf(uuid: string): number {
  const hex = uuid.replace(/-/g, '').slice(0, 12)
  return Number.parseInt(hex, 16)
}
