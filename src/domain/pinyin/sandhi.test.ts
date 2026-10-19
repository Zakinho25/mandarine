import { describe, expect, it } from 'vitest'
import { applySandhi } from './sandhi'

/** Raccourci : les tons réellement prononcés. */
function spoken(numbered: string, characters?: string): number[] {
  return applySandhi(numbered, characters).syllables.map((s) => s.spokenTone)
}

describe('troisièmes tons consécutifs', () => {
  it('transforme le premier des deux en deuxième ton', () => {
    // 你好 s'écrit nǐ hǎo et se dit ní hǎo. C'est le tout premier mot qu'on
    // apprend, et le tout premier piège.
    expect(spoken('ni3 hao3')).toEqual([2, 3])
    expect(applySandhi('ni3 hao3').spokenNumbered).toBe('ni2 hao3')
    expect(applySandhi('ni3 hao3').rules).toEqual(['tiers_consecutifs'])
  })

  it('ne change que tous sauf le dernier d’une série', () => {
    expect(spoken('wo3 hen3 hao3')).toEqual([2, 2, 3])
  })

  it('laisse un troisième ton isolé tranquille', () => {
    expect(spoken('hao3')).toEqual([3])
    expect(applySandhi('hao3').changed).toBe(false)
  })

  it('s’applique sans connaître les caractères', () => {
    // La règle ne dépend que des tons : elle doit fonctionner sur du pinyin nu.
    expect(applySandhi('ni3 hao3').changed).toBe(true)
  })
})

describe('demi-troisième ton', () => {
  it('signale un troisième ton suivi d’un autre ton', () => {
    const result = applySandhi('lao3 shi1')
    expect(result.syllables[0]?.spokenTone).toBe(3)
    expect(result.syllables[0]?.rule).toBe('demi_troisieme')
    // Ce n'est pas un changement de ton : la syllabe reste au troisième.
    expect(result.changed).toBe(false)
  })

  it('ne le signale pas devant un autre troisième ton', () => {
    expect(applySandhi('ni3 hao3').syllables[0]?.rule).toBe('tiers_consecutifs')
  })

  it('ne le signale pas en fin de mot', () => {
    expect(applySandhi('hao3').syllables[0]?.rule).toBeNull()
  })
})

describe('一', () => {
  it('passe au deuxième ton devant un quatrième', () => {
    expect(spoken('yi1 xia4', '一下')).toEqual([2, 4])
    expect(spoken('yi1 yang4', '一样')).toEqual([2, 4])
    expect(spoken('yi1 hui4 r5', '一会儿')).toEqual([2, 4, 5])
    expect(applySandhi('yi1 xia4', '一下').rules).toEqual(['yi_devant_quatrieme'])
  })

  it('passe au quatrième ton devant les autres tons', () => {
    expect(spoken('yi1 qi3', '一起')).toEqual([4, 3])
    expect(spoken('yi1 ban1', '一般')).toEqual([4, 1])
    expect(spoken('yi1 zhi2', '一直')).toEqual([4, 2])
  })

  it('garde son ton quand rien ne le suit', () => {
    // 第一 : ordinal, 一 est en fin de mot et ne bouge pas.
    expect(spoken('di4 yi1', '第一')).toEqual([4, 1])
    expect(spoken('yi1', '一')).toEqual([1])
    expect(applySandhi('yi1', '一').changed).toBe(false)
  })
})

describe('不', () => {
  it('passe au deuxième ton devant un quatrième', () => {
    expect(spoken('bu4 yao4', '不要')).toEqual([2, 4])
    expect(spoken('bu4 ke4 qi5', '不客气')).toEqual([2, 4, 5])
    expect(applySandhi('bu4 yao4', '不要').rules).toEqual(['bu_devant_quatrieme'])
  })

  it('ne bouge pas devant les autres tons', () => {
    expect(spoken('bu4 hao3', '不好')).toEqual([4, 3])
    expect(spoken('bu4', '不')).toEqual([4])
    expect(applySandhi('bu4 hao3', '不好').changed).toBe(false)
  })
})

describe('robustesse', () => {
  it('ignore les règles de 一 et 不 si les caractères ne s’alignent pas', () => {
    // Deux syllabes, trois caractères : on ne devine pas lequel est lequel.
    expect(spoken('yi1 xia4', '一下下')).toEqual([1, 4])
  })

  it('ignore les règles de 一 et 不 sans caractères', () => {
    expect(spoken('yi1 xia4')).toEqual([1, 4])
  })

  it('ne touche à rien quand aucune règle ne s’applique', () => {
    const result = applySandhi('xue2 xi2', '学习')
    expect(result.changed).toBe(false)
    expect(result.rules).toEqual([])
    expect(result.spokenNumbered).toBe('xue2 xi2')
  })

  it('accepte une entrée vide', () => {
    const result = applySandhi('')
    expect(result.syllables).toEqual([])
    expect(result.changed).toBe(false)
    expect(result.spokenNumbered).toBe('')
  })

  it('conserve le ü', () => {
    expect(applySandhi('nü3 er2', '女儿').spokenNumbered).toBe('nü3 er2')
  })
})

describe('combinaisons', () => {
  it('applique 一 et le demi-troisième ton dans le même mot', () => {
    // 一点儿 : 一 passe au quatrième devant un troisième, et 点 est un
    // demi-troisième ton parce qu'il est suivi du suffixe érhua.
    const result = applySandhi('yi1 dian3 r5', '一点儿')
    expect(result.syllables.map((s) => s.spokenTone)).toEqual([4, 3, 5])
    expect(result.syllables[0]?.rule).toBe('yi_devant_autre')
    expect(result.syllables[1]?.rule).toBe('demi_troisieme')
  })
})
