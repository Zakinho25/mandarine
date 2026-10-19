import { describe, expect, it } from 'vitest'
import { timestampOf, uuidv7 } from './ids'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

describe('uuidv7', () => {
  it('respecte le format UUID', () => {
    expect(uuidv7()).toMatch(UUID_RE)
  })

  it('porte le numéro de version 7 et la variante RFC', () => {
    for (let i = 0; i < 50; i += 1) {
      const uuid = uuidv7()
      expect(uuid.charAt(14)).toBe('7')
      expect('89ab').toContain(uuid.charAt(19))
    }
  })

  it('encode l’horodatage fourni', () => {
    const now = 1_760_000_000_000
    expect(timestampOf(uuidv7(now))).toBe(now)
  })

  it('se trie dans l’ordre chronologique', () => {
    const early = uuidv7(1_700_000_000_000)
    const late = uuidv7(1_800_000_000_000)
    expect([late, early].sort()).toEqual([early, late])
  })

  it('ne produit pas de collision', () => {
    const generated = new Set<string>()
    for (let i = 0; i < 2000; i += 1) generated.add(uuidv7())
    expect(generated.size).toBe(2000)
  })
})
