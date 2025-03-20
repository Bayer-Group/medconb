import {styled} from '@linaria/react'
import React, {MouseEvent, ReactNode, useCallback, useMemo} from 'react'
import Icon from '@ant-design/icons'
import {Dropdown, DropDownProps, Tooltip} from 'antd'
import {ItemType} from 'antd/lib/menu/hooks/useItems'
import {MenuClickEventHandler} from 'rc-menu/lib/interface'
import {TickIcon} from '../customIcons'
import {Code, Codelist, IntermediateType, Ontology} from '../..'

export enum CodeSelectFlag {
  SELF,
  ALL,
  CHILDREN,
}

export type CodeCheckboxProps = {
  codelist: Codelist
  checked?: boolean
  intermediate?: IntermediateType
  readonly?: boolean
  onChange: (checked: boolean, flag: CodeSelectFlag) => void
  background: string
  label: ReactNode
  hasChildren: boolean
  forceContextMenu?: boolean
}

const CodeCheckbox: React.FC<CodeCheckboxProps> = ({
  codelist,
  checked = false,
  readonly = false,
  onChange,
  background = 'red',
  intermediate = 'NONE',
  label,
  forceContextMenu,
  hasChildren,
  // ...rest
}) => {
  const handleMouseEnter = () => {
    document.querySelectorAll(`[data-codelist-summary]`).forEach((element) => {
      element.classList.remove('highlighted')
    })
    document.querySelector(`[data-codelist-summary-id="${codelist.id}"]`)?.classList.add('highlighted')
  }

  const handleMouseLeave = () => {
    document.querySelectorAll(`[data-codelist-summary]`).forEach((element) => {
      element.classList.remove('highlighted')
    })
  }

  const items: ItemType[] = useMemo(() => {
    let items = []
    if (checked) {
      items = [
        {label: 'Deselect this code and all its descendents', key: 'deselect_all'},
        {label: 'Deselect all the descendents', key: 'deselect_children'},
        {label: 'Deselect this code only', key: 'deselect_one'},
      ]
    } else {
      items = [
        {label: 'Select this code and all its descendents', key: 'select_all'},
        {label: 'Select all the descendents', key: 'select_children'},
        {label: 'Select this code only', key: 'select_one'},
      ]
    }
    return items
  }, [checked])

  const handleMenuClick: MenuClickEventHandler = useCallback(
    ({key}) => {
      switch (key) {
        case 'deselect_all':
        case 'select_all':
          onChange(!checked, CodeSelectFlag.ALL)
          return
        case 'select_one':
        case 'deselect_one':
          onChange(!checked, CodeSelectFlag.SELF)
          return
        case 'select_children':
        case 'deselect_children':
          onChange(!checked, CodeSelectFlag.CHILDREN)
          return
      }
    },
    [checked, onChange],
  )

  const handleClick = useCallback(() => {
    if (!forceContextMenu && !readonly) {
      onChange(!checked, hasChildren ? CodeSelectFlag.ALL : CodeSelectFlag.SELF)
    }
  }, [forceContextMenu, onChange, readonly, checked])

  const trigger: DropDownProps['trigger'] = useMemo(() => {
    if (forceContextMenu) {
      return ['contextMenu', 'click']
    }
    return ['contextMenu']
  }, [forceContextMenu])

  const root = (
    <Root
      $intermediate={intermediate}
      $checked={checked}
      $background={background}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}>
      {!!checked && <Icon component={() => <TickIcon />} style={{color: '#000', flex: 1}} />}
    </Root>
  )

  return (
    // <Tooltip mouseEnterDelay={2} mouseLeaveDelay={0} placement="bottomLeft" align={{targetOffset: [5]}} title={label}>
    <>
      {hasChildren && (
        <Dropdown menu={{onClick: handleMenuClick, items}} trigger={trigger}>
          {root}
        </Dropdown>
      )}

      {!hasChildren && root}
    </>
    // </Tooltip>
  )
}

const Root = styled.div<{$checked: boolean; $background: string; $intermediate: IntermediateType}>`
  height: 16px;
  width: 16px;
  border-radius: 50%;
  background: ${(props) =>
    props.$checked
      ? props.$background
      : props.$intermediate === 'PARTIAL'
      ? 'linear-gradient(180deg, #fff 50%, #bfbfbf 50%)'
      : props.$intermediate === 'FULL'
      ? '#bfbfbf'
      : 'white'};
  border: 1px solid
    ${(props) => (props.$checked ? props.$background : props.$intermediate !== 'NONE' ? ' #8c8c8c' : '#d9d9d9')};
  cursor: pointer;
  text-align: center;
  margin: 0 3px;
  font-size: 12px;
  /* display: flex; */
  align-items: center;
`

export default CodeCheckbox
