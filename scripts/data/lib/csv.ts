/**
 * Lecteur CSV minimal mais correct (RFC 4180) : guillemets, guillemets
 * doublés, virgules et sauts de ligne à l'intérieur des champs.
 *
 * Écrit à la main plutôt qu'importé : une dépendance de plus pour trente
 * lignes de code, dans un script qui tourne une fois par mise à jour des
 * données, ne se justifie pas.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  let i = 0

  // Retire un éventuel BOM : Excel en sème dans les fichiers.
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text

  while (i < source.length) {
    const char = source.charAt(i)

    if (quoted) {
      if (char === '"') {
        if (source.charAt(i + 1) === '"') {
          field += '"'
          i += 2
          continue
        }
        quoted = false
        i += 1
        continue
      }
      field += char
      i += 1
      continue
    }

    if (char === '"') {
      quoted = true
      i += 1
      continue
    }
    if (char === ',') {
      row.push(field)
      field = ''
      i += 1
      continue
    }
    if (char === '\r') {
      i += 1
      continue
    }
    if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      i += 1
      continue
    }
    field += char
    i += 1
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

/** Lit un CSV à en-tête et renvoie un objet par ligne. */
export function parseCsvRecords(text: string): Record<string, string>[] {
  const rows = parseCsv(text)
  const header = rows[0]
  if (header === undefined) return []

  return rows.slice(1).map((row) => {
    const record: Record<string, string> = {}
    header.forEach((name, index) => {
      record[name] = row[index] ?? ''
    })
    return record
  })
}
