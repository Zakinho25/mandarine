import type { Lexeme } from '@/data/content'
import type { TexteToken } from '@/data/textes'
import { Pinyin } from './Pinyin'

interface LigneChinoiseProps {
  readonly tokens: readonly TexteToken[]
  readonly lexemes: ReadonlyMap<string, Lexeme>
  readonly showPinyin: boolean
  readonly className?: string
}

/**
 * Une phrase chinoise, avec son pinyin au-dessus de chaque mot.
 *
 * Le pinyin est posé en annotation `ruby`, ce qui le place exactement
 * au-dessus du mot qu'il transcrit et le garde lié à lui quand la phrase
 * passe à la ligne. Les couleurs de ton s'appliquent comme partout ailleurs.
 */
export function LigneChinoise({
  tokens,
  lexemes,
  showPinyin,
  className,
}: LigneChinoiseProps) {
  return (
    <span lang="zh-Hans" className={`hanzi ${className ?? ''}`}>
      {tokens.map((token, index) => {
        const lexeme = token.lexemeId === null ? undefined : lexemes.get(token.lexemeId)
        const key = `${String(index)}-${token.text}`

        if (!showPinyin || lexeme === undefined) {
          return <span key={key}>{token.text}</span>
        }

        return (
          <ruby key={key}>
            {token.text}
            <rt style={{ fontSize: '0.5em' }}>
              <Pinyin numbered={lexeme.pinyinNum} marked={lexeme.pinyinMark} />
            </rt>
          </ruby>
        )
      })}
    </span>
  )
}
