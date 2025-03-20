import {ItemType} from 'antd/es/menu/hooks/useItems'
import {Codelist, Collection} from '../..'
import {useCallback, useMemo, useState} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import useExport from '../useExport'
import {RootState} from '../store'
import {MenuInfo} from 'rc-menu/lib/interface'
import {last} from 'lodash'
import {ExclamationCircleOutlined} from '@ant-design/icons'
import {App} from 'antd'
import {CREATE_CODE_LIST, CREATE_PHENOTYPE, DELETE_COLLECTION, FETCH_COLLECTION, SELF} from '../graphql'
import {useMutation} from '@apollo/client'
import CodelistImporter from '../import/CodelistImporter'
import ShareCollectionDialog from '../ShareCollectionDialog'

const useCollectionActions = (collection: Collection, isReadOnly: boolean, options?: {onRename?: () => void}) => {
  const dispatch = useDispatch()
  const exporter = useExport()
  const [shareOpen, setShareOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const activeCollections: any[] = []
  const {modal} = App.useApp()

  const [deleteCollection, {loading: dLoading, error: dError, data: dData}] = useMutation(DELETE_COLLECTION, {
    refetchQueries: [{query: SELF}],
  })

  const [createPhenotype] = useMutation(CREATE_PHENOTYPE, {
    refetchQueries: [
      SELF,
      {
        query: FETCH_COLLECTION,
        variables: {
          collectionID: collection?.id,
        },
      },
    ],
  })

  const [createCodeList] = useMutation(CREATE_CODE_LIST, {
    refetchQueries: [
      {query: SELF},
      {
        query: FETCH_COLLECTION,
        variables: {
          collectionID: collection?.id,
        },
      },
    ],
  })

  const collectionMenu: ItemType[] = useMemo(() => {
    const items: ItemType[] = []

    if (!collection) {
      return items
    }

    if (!isReadOnly) {
      if (options?.onRename) {
        items.push({label: 'Rename Collection', key: 'rename'})
      }

      items.push({label: 'Duplicate Collection', key: 'duplicate', disabled: true})
      items.push({type: 'divider'})
      items.push({label: 'Delete Collection', key: 'delete'})
      items.push({type: 'divider'})
      items.push({label: 'Manage Access', key: 'share'})
    }

    items.push({label: 'Details of Collection', key: 'details', disabled: true})
    items.push({type: 'divider'})

    if (!isReadOnly) {
      items.push({label: 'Import', key: 'import', disabled: collection.itemType !== 'Codelist'})
    }

    items.push({label: 'Export Collection', key: 'export', disabled: collection.itemType !== 'Codelist'})

    return items
  }, [isReadOnly, collection])

  const handleExport = async () => {
    const mcsToExport: string[] = []
    if (collection.itemType !== 'Codelist') {
      return
    }

    const processChildren = (node: Codelist) => {
      mcsToExport.push(node.id)
    }

    const children = collection.items ?? []
    if (children.length > 0) {
      ;(children as Codelist[]).forEach(processChildren)
    }

    exporter.export(collection.name, mcsToExport)
  }

  const handleDelete = useCallback(() => {
    if (activeCollections.includes(collection.id ?? '')) {
      modal.error({
        title: 'Codelist open',
        content: `One or more codelists in this collection are open. Please close them first.`,
      })
      return
    }

    const countMC = (children: any[]) => {
      let value = children.length

      children.forEach((el) => {
        if ((el.children ?? []).length > 0) {
          value = value + countMC(el.children)
        }
      })
      return value
    }
    const numItems = countMC(collection.items)
    modal.confirm({
      title: 'Confirm',
      icon: <ExclamationCircleOutlined />,
      content: [
        `Are you sure you want to delete the collection `,
        <strong>{collection.name}</strong>,
        ` with all it's ${(numItems ?? 0) > 0 ? numItems : ''} ${
          collection.itemType == 'Codelist' ? 'codelist(s)' : 'phenotype(s)'
        } permanently?`,
        <br />,
        'This cannot be undone!',
      ],
      okText: 'Delete',
      cancelText: 'Cancel',
      onOk: () => {
        deleteCollection({variables: {collectionID: collection.id}})
      },
    })
  }, [activeCollections, collection])

  const handleMenuClick = useCallback(
    (info: MenuInfo) => {
      switch (info.key) {
        case 'rename':
          options?.onRename?.()
          return
        case 'import':
          setImporting(true)
          return
        case 'export':
          handleExport()
          return
        case 'duplicate':
          // onDuplicate()
          break
        case 'delete':
          handleDelete()
          break
        case 'share':
          setShareOpen(true)
          break
        case 'details':
          // onClickDetails()
          break
      }
    },
    [collection, handleDelete, handleExport],
  )

  const newItemName = useCallback(
    (base = 'Untitled Codelist') => {
      let name = base
      const usedNames = collection.items.map((c: any) => c.name) // unique at this level

      let nameAllowed = !usedNames.includes(name)
      let i = 0

      while (!nameAllowed) {
        name = `${base} ${++i}`
        nameAllowed = !usedNames.includes(name)
      }

      return name
    },
    [collection],
  )

  const addPhenotype = async () => {
    await createPhenotype({
      awaitRefetchQueries: true,
      variables: {
        name: newItemName('Untitled Phenotype'),
        position: {
          containerID: collection.id,
        },
      },
    })
  }

  const addCodelist = async () => {
    await createCodeList({
      awaitRefetchQueries: true,
      variables: {
        name: newItemName(),
        position: {
          containerID: collection.id,
        },
      },
    })
  }

  const actionsDom = useMemo(() => {
    return (
      <>
        {importing && (
          <CodelistImporter
            collection={{id: collection.id, name: collection.name}}
            onCancel={() => setImporting(false)}
            onClose={() => setImporting(false)}
          />
        )}
        {shareOpen && (
          <ShareCollectionDialog
            collectionID={collection.id}
            onClose={() => setShareOpen(false)}
            onCancel={() => setShareOpen(false)}
          />
        )}
      </>
    )
  }, [importing, shareOpen])

  return {collectionMenu, handleMenuClick, addPhenotype, addCodelist, actionsDom}
}

export default useCollectionActions
