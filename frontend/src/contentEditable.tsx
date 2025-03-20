import React, {CSSProperties, useCallback, useEffect, useRef, useState} from 'react'
import {flushSync} from 'react-dom'
import {useDebouncedCallback} from 'use-debounce'
import {getCursorPosition, setCursorPosition} from './cursorUtils'

const editableStyle: CSSProperties = {
  outline: 0,
  minWidth: 150,
}

type ContentEditableProps = {
  onSave?: (value: string) => void
  onCancel?: () => void
  value: string
  style?: CSSProperties
  onClick?: (e: MouseEvent) => void
  editStyle?: CSSProperties
  readOnly?: boolean
  editMode?: boolean
  editableDefault?: boolean
}

const contentEditable = <P extends object>(Component: React.ComponentType<P>): React.FC<P & ContentEditableProps> => {
  return ({
    onSave,
    onCancel,
    value,
    editStyle,
    editableDefault = false,
    editMode = false,
    readOnly = false,
    ...props
  }: P & ContentEditableProps) => {
    const [editing, setEditing] = useState(editMode)
    useEffect(() => {
      setEditing(editMode)
      if (editMode) {
        setCursor()
      }
    }, [editMode])
    const ref = useRef<HTMLElement>(null)
    const pendingSingleClickEvent = useRef<boolean>(false)
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const debouncedSave = useDebouncedCallback(() => {
      if (ref.current && (editing || editableDefault) && value !== ref.current.textContent) {
        onSave?.(ref.current.textContent ?? '')
      }
    }, 400)

    useEffect(() => {
      if (ref.current && document.activeElement !== ref.current) {
        ref.current.textContent = value
      }
    }, [value])

    useEffect(() => {
      if (ref.current && ref.current.textContent == '') {
        // This is being called twice so check if we already set the text
        ref.current.textContent = value
      }

      if (ref.current) {
        ref.current.addEventListener('paste', (event) => {
          event.preventDefault()
          event.target.textContent = event.clipboardData.getData('text/plain')
          setTimeout(setCursor, 0)
          debouncedSave()
        })
      }
    }, [ref.current])

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
      debouncedSave()
      // if (ref.current) {
      //   if (e.key === 'Escape') {
      //     handleCancel()
      //   }
      if (e.key === 'Enter') {
        e.preventDefault()
        debouncedSave.flush()
        if (onSave && !(readOnly || editableDefault)) {
          setEditing(false)
        }
      }
      // }
    }, [])

    useEffect(() => {
      const handleClickOutside = ({target}: MouseEvent | TouchEvent) => {
        if (!ref.current || (target instanceof HTMLElement && ref.current?.contains(target))) {
          return
        }

        // handleCancel()
        debouncedSave.flush()
        if (onSave && !(readOnly || editableDefault)) {
          setEditing(false)
        }
        onCancel?.()
      }
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)

      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('touchstart', handleClickOutside)
      }
    }, [ref.current])

    const handleCancel = () => {
      setEditing(false)
      if (ref.current) {
        ref.current.textContent = value
      }
    }

    const setCursor = () => {
      if (ref.current) {
        const sel = window.getSelection()
        if (sel) {
          const node = sel.focusNode
          const offset = sel.focusOffset
          const pos = getCursorPosition(ref.current, node, offset, {pos: 0, done: false})
          if (offset === 0) pos.pos += 0.5

          // ref.current.innerHTML = value

          sel.removeAllRanges()
          const range = setCursorPosition(ref.current, document.createRange(), {
            pos: pos.pos,
            done: false,
          })
          range.collapse(true)
          sel.addRange(range)
        }
      }
    }

    const beginEdit = () => {
      flushSync(() => {
        setEditing(true)
        setTimeout(setCursor, 0)
      })
    }

    const handleClick = (e: MouseEvent) => {
      if (editing) {
        e.stopPropagation()
        return
      }
      if (pendingSingleClickEvent.current === true) {
        pendingSingleClickEvent.current = false
      } else if (timer.current !== null) {
        // double click
        console.log('doubleclick')
        e.stopPropagation()
        clearTimeout(timer.current)
        timer.current = null
        if (onSave && !(readOnly || editableDefault)) {
          beginEdit()
        }
      } else {
        e.stopPropagation()
        console.log('singleclick')
        // @ts-ignore
        const clonedNativeEvent = new MouseEvent('click', e.nativeEvent)
        timer.current = setTimeout(() => {
          if (ref.current) {
            pendingSingleClickEvent.current = true
            if (!editing) {
              ref.current.dispatchEvent(clonedNativeEvent)
            }
          }
          if (timer.current) {
            clearTimeout(timer.current)
            timer.current = null
          }
        }, 220) // https://en.wikipedia.org/wiki/Double-click#Speed_and_timing (500 seems too slow)
      }
    }

    return (
      <Component
        suppressContentEditableWarning
        contentEditable={!readOnly && (editing || editableDefault)}
        onClick={handleClick}
        ref={ref}
        {...(props as P)}
        onKeyDown={handleKeyDown}
        style={{
          ...props.style,
          ...editableStyle,
          // ...(!editing && {userSelect: 'none'}),
          // ...(!editing && !readOnly && {cursor: 'pointer'}),
          ...(editing && editStyle),
        }}>
        {/* {value} */}
      </Component>
    )
  }
}

export default contentEditable
