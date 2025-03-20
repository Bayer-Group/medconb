import {styled} from '@linaria/react'
import BaseEditor, {theme} from '@broncha/rich-markdown-editor'
import {useDebouncedCallback} from 'use-debounce'
import {ComponentProps} from 'react'

const Editor = ({onChange, ...rest}: ComponentProps<typeof BaseEditor>) => {
  const debouncedOnChange = useDebouncedCallback((getContent) => {
    onChange?.(getContent)
  }, 400)

  return (
    <StyledEditor
      disableExtensions={['checkbox_item', 'checkbox_list', 'container_notice', 'table']}
      {...rest}
      onChange={debouncedOnChange}
      theme={{
        ...theme,
        blockToolbarSelectedBackground: '#f1f2f5',
        fontFamily: 'Segoe UI',
      }}
    />
  )
}

Editor.defaultProps = BaseEditor.defaultProps

export default Editor

const StyledEditor = styled(BaseEditor)`
  /* font-size: 9px; */
  .ProseMirror {
    h1 {
      font-size: 20px;
    }
    h2 {
      font-size: 16px;
    }
    h3 {
      font-size: 14px;
    }
    h4,
    h5,
    h6 {
      font-size: 12px;
    }

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      margin: 4px 0;
    }
  }
`
