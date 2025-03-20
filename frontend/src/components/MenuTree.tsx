import {styled} from '@linaria/react'

import React, {ReactElement, useEffect, useMemo, useState} from 'react'
import {
  Tree,
  MultiBackend,
  getBackendOptions,
  NodeModel,
  useDragOver,
  DragLayerMonitorProps,
  InitialOpen,
  ChangeOpenHandler,
  DropOptions,
} from '@minoru/react-dnd-treeview'
import {DndProvider} from 'react-dnd'
import {CaretRightFilled} from '@ant-design/icons'
import {Button} from 'antd'
import {css} from '@linaria/core'

export type MenuData = {
  type: 'collection' | 'codelist' | 'phenotype'
  id: string
  collectionID?: string
  node: any
  level: number
  numItems: number
  path?: string[]
  visibility: 'Public' | 'Private' | 'Shared'
}

type MenuTreeProps = {
  data: NodeModel<MenuData>[]
  renderNode: (node: NodeModel<MenuData>) => ReactElement
  initialOpen?: InitialOpen
  onChangeOpen?: ChangeOpenHandler
  onTreeUpdate?: (newTree: NodeModel<MenuData>[], options: DropOptions<MenuData>) => Promise<any>
}

const MenuTree: React.FC<MenuTreeProps> = ({data, renderNode, initialOpen, onChangeOpen, onTreeUpdate}) => {
  const [menuData, setMenuData] = useState(data)
  useEffect(() => {
    setMenuData(data)
  }, [data])
  return (
    <div>
      <DndProvider backend={MultiBackend} options={getBackendOptions()}>
        <TreeRoot>
          <Tree
            tree={menuData}
            rootId={0}
            render={(node, {depth, isOpen, onToggle}) => (
              <CustomNode node={node} depth={depth} isOpen={isOpen} onToggle={onToggle} renderNode={renderNode} />
            )}
            onDrop={(newTree: NodeModel<MenuData>[], options: DropOptions<MenuData>) => {
              if (!onTreeUpdate) return
              onTreeUpdate(newTree, options)
                .then(() => setMenuData(newTree))
                .catch(() => {})
            }}
            sort={false}
            insertDroppableFirst={false}
            canDrop={(tree, {dragSource, dropTargetId, dropTarget}) => {
              if (dragSource?.data?.type !== 'collection' && dropTargetId == 0) {
                return false
              }
              if (dropTarget?.data?.type == 'collection' && dragSource?.data?.type == 'collection') return false
              if (dragSource?.parent === dropTargetId) {
                return true
              }
              // if (!['collection', 'atomic_concept'].includes(dropTarget?.data?.type || '')) return false
            }}
            dropTargetOffset={5}
            initialOpen={initialOpen}
            onChangeOpen={onChangeOpen}
            classes={{
              root: treeRoot,
              draggingSource,
              dropTarget,
              placeholder: placeholderContainer,
            }}
            placeholderRender={(node, {depth}) => <Placeholder node={node} depth={depth} />}
            dragPreviewRender={(monitorProps) => <CustomDragPreview monitorProps={monitorProps} />}
          />
        </TreeRoot>
      </DndProvider>
    </div>
  )
}

type CustomDragPreviewProps = {
  monitorProps: DragLayerMonitorProps<any>
}

const CustomDragPreview: React.FC<CustomDragPreviewProps> = (props) => {
  const item = props.monitorProps.item

  return (
    <div className={dragPreview}>
      <div className={labelStyle}>{item.text}</div>
    </div>
  )
}

const labelStyle = css`
  align-items: center;
  display: flex;
`
const dragPreview = css`
  align-items: center;
  border: 1px solid #00bcff;
  background: #fff;
  color: #000;
  font-size: 12px;
  padding: 2px 4px;
  pointer-events: none;
  width: 200px;
`

type PlaceholderProps = {
  node: NodeModel
  depth: number
}
const Placeholder: React.FC<PlaceholderProps> = (props) => {
  const left = props.depth * 8 + 20
  return <div className={placeHolder} style={{left}}></div>
}

const treeRoot = css`
  height: 100%;
`

const placeholderContainer = css`
  position: relative;
`

const placeHolder = css`
  background-color: #000;
  height: 1px;
  position: absolute;
  right: 0;
  transform: translateY(-50%);
  top: 0;
`

const draggingSource = css`
  opacity: 0.3;

  .ant-btn {
    visibility: hidden;
  }
`
const dropTarget = css`
  background-color: #e8f0fe;
`

const TreeRoot = styled.div`
  height: 100%;
  ul {
    list-style: none;
    margin: 0;
    padding: 0;

    &:first-child {
      height: 100%;
      /* padding-bottom: 20px; */
      padding-bottom: 20px;
    }
  }
`

const CustomNode = (props: any) => {
  const {id, droppable, data} = props.node
  const indent = props.depth * 8

  const enableToggle = useMemo(() => {
    return ['collection', 'composite_concept'].includes(props.node.data?.type)
  }, [props.node])

  const dragOverProps = useDragOver(id, props.isOpen, (...rest) => {
    if (id.split('-')[0] === 'coll' && props.node.data?.type == 'collection') return
    props.onToggle(...rest)
  })

  return (
    <ItemRoot indent={indent} {...dragOverProps}>
      <ExpandIconWrapper isOpen={props.isOpen}>
        {enableToggle && (
          <Button
            size="small"
            type="text"
            icon={<CaretRightFilled />}
            onClick={() => props.onToggle(props.node.id)}></Button>
        )}
      </ExpandIconWrapper>
      {/* onClick={['collection'].includes(props.node.data?.type) ? handleToggle : undefined} */}
      <div>{props.renderNode(props.node)}</div>
    </ItemRoot>
  )
}
export default MenuTree

export const ItemRoot = styled.div<{indent: number}>`
  align-items: center;
  display: grid;
  grid-template-columns: 20px auto;
  height: 24px;
  padding-inline-start: ${(props) => props.indent}px;
  position: relative;
`

export const ExpandIconWrapper = styled.div<{isOpen: boolean}>`
  align-items: center;
  font-size: 0;
  /* cursor: pointer; */
  display: flex;
  height: 20px;
  justify-content: center;
  width: 20px;
  transition: transform linear 0.1s;
  transform: rotate(${(props) => (props.isOpen ? 90 : 0)}deg);

  .ant-btn-icon-only.ant-btn-sm {
    height: 20px;
    font-size: 10px;
    width: 20px;
  }

  .ant-btn-icon-only.ant-btn-sm .anticon-caret-right {
    font-size: 10px;
  }
`
