import React from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {Collection} from '..'
import CollectionMenuEntry from './CollectionMenuEntry'
import MenuTree from './components/MenuTree'
import ConceptMenuEntry from './CodeListMenuEntry'
import InlineHelp from './InlineHelp'
import {Headline, Section, Title} from './scratch'
import useMenuTree from './useMenuTree'
import {RootState} from './store'
import {setOpenMenu, toggleSidebarSection} from './store/ui'
import Icon from '@ant-design/icons/lib/components/Icon'
import {SharedIcon} from './customIcons'
import {NodeModel} from '@minoru/react-dnd-treeview'
import {Empty, Tooltip} from 'antd'
import Scrollbars from 'react-custom-scrollbars-2'
import PhenotypeMenuEntry from './PhenotypeMenuEntry'

type SharedCollectionsProps = {
  collections: Collection[]
  title: string
  sectionKey: string
  help?: string
  desc: string
}

const SharedCollections: React.FC<SharedCollectionsProps> = ({collections, title, sectionKey, help, desc}) => {
  const dispatch = useDispatch()
  const menuTree = useMenuTree(collections)
  const openWorkspaceMenu = useSelector((state: any) => state.ui.openWorkspaceMenu[sectionKey])
  const open = useSelector((state: RootState) => state.ui.sidebarOpenSections.includes(sectionKey))

  const openItemCount = collections.reduce((a, c) => {
    return a + (openWorkspaceMenu.includes(c.id) ? c.items.length + 1 : 1)
  }, 0)

  const handleToggle = (e: any) => {
    if (!e.target.closest('.ant-tooltip')) {
      e.stopPropagation()
      dispatch(toggleSidebarSection(sectionKey))
    }
  }

  return (
    <Section style={{flex: open ? 1 : 'initial', maxHeight: 30 + 20 + 24 * Math.min(openItemCount, 10)}}>
      <Headline onClick={handleToggle}>
        <Icon component={() => <SharedIcon fill="#262626" />} />
        <Tooltip
          placement="topLeft"
          overlayInnerStyle={{
            background: '#444',
            borderRadius: 4,
            lineHeight: 1.25,
          }}
          title={() => {
            return (
              <>
                <strong>{`Click to ${open ? 'hide' : 'open'} section.`}</strong>
                <br />
                {desc}
              </>
            )
          }}
          arrow={false}>
          <Title>
            <span>{title}</span>
            {help && <InlineHelp content={help} />}
          </Title>
        </Tooltip>
      </Headline>
      {open && (
        <Scrollbars style={{flex: 1}}>
          <div style={{paddingLeft: 8}}>
            {collections.length == 0 && (
              <Empty style={{transform: 'translateX(-14px)'}} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            )}
            <MenuTree
              data={menuTree}
              initialOpen={openWorkspaceMenu}
              onChangeOpen={(newOpenIds: NodeModel['id'][]) =>
                dispatch(setOpenMenu({section: sectionKey, items: newOpenIds}))
              }
              renderNode={(node) => {
                if (node.data?.type === 'collection') {
                  return <CollectionMenuEntry sectionKey={sectionKey} readonly node={node} key={node.data?.id} />
                } else if (node.data?.type === 'codelist') {
                  return <ConceptMenuEntry sectionKey={sectionKey} readonly key={node.data?.id} node={node} />
                } else {
                  return <PhenotypeMenuEntry readonly key={node.data?.id} node={node} />
                }
              }}
            />
          </div>
        </Scrollbars>
      )}
    </Section>
  )
}

export default SharedCollections
