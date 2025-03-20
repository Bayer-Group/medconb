import { useMutation} from '@apollo/client'
import {NodeModel} from '@minoru/react-dnd-treeview'
import React, { useState} from 'react'
import {useDispatch} from 'react-redux'
import { Collection} from '..'
import MenuEntry from './components/MenuEntry'
import {MenuData} from './components/MenuTree'
import {
  UPDATE_COLLECTION,
} from './graphql'
import { renameObject} from './store/workspace'
import {useNavigate} from 'react-router-dom'
import useCollectionActions from './collections/useCollectionActions'

type CollectionMenuEntryProps = {
  node: NodeModel<MenuData>
  sectionKey: string
  readonly?: boolean
}

const CollectionMenuEntry: React.FC<CollectionMenuEntryProps> = ({node, sectionKey, readonly = false}) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [renaming, setRenaming] = useState(false)

  const {collectionMenu, handleMenuClick, actionsDom, addPhenotype, addCodelist} = useCollectionActions(
    node?.data?.node as Collection,
    node?.data?.visibility != 'Private',
    {
      onRename: () => setRenaming(true),
    },
  )

  const onAdd = async () => {
    if (node.data?.node.itemType == 'Phenotype') {
      await addPhenotype()
    } else {
      await addCodelist()
    }
  }

  const [updateCollection, _] = useMutation(UPDATE_COLLECTION)

  const handleUpdate = (node: NodeModel<MenuData>) => (newName: string) => {
    updateCollection({variables: {name: newName, collectionID: node.data?.id, type: node.data?.node.type}})
    setRenaming(false)
    dispatch(renameObject({id: node.data?.id!, name: newName}))
  }

  return (
    <>
      {actionsDom}
      <MenuEntry
        isPublic={node.data?.node.visibility == 'Public'}
        value={node.text}
        menuItems={collectionMenu}
        onMenuClick={handleMenuClick}
        onAddClick={node.data?.node.visibility != 'Private' ? undefined : onAdd}
        addToolTip={node.data?.node.itemType == 'Phenotype' ? 'Add Phenotype' : 'Add Codelist'}
        editing={renaming}
        onRename={readonly ? undefined : handleUpdate(node)}
        onCancelRename={() => setRenaming(false)}
        onClick={() => {
          navigate(`/collection/${node.data?.node.itemType}/${node.data!.id}`)
        }}
      />
    </>
  )
}

export default CollectionMenuEntry
