import { UserOutlined} from '@ant-design/icons'
import {Button, Modal, Tooltip} from 'antd'
import React, {MouseEvent, useCallback, useEffect, useState} from 'react'
import MenuTree, {MenuData} from './components/MenuTree'
import {Headline, Section, Title} from './scratch'
import {useMutation} from '@apollo/client'
import {DropOptions, NodeModel} from '@minoru/react-dnd-treeview'
import {useDispatch, useSelector} from 'react-redux'
import {setOpenMenu, addRenamingCollection, toggleSidebarSection} from './store/ui'
import CollectionMenuEntry from './CollectionMenuEntry'
import {CREATE_COLLECTION, MOVE_COLLECTION, MOVE_CODE_LIST, SELF, UPDATE_PHENOTYPE} from './graphql'
import ConceptMenuEntry from './CodeListMenuEntry'
import {codelistMoved} from './store/workspace'
import InlineHelp from './InlineHelp'
import {Collection} from '..'
import useMenuTree from './useMenuTree'
import {PlusIcon} from './customIcons'
import {RootState} from './store'
import PhenotypeMenuEntry from './PhenotypeMenuEntry'
import Icon from '@ant-design/icons/lib/components/Icon'
import Scrollbars from 'react-custom-scrollbars-2'
import {pickBy} from 'lodash'

type PrivateCollectionMenuProps = {
  collections: Collection[]
  collectionType: 'Codelist' | 'Phenotype'
  title: string
  desc: string
  sectionKey: string
  help?: string
}

const PrivateCollectionMenu: React.FC<PrivateCollectionMenuProps> = ({
  collections,
  collectionType,
  title,
  sectionKey,
  help,
  desc,
  ...rest
}) => {
  const dispatch = useDispatch()
  const dataAttributes = pickBy(rest, (v, k) => k.startsWith('data-'))

  const openWorkspaceMenu = useSelector((state: any) => state.ui.openWorkspaceMenu[sectionKey])

  const [creatingCollection, setCreatingCollection] = useState(false)

  const [addCollection, {data}] = useMutation(CREATE_COLLECTION, {
    refetchQueries: [{query: SELF}],
  })

  const [moveCodelist] = useMutation(MOVE_CODE_LIST, {
    refetchQueries: [{query: SELF}],
  })
  const [updatePhenotype] = useMutation(UPDATE_PHENOTYPE, {
    refetchQueries: [{query: SELF}],
  })

  const [moveCollection] = useMutation(MOVE_COLLECTION, {
    refetchQueries: [{query: SELF}],
  })

  const open = useSelector((state: RootState) => state.ui.sidebarOpenSections.includes(sectionKey))

  const newCollectionName = useCallback(() => {
    // if (!wsData) return ''
    let name = 'Untitled Collection'
    const usedNames = collections.map((c: Collection) => c.name)
    let nameAllowed = !usedNames.includes(name)
    let i = 0

    while (!nameAllowed) {
      name = `Untitled Collection ${++i}`
      nameAllowed = !usedNames.includes(name)
    }

    return name
  }, [collections])

  const onAddCollection = useCallback(
    async (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setCreatingCollection(true)
      await addCollection({variables: {name: newCollectionName(), type: collectionType}, awaitRefetchQueries: true})
      setCreatingCollection(false)
    },
    [newCollectionName],
  )

  useEffect(() => {
    if (data) {
      dispatch(addRenamingCollection(data.createCollection.id))
    }
  }, [data])

  const handleMenuTreeUpdate = useCallback(async (newTree: NodeModel<MenuData>[], options: DropOptions<MenuData>) => {
    // newTree[options.destinationIndex] is the new modified data, just modified parent is usable
    // option.dragSource contains the old parent (original)
    // option.dropTarget is the parent into which the item was dropped

    // if options.dropTargetId == 0 then the root is accepting item, i.e. collections are being moved around

    // if options.destinationIndex != 0 the item was dropped below options.destinationIndex - 1 (whether in same parent or different)
    // if options.destinatoinIndex === 0 the item was dropped at the top of the parent (whether in same parent or different)

    // options.destinationIndex - 1 necessarily is not the previous node, as the lib works on a flat data structure
    // need to find the node with same parent as dropTargetId above newTree[options.destinationIndex]
    // console.log(newTree)
    // console.log(options)
    if (!options.dragSource || options.destinationIndex === undefined) return

    // collection being moved around
    if (!options.dropTarget && options.dropTargetId === 0) {
      let refCollectionID = null // default dropped on top of workspace
      const collectionID = options.dragSource.id as string

      if (options.destinationIndex > 0) {
        // dropped below any other collection
        let decr = 1

        while (true) {
          const prevNodeParent = newTree[options.destinationIndex - decr].parent
          if (prevNodeParent == options.dropTargetId) {
            refCollectionID = newTree[options.destinationIndex - decr].id as string
            break
          }
          decr++
        }
      }

      moveCollection({variables: {collectionID, refCollectionID}})
      return
    }

    const dropTargetType = options.dropTarget!.data?.type
    const dropTargetNodeId = options.dropTarget!.id as string

    let parentMedicalConceptID = null
    let itemID: string | null = null // default dropped on top of target level
    let collectionID: string | null = dropTargetNodeId
    // if droptarget is a collection
    if (dropTargetType === 'collection') {
      if (options.dragSource.parent !== options.dropTarget!.id) {
        const usedNames = options.dropTarget!.data!.node.items.map((c: any) => c.name)

        if (usedNames.includes(options.dragSource.data!.node.name)) {
          Modal.warning({
            title: 'Name collision',
            content: `Codelist with name ${options.dragSource.data!.node.name} already exists in collection ${
              options.dropTarget!.data!.node.name
            }`,
          })
          throw new Error('Name collision')
        }
      }
      // dropped below any other MC
      if (options.destinationIndex > 0) {
        let decr = 1
        // let prevNodeParent = newTree[options.destinationIndex - decr++].parent
        while (true) {
          const prevNodeParent = newTree[options.destinationIndex - decr].parent
          if (prevNodeParent == options.dropTargetId) {
            itemID = newTree[options.destinationIndex - decr].id as string
            break
          }

          decr++
        }
      }
    } else {
      // dropped into a composite codelist
      // default within the same composite codelist

      // dropped into different parent
      if (options.dragSource.parent !== options.dropTarget!.id) {
        const usedNames = (options.dropTarget!.data!.node.children ?? []).map((c: any) => c.name)

        if (usedNames.includes(options.dragSource.data!.node.name)) {
          Modal.warning({
            title: 'Name collision',
            content: `Codelist with name ${
              options.dragSource.data!.node.name
            } already exists in composite codelist ${options.dropTarget!.data!.node.name}`,
          })
          throw new Error('Name collision')
        }
      }

      parentMedicalConceptID = dropTargetNodeId
      collectionID = options.dropTarget!.data?.collectionID!
      if (collectionID == options.dragSource.data!.collectionID) {
        collectionID = null
      }

      if (options.destinationIndex > 0) {
        parentMedicalConceptID = null
        itemID = newTree[options.destinationIndex - 1].id as string
      }
    }

    if (options.dragSource.data!.type === 'codelist') {
      moveCodelist({
        variables: {
          codelistID: options.dragSource.data!.id,
          position: {
            containerID: collectionID,
            itemID,
          },
        },
        onCompleted: () => {
          if (
            options &&
            options.dragSource &&
            options.dragSource.data!.collectionID &&
            options.dragSource.data!.collectionID !== collectionID
          ) {
            dispatch(
              codelistMoved({
                sourceCollectionId: options.dragSource.data!.collectionID,
                targetCollectionId: collectionID!,
                mcID: options.dragSource.data!.id,
              }),
            )
          }
        },
      })
    } else if (options.dragSource.data!.type === 'phenotype') {
      updatePhenotype({
        variables: {
          phenotypeID: options.dragSource.data!.id,
          position: {
            containerID: collectionID,
            itemID,
          },
        },
      })
    }
  }, [])

  const menuTree = useMenuTree(collections)

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
    <Section
      {...dataAttributes}
      style={{flex: open ? 1 : 'initial', maxHeight: 36 + 20 + 24 * Math.min(openItemCount, 10)}}>
      <Headline onClick={handleToggle}>
        {/* <Icon component={() => <PrivateIcon fill="#262626" />} /> */}
        <UserOutlined />
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
        <Tooltip placement="right" title={'Add Collection'}>
          <Button
            size="small"
            type="text"
            onClick={onAddCollection}
            icon={<Icon component={PlusIcon} />}
            loading={creatingCollection}
            disabled={creatingCollection}
          />
        </Tooltip>
      </Headline>
      {/* style={{flex: 1}} */}
      {open && (
        <Scrollbars style={{flex: 1}}>
          <div style={{paddingLeft: 8}}>
            <MenuTree
              data={menuTree}
              initialOpen={openWorkspaceMenu}
              onChangeOpen={(newOpenIds: NodeModel['id'][]) =>
                dispatch(setOpenMenu({section: sectionKey, items: newOpenIds}))
              }
              onTreeUpdate={handleMenuTreeUpdate}
              renderNode={(node) => {
                if (node.data?.type === 'collection') {
                  return <CollectionMenuEntry sectionKey={sectionKey} node={node} key={node.data?.id} />
                } else if (node.data?.type === 'codelist') {
                  return <ConceptMenuEntry sectionKey={sectionKey} key={node.data?.id} node={node} />
                } else {
                  return <PhenotypeMenuEntry key={node.data?.id} node={node} />
                }
              }}
            />
          </div>
        </Scrollbars>
      )}
    </Section>
  )
}

export default PrivateCollectionMenu
