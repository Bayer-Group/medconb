import {EllipsisOutlined, LoadingOutlined} from '@ant-design/icons'
import {styled} from '@linaria/react'
import {Dropdown, Button, Tooltip, Spin} from 'antd'
import {ItemType} from 'antd/lib/menu/hooks/useItems'
import {MenuInfo} from 'rc-menu/lib/interface'
import React, {useState} from 'react'

import Icon from '@ant-design/icons/lib/components/Icon'
import {CloseIcon, PlusIcon} from '../customIcons'
import {EditableP} from '../scratch'
import Visibility from './Visibility'

type MenuEntryProps = {
  value: string
  menuItems?: ItemType[]
  editing?: boolean
  onMenuClick?: (info: MenuInfo) => void
  onRename?: (value: string) => void
  onAddClick?: () => Promise<any>
  addToolTip?: string
  onCancelRename?: () => void
  onClick?: () => void
  prefix?: string
  busy?: boolean
  isPublic?: boolean
  onClose?: () => void
}

const MenuEntry: React.FC<MenuEntryProps> = ({
  value,
  menuItems,
  onMenuClick,
  onRename,
  editing,
  onAddClick,
  addToolTip,
  onCancelRename,
  onClick,
  prefix,
  busy,
  onClose,
  isPublic = false,
}) => {
  const [loading, setLoading] = useState(false)
  let elem = (
    // <div style={{display: 'flex', alignItems: 'center'}}>
    <div style={{flex: 1}} onClick={onClick}>
      {/* editing={editing} onCancel={onCancelRename} */}
      <EditableP
        editStyle={{background: '#fff'}}
        onCancel={onCancelRename}
        value={value}
        editMode={editing}
        onSave={onRename}
      />
    </div>
    // </div>
  )

  if (menuItems) {
    elem = (
      <Dropdown menu={{items: menuItems, onClick: onMenuClick}} trigger={['contextMenu']}>
        {elem}
      </Dropdown>
    )
  }

  return (
    <Root prefixColor={prefix}>
      {busy && <Spin indicator={<LoadingOutlined style={{fontSize: 14}} spin />} />}

      <Label>
        {isPublic && <Visibility visibility={'Public'} />}
        {elem}
      </Label>
      <Controls>
        {!!menuItems && (
          <Dropdown menu={{items: menuItems, onClick: onMenuClick}} trigger={['click']}>
            <Button onClick={(e) => e.stopPropagation()} size="small" type="text" icon={<EllipsisOutlined />}></Button>
          </Dropdown>
        )}

        {!!onAddClick && (
          <Tooltip placement="right" title={addToolTip}>
            <Button
              onClick={async (e) => {
                e.stopPropagation()
                setLoading(true)
                await onAddClick()
                setLoading(false)
              }}
              size="small"
              type="text"
              disabled={loading}
              loading={loading}
              icon={<PlusIcon />}></Button>
          </Tooltip>
        )}
        {onClose && (
          <Button
            onClick={(e) => {
              e.stopPropagation()
              onClose()
            }}
            size="small"
            type="text"
            icon={<Icon component={() => <CloseIcon />} />}></Button>
        )}
      </Controls>
    </Root>
  )
}

const Controls = styled.div`
  visibility: hidden;
`

const Label = styled.div`
  flex: 1;
  display: flex;
  gap: 4px;
  min-width: 0;
  align-items: center;

  > div {
    max-width: 155px;
  }
`

const Root = styled.div<{prefixColor?: string}>`
  display: flex;

  .ant-spin {
    position: absolute;
    left: -5px;
    top: 50%;
    transform: translateY(-50%);
  }

  &:hover {
    background: #ddd;
    ${Controls} {
      visibility: visible;
    }
  }

  &:before {
    content: ' ';
    position: absolute;
    left: -5px;
    top: 50%;
    transform: translateY(-50%);
    height: 14px;
    width: 14px;
    border-radius: 50%;
    background: ${(props) => props.prefixColor ?? 'transparent'};
    margin-right: 4px;
  }
`

export default MenuEntry
