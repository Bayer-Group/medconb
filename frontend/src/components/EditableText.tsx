import {styled} from '@linaria/react'
import {Input} from 'antd'
import React, {useCallback, useState, MouseEvent, KeyboardEvent, useRef, useEffect} from 'react'

type EditableTextProps = {
  value: string
  editing?: boolean
  onSave?: (value: string) => void
  onCancel?: () => void
}

const EditableText: React.FC<EditableTextProps> = ({value, editing = false, onSave, onCancel}) => {
  const [internalEditing, setEditing] = useState(editing)
  const [internalValue, setValue] = useState(value)
  const inputRef = useRef<any>(null)

  useEffect(() => {
    setEditing(editing)
  }, [editing])

  useEffect(() => {
    if (internalEditing) inputRef.current?.focus()
  }, [inputRef.current, internalEditing])

  useEffect(() => {
    const handleClickOutside = (e: globalThis.MouseEvent | globalThis.TouchEvent) => {
      if (!inputRef.current || inputRef.current?.input.contains(e.target)) {
        return
      }

      setEditing(false)
      setValue(value)
      onCancel?.()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('touchstart', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [inputRef.current])

  const handleDoubleClick = useCallback((e: MouseEvent) => {
    if (onSave && e.detail === 2) {
      setEditing(true)
    }
  }, [])

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEditing(false)
        setValue(value)
        onCancel?.()
      }
      if (e.key === 'Enter') {
        onSave?.(internalValue)
        setEditing(false)
      }
    },
    [internalValue],
  )

  if (internalEditing) {
    return (
      <Input
        style={{padding: 0, fontSize: 12, appearance: 'none', borderStyle: 'solid', minHeight: 23}}
        ref={inputRef}
        onKeyUp={handleKeyUp}
        value={internalValue}
        onChange={(e) => setValue(e.target.value)}
        onClick={(e) => e.stopPropagation()}
      />
    )
  }

  return (
    <Root onClick={handleDoubleClick} title={value}>
      {internalValue}
    </Root>
  )
}

export default EditableText
const Root = styled.p`
  border: 1px solid transparent;
  margin: 0;
  box-sizing: border-box;
  line-height: 1.75;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  width: 100%;
  min-height: 20px;
`
