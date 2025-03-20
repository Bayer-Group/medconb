import React, {useState} from 'react'
import MenuEntry from './components/MenuEntry'
import {NodeModel} from '@minoru/react-dnd-treeview'
import {MenuData} from './components/MenuTree'
import {useDispatch} from 'react-redux'
import {renameObject} from './store/workspace'
import {useMutation} from '@apollo/client'
import {UPDATE_PHENOTYPE} from './graphql'
import {removeRenamingCodelist} from './store/ui'
import {useNavigate} from 'react-router-dom'
import usePhenotypeActions from './phenotypes/usePhenotypeActions'
import {Phenotype} from '..'

type PhenotypeMenuEntryProps = {
  node: NodeModel<MenuData>
  readonly?: boolean
}

const PhenotypeMenuEntry: React.FC<PhenotypeMenuEntryProps> = ({node, readonly = false}) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [renaming, setRenaming] = useState(false)

  const {menuItems, handleMenuClick, updatePhenotype} = usePhenotypeActions(
    node?.data?.node as Phenotype,
    node?.data?.visibility != 'Private',
    {
      onRename: () => setRenaming(true),
    },
  )

  const handleUpdatePhenotype = async (newName: string) => {
    await updatePhenotype({name: newName})
    setRenaming(false)
  }
  return (
    <MenuEntry
      value={node.text}
      menuItems={menuItems}
      onMenuClick={handleMenuClick}
      onClick={() => {
        navigate(`/phenotype/${node.data!.id}`)
      }}
      onAddClick={undefined}
      editing={renaming}
      onRename={readonly ? undefined : handleUpdatePhenotype}
      onCancelRename={() => setRenaming(false)}
    />
  )
}

export default PhenotypeMenuEntry
