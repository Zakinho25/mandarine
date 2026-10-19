import { annotate } from '@/domain/pinyin'
import { toneColorVar } from './tones'

interface PinyinProps {
  /** Pinyin sous sa forme canonique numérotée, par exemple `ni3 hao3`. */
  readonly numbered: string
  readonly className?: string
}

/**
 * Affiche du pinyin avec ses diacritiques, chaque syllabe colorée selon son ton.
 *
 * Le composant ne décide rien : il consomme `annotate`, qui est une fonction
 * pure testée. La couleur passe par une variable CSS, donc le schéma choisi
 * dans les préférences — y compris « sans couleur » — s'applique partout d'un
 * seul coup.
 */
export function Pinyin({ numbered, className }: PinyinProps) {
  const tokens = annotate(numbered)

  return (
    <span className={className}>
      {tokens.map((token, index) => (
        <span
          // Les fragments n'ont pas d'identité propre : l'index est leur clé.
          key={`${String(index)}-${token.text}`}
          style={{ color: toneColorVar(token.tone) }}
        >
          {token.text}
        </span>
      ))}
    </span>
  )
}
