import { annotate, annotateMarked } from '@/domain/pinyin'
import { toneColorVar } from './tones'

interface PinyinProps {
  /** Pinyin sous sa forme canonique numérotée, par exemple `ni3 hao3`. */
  readonly numbered: string
  /**
   * Pinyin accentué tel qu'il doit être lu, sandhi compris. Quand il est
   * fourni, c'est lui qui s'affiche : la forme numérotée est celle de
   * citation, et pour 不客气 elle donnerait `bù` au lieu du `bú` réellement
   * prononcé.
   */
  readonly marked?: string
  readonly className?: string
}

/**
 * Affiche du pinyin avec ses diacritiques, chaque syllabe colorée selon son ton.
 *
 * Le composant ne décide rien : il consomme des fonctions pures testées. La
 * couleur passe par une variable CSS, donc le schéma choisi dans les
 * préférences — y compris « sans couleur » — s'applique partout d'un seul coup.
 */
export function Pinyin({ numbered, marked, className }: PinyinProps) {
  const tokens =
    (marked === undefined ? undefined : annotateMarked(numbered, marked)) ??
    annotate(numbered)

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
