import React, {KeyboardEvent, useCallback, useEffect, useRef, useState} from 'react'
import {useDebouncedCallback} from 'use-debounce'
import {parsePattern} from 'regexp-parser-literal'
import {styled} from '@linaria/react'
import {CloseCircleFilled} from '@ant-design/icons'
import Icon from '@ant-design/icons/lib/components/Icon'
import {Button, theme} from 'antd'
import {RegexIcon} from '../customIcons'
import {getCursorPosition, setCursorPosition} from '../cursorUtils'

const {useToken} = theme

type ArrayElement<ArrayType extends readonly unknown[]> = ArrayType extends readonly (infer ElementType)[]
  ? ElementType
  : never
type RegexInputProps = {
  onChange: (pattern: string | null, mode: Mode) => void
  onEnter: () => void
  value: string
  mode: Mode
}
type Pattern = ReturnType<typeof parsePattern>
type Element = ArrayElement<Pattern['elements']>

export enum Mode {
  POSIX = 'POSIX',
  ILIKE = 'ILIKE',
}

const processElement = (element: Element, parts: string[]) => {
  if (element.type === 'CharacterSet') {
    if (element.kind === 'space') {
      parts.push(`<span class="space">${element.negate ? '\\S' : '\\s'}</span>`)
    }
    if (element.kind === 'any') {
      parts.push(`<span class="space">${element.raw}</span>`)
    }
    if (element.kind === 'digit') {
      parts.push(`<span class="digit">${element.negate ? '\\D' : '\\d'}</span>`)
    }
    if (element.kind === 'word') {
      parts.push(`<span class="word">${element.negate ? '\\W' : '\\w'}</span>`)
    }
  } else if (element.type === 'CharacterClass') {
    parts.push(`<span class="range">${element.raw}</span>`)
  } else if (element.type === 'Assertion') {
    parts.push(`<span class="range">${element.raw}</span>`)
  } else if (element.type === 'Quantifier') {
    processElement(element.element, parts)
    parts.push(`<span class="quantifier">${element.raw}</span>`)
  } else if (element.type === 'CapturingGroup') {
    parts.push('(')
    element.elements.forEach((e) => processElement(e, parts))
    parts.push(')')
  } else if (element.type === 'Character') {
    parts.push(`<span class="char">${element.raw}</span>`)
  } else if (element.type === 'Disjunction') {
    element.alternatives.forEach((e, i) => {
      if (i !== 0) parts.push('|')
      e.forEach((ee) => processElement(ee, parts))
    })
  }
}

const RegexInput: React.FC<RegexInputProps> = ({onChange, value, mode, onEnter}) => {
  const {hashId} = useToken()
  const rootRef = useRef<HTMLDivElement>(null)
  const [metaKeyActive, setMetaKeyActive] = useState(false)

  const [ast, setAST] = useState<Pattern | null>(null)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Meta') {
      setMetaKeyActive(true)
    }

    if (['Enter'].includes(e.key)) {
      e.preventDefault()
      // onEnter()
    }
  }, [])

  const process = useCallback(() => {
    if (rootRef.current) {
      onChange(rootRef.current.innerText.trim(), mode)
    }
  }, [rootRef.current?.innerText.trim(), mode, onChange])

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Meta') {
        setMetaKeyActive(false)
        return
      }

      if (metaKeyActive) {
        return
      }
      if (['Enter'].includes(e.key)) {
        e.preventDefault()
        onEnter()
      }

      process()
    },
    [metaKeyActive, process],
  )

  useEffect(() => {
    if (rootRef.current) {
      try {
        const ast = parsePattern(String.raw`${value}`)
        setAST(ast)
      } catch (error) {
        console.log(error)
      }
    }
  }, [value, rootRef.current])

  const debouncedProcess = useDebouncedCallback(process, 400)

  useEffect(() => {
    const handlePaste = (e: any) => {
      e.preventDefault()
      e.stopPropagation()
      const text = (e.originalEvent || e).clipboardData.getData('text/plain')

      document.execCommand('insertText', false, text.trim())

      process()
    }
    rootRef.current?.addEventListener('paste', handlePaste)

    return () => {
      rootRef.current?.removeEventListener('paste', handlePaste)
    }
  }, [rootRef.current])

  useEffect(() => {
    // console.log(ast)
    if (rootRef.current && ast) {
      if (ast.elements.length > 0) {
        const parts: string[] = []
        if (ast.type === 'Pattern') {
          ast.elements.forEach((element) => processElement(element, parts))
        }
        const sel = window.getSelection()
        if (sel) {
          const node = sel.focusNode
          const offset = sel.focusOffset
          const pos = getCursorPosition(rootRef.current, node, offset, {pos: 0, done: false})
          if (offset === 0) pos.pos += 0.5

          rootRef.current.innerHTML = parts.join('')

          sel.removeAllRanges()
          const range = setCursorPosition(rootRef.current, document.createRange(), {
            pos: pos.pos,
            done: false,
          })
          range.collapse(true)
          sel.addRange(range)
        }
      } else {
        rootRef.current.innerHTML = ''
      }
    }
  }, [ast?.raw, rootRef.current])

  return (
    <Root className={`ant-input-affix-wrapper ant-input-affix-wrapper-sm ${hashId}`}>
      <RegexEditor
        className="ant-input ant-input-sm"
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        ref={rootRef}
        contentEditable
        data-ph="Search code"
      />
      {/* <TypeToggle
        onClick={() => onChange(value, Mode.ILIKE)}
        icon={<PercentageOutlined style={{color: `rgba(0, 0, 0, ${mode === Mode.ILIKE ? 1 : 0.25})`}} />}></TypeToggle> */}
      {/* <TypeToggle
        tabIndex={-1}
        size="small"
        onClick={() => onChange(value, mode === Mode.POSIX ? Mode.ILIKE : Mode.POSIX)}
        icon={
          <Icon style={{color: `rgba(0, 0, 0, ${mode === Mode.POSIX ? 1 : 0.25})`}} component={RegexIcon} />
        } /> */}
      <Icon
        onClick={() => onChange(value, mode === Mode.POSIX ? Mode.ILIKE : Mode.POSIX)}
        style={{color: `rgba(0, 0, 0, ${mode === Mode.POSIX ? 1 : 0.25})`}}
        component={RegexIcon}
        aria-label='toggle regex mode'
      />
      {value.trim().length > 0 && (
        <ClearIcon className="ant-input-suffix">
          <CloseCircleFilled onClick={() => onChange('', mode)} />
        </ClearIcon>
      )}
    </Root>
  )
}

export default RegexInput

//https://stackoverflow.com/a/3976125/876117
// '#ADC6FF', '#B5F5EC', '#FFC53D', '#B7EB8F', '#FF9C6E'
const Root = styled.div`
  display: flex;
  position: relative;
`

const RegexEditor = styled.div`
  padding: 0;
  border: none;
  outline: none;
  font-family: 'Source Code Pro', monospace;

  &:focus {
    box-shadow: none;
  }

  &:empty:before {
    //:not(:focus)
    content: attr(data-ph);
    color: #bfbfbf;
    user-select: none;
    font-family: revert;
    pointer-events: none;
    /* cursor: text; */
  }
  /* color: #fff; */
  min-width: 150px;
  text-align: left;
  span {
    opacity: 0.6;

    &.space {
      background: #adc6ff;
    }
    &.digit {
      background: #b5f5ec;
    }
    &.range {
      background: #ffc53d;
    }
    &.word {
      background: #b7eb8f;
    }
    &.quantifier {
      background: #ff9c6e;
    }
    &.char {
      background-color: #fff;
      /* color: initial; */
    }
  }
`

const ClearIcon = styled.span`
  margin: 0;
  margin-left: 5px;
  color: rgba(0, 0, 0, 0.25);
  font-size: 10px;
  vertical-align: -1px;
  cursor: pointer;
  transition: color 0.3s;
  /* width: 12px; */
`

const TypeToggle = styled(Button)`
  margin-left: 5px;
  font-size: 10px;
`

TypeToggle.defaultProps = {
  size: 'small',
  type: 'text',
}
