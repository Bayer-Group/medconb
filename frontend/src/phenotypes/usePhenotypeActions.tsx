import {useApolloClient, useMutation} from '@apollo/client'
import {useCallback, useMemo} from 'react'
import {
  CLONE_PHENOTYPE,
  CREATE_CODE_LIST,
  DELETE_PHENOTYPE,
  FETCH_COLLECTION,
  FETCH_PHENOTYPE,
  SELF,
  UPDATE_PHENOTYPE,
} from '../graphql'
import {useSelector} from 'react-redux'
import {RootState} from '../store'
import {Collection, Phenotype} from '../..'
import {ItemType} from 'antd/es/menu/hooks/useItems'
import {App} from 'antd'
import {MenuInfo} from 'rc-menu/lib/interface'
import {ExclamationCircleOutlined} from '@ant-design/icons'
import {last} from 'lodash'

const usePhenotypeActions = (phenotype: Phenotype, isReadOnly: boolean, options?: {onRename?: () => void}) => {
  const {modal} = App.useApp()
  const client = useApolloClient()
  const openObjects = useSelector((state: RootState) => state.workspace.openObjects)
  const [clonePhenotype, {data: clData, loading: cloningConcept, error: cloneErr}] = useMutation(CLONE_PHENOTYPE, {
    refetchQueries: [{query: SELF}],
  })
  const [deletePhenotype, {loading: dLoading, error: dError, data: dData}] = useMutation(DELETE_PHENOTYPE, {
    refetchQueries: [{query: SELF}],
  })

  const [_updatePhenotype] = useMutation(UPDATE_PHENOTYPE)

  const [createCodeList] = useMutation(CREATE_CODE_LIST, {
    refetchQueries: [
      {query: SELF},
      {
        query: FETCH_PHENOTYPE,
        variables: {
          phenotypeID: phenotype?.id,
        },
      },
    ],
  })

  const updatePhenotype = useCallback(
    async (updates: Partial<Phenotype>) => {
      await _updatePhenotype({
        variables: {
          phenotypeID: phenotype?.id,
          ...updates,
        },
        update(cache, {data}) {
          // update phenotype or collection that this codelist is a part of
          // https://www.apollographql.com/docs/react/data/mutations/#the-update-function
          const resPhenotype: Partial<Phenotype> = data.updatePhenotype
          const immediateContainer = last(resPhenotype.containerHierarchy)
          if (immediateContainer) {
            if (immediateContainer.type === 'Collection') {
              const collectionInCache: {collection: Collection} | null = cache.readQuery({
                query: FETCH_COLLECTION,
                variables: {collectionID: immediateContainer.id},
              })

              if (collectionInCache) {
                cache.writeQuery({
                  query: FETCH_COLLECTION,
                  variables: {collectionID: immediateContainer.id},
                  data: {
                    collection: {
                      ...collectionInCache.collection,
                      items: collectionInCache.collection.items.map((c) => {
                        if (c.id !== resPhenotype.id) {
                          return c
                        } else {
                          return {...c, ...resPhenotype} as Phenotype
                        }
                      }),
                    },
                  },
                })
              }
            }
          }
        },
      })
    },
    [phenotype],
  )

  const handleDuplicate = useCallback(async () => {
    await clonePhenotype({
      variables: {phenotypeID: phenotype.id},
    })
  }, [phenotype])

  const handleDelete = useCallback(async () => {
    if (openObjects.map((o) => o.id).includes(phenotype.id)) {
      await modal.error({
        title: 'Phenotype still open',
        content: `The phenotype you are trying to delete is still open. Please close the phenotype and try again`,
      })

      return
    }

    let numItems = 0

    if (!phenotype.codelists) {
      const _phenotype = await client.query({
        query: FETCH_PHENOTYPE,
        variables: {
          phenotypeID: phenotype.id,
        },
        fetchPolicy: 'cache-first',
      })

      numItems = _phenotype.data.phenotype.codelists.length
    }

    await modal.confirm({
      title: 'Confirm',
      icon: <ExclamationCircleOutlined />,
      content: [
        `Are you sure you want to delete the phenotype `,
        <strong>{phenotype.name}</strong>,
        ` and all it's ${numItems > 0 ? numItems : ''} descendants permanently?`,
        <br />,
        'This cannot be undone!',
      ],
      okText: 'Delete',
      cancelText: 'Cancel',
      onOk: async () => {
        await deletePhenotype({variables: {phenotypeID: phenotype.id}})
      },
    })
  }, [phenotype, openObjects])

  const handleMenuClick = useCallback(
    (info: MenuInfo) => {
      switch (info.key) {
        case 'rename':
          options?.onRename?.()
          break
        case 'duplicate':
          handleDuplicate()
          break
        case 'delete':
          handleDelete()
          break
        // case 'export':
        //   handleExport()
        //   break
        case 'share':
        case 'details':
          break
      }
    },
    [phenotype, handleDelete, handleDuplicate],
  )

  const menuItems: ItemType[] = useMemo(() => {
    const items: ItemType[] = []

    if (!isReadOnly) {
      if (options?.onRename) {
        items.push({label: 'Rename Phenotype', key: 'rename'})
      }
      items.push({label: 'Duplicate Phenotype', key: 'duplicate', disabled: true})
      items.push({label: 'Delete Phenotype', key: 'delete'})
      items.push({type: 'divider'})
    }

    items.push({label: 'Export Phenotype', key: 'export', disabled: true})

    return items
  }, [isReadOnly])

  const newItemName = useCallback(
    (base = 'Untitled Codelist') => {
      let name = base
      const usedNames = phenotype.codelists.map((c: any) => c.name) // unique at this level

      let nameAllowed = !usedNames.includes(name)
      let i = 0

      while (!nameAllowed) {
        name = `${base} ${++i}`
        nameAllowed = !usedNames.includes(name)
      }

      return name
    },
    [phenotype],
  )

  const addCodelist = async () => {
    await createCodeList({
      awaitRefetchQueries: true,
      variables: {
        name: newItemName(),
        position: {
          containerID: phenotype.id,
        },
      },
    })
  }

  return {menuItems, handleMenuClick, addCodelist, updatePhenotype}
}

export default usePhenotypeActions
