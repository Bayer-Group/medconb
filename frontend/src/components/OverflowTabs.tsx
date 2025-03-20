import Icon from '@ant-design/icons/lib/components/Icon'
import {styled} from '@linaria/react'
import {Button, Dropdown, Flex} from 'antd'
import classNames from 'classnames'
import React, {ReactNode, useEffect, useMemo, useRef, useState} from 'react'
import {CloseIcon} from '../customIcons'
import {ItemType} from 'antd/es/menu/hooks/useItems'
import {DownOutlined} from '@ant-design/icons'
import {css} from '@linaria/core'
import {MenuInfo} from 'rc-menu/lib/interface'
import {find, isNil} from 'lodash'
import EntityTypeIcon from './EntityTypeIcon'

export type TabItem = {
  id: string
  type: 'CodelistCollection' | 'PhenotypeCollection' | 'Phenotype'
  transient?: boolean
  label?: string
}

type OverflowTabsProps = {
  tabs: TabItem[]
  active?: TabItem
  renderLabel: (tab: TabItem) => ReactNode
  onTabClose: (tab: TabItem) => void
  onTabClick: (tab: TabItem) => void
  onTabDblClick?: (tab: TabItem) => void
}

const TAB_WIDTH = 168

export type TabsHandleType = {
  getContainerRef: () => HTMLDivElement | null
}

const OverflowTabs: React.FC<OverflowTabsProps> = ({
  tabs,
  onTabClose,
  onTabClick,
  renderLabel,
  active,
  onTabDblClick,
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    if (!ref.current) return

    setWidth(ref.current.offsetWidth)

    const resizeObserver = new ResizeObserver((entries) => {
      if (!isNil(entries[0].contentRect.width)) {
        setWidth(entries[0].contentRect.width)
      }
    })
    resizeObserver.observe(ref.current)
    return () => resizeObserver.disconnect()
  }, [])

  const [tabItems, dropdownItems] = useMemo(() => {
    const numElements = width === 0 ? 1 : Math.floor((width - 24) / TAB_WIDTH) /* 24px space for dropdown */
    return reorderTabs(tabs, numElements, active)
  }, [width, active, tabs])

  const dropDownMenuItems: ItemType[] = useMemo(() => {
    return (dropdownItems ?? []).map((item) => ({
      label: (
        <Flex gap={4} align="center">
          <EntityTypeIcon isActive type={item.type} size="small" />
          <span style={{flex: 1}}>{renderLabel(item)}</span>
          <Button
            onClick={(e) => {
              e.stopPropagation()
              onTabClose(item)
            }}
            size="small"
            type="text"
            icon={<Icon component={() => <CloseIcon />} />}
          />
        </Flex>
      ),
      key: item.id,
    }))
  }, [dropdownItems])

  const handleDropDownItemclick = (info: MenuInfo) => {
    const item = find(tabs, {id: info.key})
    if (item) {
      onTabClick(item)
    }
  }

  return (
    <Root ref={ref} data-tour-target="__open-tabs__">
      <CustomMenu>
        {tabItems.map((obj) => (
          <TabItem
            active={obj.id === active?.id}
            renderLabel={renderLabel}
            key={obj.id}
            obj={obj}
            onClick={() => onTabClick(obj)}
            onClose={() => onTabClose(obj)}
            onDblClick={() => onTabDblClick?.(obj)}
          />
        ))}
      </CustomMenu>
      {dropDownMenuItems.length > 0 && (
        <Dropdown
          // className={`${hashId}`}
          placement="bottomRight"
          menu={{onClick: handleDropDownItemclick, items: dropDownMenuItems}}
          overlayClassName={customMenu}
          trigger={['click']}>
          <Button onClick={(e) => e.stopPropagation()} size="small" type="text" icon={<DownOutlined />}></Button>
        </Dropdown>
      )}
    </Root>
  )
}

type TabItemProps = {
  obj: TabItem
  active: boolean
  renderLabel: (tab: TabItem) => ReactNode
  onClose: () => void
  onClick: () => void
  onDblClick?: () => void
}
const TabItem: React.FC<TabItemProps> = ({obj, active, renderLabel, onClose, onClick, onDblClick}) => {
  const ref = useRef<HTMLLIElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleClick = (e: MouseEvent) => {
    if (timer.current !== null) {
      // double click
      e.stopPropagation()
      clearTimeout(timer.current)
      timer.current = null
      onDblClick?.()
    } else {
      e.stopPropagation()
      // @ts-ignore
      timer.current = setTimeout(() => {
        if (ref.current) {
          onClick()
        }
        if (timer.current) {
          clearTimeout(timer.current)
          timer.current = null
        }
      }, 220) // https://en.wikipedia.org/wiki/Double-click#Speed_and_timing (500 seems too slow)
    }
  }
  return (
    <li
      title={obj.label}
      key={obj.id}
      ref={ref}
      // @ts-ignore
      onClick={handleClick}
      className={classNames({active, transient: obj.transient})}>
      <EntityTypeIcon isActive type={obj.type} size="small" />
      {renderLabel(obj)}
      <Button
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        size="small"
        type="text"
        icon={<Icon component={() => <CloseIcon />} />}
      />
    </li>
  )
}

export default OverflowTabs

export const reorderTabs = (items: any[], show: number, active?: any): [tabs: TabItem[], dropdownitems: TabItem[]] => {
  const _tabItems = items.slice(0, show)
  let _dropdownItems = items.slice(show)

  if (active) {
    const activeItemInTabs = find(_tabItems, {id: active.id})

    if (!activeItemInTabs) {
      const lastItem = _tabItems.pop()
      _tabItems.push(active)
      _dropdownItems = _dropdownItems.filter((item) => item.id !== active.id).concat([lastItem])
    }
  }
  return [_tabItems, _dropdownItems]
}

const Root = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

const customMenu = css`
  background: green;
  .ant-dropdown-menu-item {
    padding: 2px 0 !important;
  }
`

const CustomMenu = styled.ul`
  border: 0;
  line-height: 32px;
  border-bottom: 1px solid rgba(5, 5, 5, 0.06);
  box-shadow: none;
  list-style-type: none;
  list-style-image: none;
  display: flex;
  margin: 0;
  padding: 0;
  height: 100%;

  li {
    top: 1px;
    margin-top: -1px;
    margin-bottom: 0;
    border-radius: 0;
    /* padding-right: 2px; */
    padding-left: 8px;
    cursor: pointer;
    white-space: nowrap;
    user-select: none;
    position: relative;

    display: inline-flex;
    align-items: center;
    gap: 4px;

    border-right: 2px solid #fff;

    /* &:not(:last-child) {
      border-right: 2px solid #fff;
    } */
    opacity: 0.5;

    &.transient {
      font-style: italic;
    }

    & > span {
      max-width: 110px;
      width: 110px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &.active {
      opacity: 1;
      background: #fff;
      /* &:after {
        position: absolute;
        bottom: 0;
        right: 0;
        left: 0;
        border-bottom: 2px solid #1677ff;
        transition: border-color 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
        content: '';
      } */
    }
  }
`
