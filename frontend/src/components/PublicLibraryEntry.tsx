import {EllipsisOutlined} from '@ant-design/icons'
import {styled} from '@linaria/react'
import {Dropdown, Button} from 'antd'
import {MenuInfo} from 'rc-menu/lib/interface'
import React, {useCallback} from 'react'
import {ItemType} from 'antd/lib/menu/hooks/useItems'

type PublicLibraryEntryProps = {
  value: string
}

const PublicLibraryEntry: React.FC<PublicLibraryEntryProps> = ({value}) => {
  const handleMenuClick = useCallback(({key}: MenuInfo) => {
    // switch (key) {

    // }
    console.log('clicked')
  }, [])
  const menuItems: ItemType[] = [
    {label: 'Copy to workspace', key: 'rename'},
    {type: 'divider'},
    {label: 'See details', key: 'share'},
    {label: 'Hide', key: 'details'},
  ]

  return (
    <Root>
      <div style={{flex: 1, minWidth: 0}}>
        <Dropdown menu={{onClick: handleMenuClick, items: menuItems}} trigger={['contextMenu']}>
          <Label title={value}>{value}</Label>
        </Dropdown>
      </div>
      <Controls>
        <Dropdown menu={{onClick: handleMenuClick, items: menuItems}} trigger={['click']}>
          <Button size="small" type="text" icon={<EllipsisOutlined />}></Button>
        </Dropdown>
      </Controls>
    </Root>
  )
}

const Controls = styled.div`
  visibility: hidden;
`

const Root = styled.div`
  display: flex;

  &:hover ${Controls} {
    visibility: visible;
  }
`

const Label = styled.p`
  border: 1px solid transparent;
  margin: 0;
  box-sizing: border-box;
  line-height: 1.75;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
`
export default PublicLibraryEntry
