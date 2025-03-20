import {useLazyQuery, useMutation} from '@apollo/client'
import {NodeModel} from '@minoru/react-dnd-treeview'
import {Modal} from 'antd'
import {useCallback, useEffect, useState} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {Codelist} from '..'
import MenuEntry from './components/MenuEntry'
import {MenuData} from './components/MenuTree'
import {CREATE_CODE_LIST, FETCH_CODE_LIST, SELF} from './graphql'
import {RootState} from './store'
import {addOpenMenu, updateOntologiesByConcept} from './store/ui'
import {addCodelist, ReadMode, openCodelist, startLoadingConcept} from './store/workspace'
import useCodelistActions from './codelists/useCodelistActions'
import {useNavigate} from 'react-router-dom'
import {createSelector} from '@reduxjs/toolkit'
import {openCodelistIdSelector} from './store/selectors'

type ConceptMenuEntryProps = {
  node: NodeModel<MenuData>
  readonly?: boolean
  sectionKey: string
}

const ConceptMenuEntry: React.FC<ConceptMenuEntryProps> = ({node, sectionKey, readonly = false}) => {
  const dispatch = useDispatch()
  const isComparisionMode = useSelector((state: RootState) => state.workspace.isComparisionMode)

  const openMedicalConcepts = useSelector((state: RootState) => openCodelistIdSelector(state))
  const indicators = useSelector((state: RootState) => state.workspace.indicators)
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [renaming, setRenaming] = useState(false)

  const [createMedicalConcept, {data: conData, loading: creatingConcept, error: conErr}] = useMutation(
    CREATE_CODE_LIST,
    {
      refetchQueries: [{query: SELF}],
    },
  )

  const [loadCodelist, {loading, error, data}] = useLazyQuery(FETCH_CODE_LIST)

  const handleCompare = useCallback(async () => {
    if (openMedicalConcepts.includes(node.data?.id!)) {
      navigate('/codeset')
      return
    }
    if (openMedicalConcepts.length === 5) {
      Modal.error({
        title: 'More than 5 codelists',
        content: `You can only compare up to five codelists at once! Please remove some codelists from the Active codelists area to the right by clicking the 'x' on that codelist.`,
      })
      return
    }

    // setBusy(true)
    // const res = await loadCodelist({
    //   variables: {codelistID: node.data?.id},
    // })

    dispatch(
      addCodelist({
        // collection: node.data?.collectionID!,
        codelistId: node.data?.id!,
        path: node.data?.path ?? [],
        mode: readonly ? ReadMode.READONLY : ReadMode.READWRITE,
      }),
    )
    // setBusy(false)
    navigate('/codeset')
  }, [data, openMedicalConcepts])

  const handleConceptClick = useCallback(async () => {
    if (openMedicalConcepts.includes(node.data?.id!)) {
      navigate('/codeset')
      return
    }

    if (isComparisionMode) {
      return handleCompare()
    }

    // dispatch(startLoadingConcept(node.data!.id))
    // setBusy(true)
    // const res = await loadCodelist({
    //   variables: {collectionID: node.data?.collectionID, codelistID: node.data!.id},
    // })

    dispatch(
      openCodelist({
        // collection: node.data?.collectionID!,
        codelistId: node.data?.id!,
        path: node.data?.path ?? [],
        mode: readonly ? ReadMode.READONLY : ReadMode.READWRITE,
      }),
    )
    // dispatch(updateOntologiesByConcept(res.data.codelist))
    navigate('/codeset')
    setBusy(false)
  }, [data, openMedicalConcepts, handleCompare])

  useEffect(() => {
    if (conData) {
      dispatch(addOpenMenu({section: sectionKey, item: node.data!.id}))
    }
  }, [conData])

  const {menuItems, handleMenuClick, updateCodelist} = useCodelistActions(node.data?.node as Codelist, readonly, {
    onRename: () => setRenaming(true),
  })

  const handleUpdate = async (newName: string) => {
    await updateCodelist({name: newName})
    setRenaming(false)
  }

  return (
    <MenuEntry
      value={node.text}
      busy={busy}
      menuItems={menuItems}
      onMenuClick={handleMenuClick}
      prefix={openMedicalConcepts.includes(node.data?.id!) ? indicators[node.data?.id!].color : undefined}
      editing={renaming}
      onRename={handleUpdate}
      onCancelRename={() => setRenaming(false)}
      onClick={handleConceptClick}
    />
  )
}

export default ConceptMenuEntry
