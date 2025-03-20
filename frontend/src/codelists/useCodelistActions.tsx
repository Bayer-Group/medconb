import {ItemType} from 'antd/es/menu/hooks/useItems'
import React, {useCallback, useMemo} from 'react'
import {Codelist, Collection, Phenotype} from '../..'
import {MenuInfo} from 'rc-menu/lib/interface'
import useExport from '../useExport'
import {useDispatch, useSelector} from 'react-redux'
import {RootState} from '../store'
import {App} from 'antd'
import {useLazyQuery, useMutation} from '@apollo/client'
import {
  CLONE_CODE_LIST,
  DELETE_CODE_LIST,
  FETCH_CODE_LIST,
  FETCH_COLLECTION,
  FETCH_PHENOTYPE,
  SELF,
  UPDATE_CODE_LIST,
} from '../graphql'
import {ReadMode, addCodelist} from '../store/workspace'
import {ExclamationCircleOutlined} from '@ant-design/icons'
import {useNavigate} from 'react-router-dom'
import {clearChangeSet} from '../store/changes'
import {last} from 'lodash'
import {openCodelistIdSelector} from '../store/selectors'

const useCodelistActions = (codelist: Codelist, isReadOnly: boolean, options?: {onRename?: () => void}) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const openMedicalConcepts = useSelector((state: RootState) => openCodelistIdSelector(state))
  const allowComparision = useSelector((state: RootState) => state.workspace.openCodelists.length > 0)
  const exporter = useExport()

  const {modal} = App.useApp()

  const [loadCodelist, {loading, error, data}] = useLazyQuery(FETCH_CODE_LIST)
  const [deleteMedicalConcept, {loading: dLoading, error: dError, data: dData}] = useMutation(DELETE_CODE_LIST, {
    refetchQueries: [{query: SELF}],
  })

  const [_updateCodelist] = useMutation(UPDATE_CODE_LIST, {
    refetchQueries: [{query: SELF}],
  })

  const updateCodelist = useCallback(
    async (updates: Partial<Codelist>) => {
      await _updateCodelist({
        variables: {
          codelistID: codelist.id,
          ...updates,
        },
        update(cache, {data}) {
          // update phenotype or collection that this codelist is a part of
          // https://www.apollographql.com/docs/react/data/mutations/#the-update-function
          const resCodelist = data.updateCodelist
          const immediateContainer = last(resCodelist.containerHierarchy)
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
                        if (c.id !== resCodelist.id) {
                          return c
                        } else {
                          return {...c, ...resCodelist} as Codelist
                        }
                      }),
                    },
                  },
                })
              }
            }
            if (immediateContainer.type === 'Phenotype') {
              const phenotypeIncache: {phenotype: Phenotype} | null = cache.readQuery({
                query: FETCH_PHENOTYPE,
                variables: {phenotypeID: immediateContainer.id},
              })
              if (phenotypeIncache) {
                cache.writeQuery({
                  query: FETCH_PHENOTYPE,
                  variables: {phenotypeID: immediateContainer.id},
                  data: {
                    phenotype: {
                      ...phenotypeIncache.phenotype,
                      codelists: phenotypeIncache.phenotype.codelists.map((c) => {
                        if (c.id !== codelist.id) {
                          return c
                        } else {
                          return {...c, ...resCodelist} as Codelist
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
    [codelist],
  )

  const [cloneMedicalConcept, {data: clData, loading: cloningConcept, error: cloneErr}] = useMutation(CLONE_CODE_LIST, {
    refetchQueries: [{query: SELF}],
  })

  const handleDuplicateConcept = useCallback(async () => {
    await cloneMedicalConcept({
      variables: {codelistID: codelist.id},
      update(cache, response) {
        // update phenotype codelist if this belongs to phenotype
        // if does not belong to a phenotype, SELF refetch will update the sidebar automatically
        // This is basically for the update of the codelist table in phenotype detail
        // todo: sorting?
        const resCodelist = response.data.cloneCodelist
        const immediateContainer = last(resCodelist.containerHierarchy)
        if (immediateContainer && immediateContainer.type === 'Phenotype') {
          const phenotypeIncache: {phenotype: Phenotype} | null = cache.readQuery({
            query: FETCH_PHENOTYPE,
            variables: {phenotypeID: immediateContainer.id},
          })
          if (phenotypeIncache) {
            cache.writeQuery({
              query: FETCH_PHENOTYPE,
              variables: {phenotypeID: immediateContainer.id},
              data: {
                phenotype: {
                  ...phenotypeIncache.phenotype,
                  codelists: [...phenotypeIncache.phenotype.codelists, resCodelist],
                },
              },
            })
          }
        }
      },
    })
  }, [codelist])

  const menuItems: ItemType[] = useMemo(() => {
    const items: ItemType[] = []

    if (!isReadOnly) {
      if (options?.onRename) {
        items.push({label: 'Rename Codelist', key: 'rename'})
      }

      items.push({label: 'Duplicate Codelist', key: 'duplicate'})
      items.push({label: 'Delete Codelist', key: 'delete'})
      items.push({type: 'divider'})
    }

    items.push({label: 'Export Codelist', key: 'export'})

    if (allowComparision) {
      items.unshift({label: 'Compare Codelist', key: 'compare'})
    }

    return items
  }, [allowComparision, isReadOnly])

  const handleDelete = async () => {
    if (openMedicalConcepts.includes(codelist.id)) {
      await modal.error({
        title: 'Codelist still open',
        content: `The codelist you are trying to delete is still open. Please close the codelist and try again`,
      })

      return
    }
    await modal.confirm({
      title: 'Confirm',
      icon: <ExclamationCircleOutlined />,
      content: [
        <React.Fragment key="0">Are you sure you want to delete the codelist </React.Fragment>,
        <strong key="1">{codelist.name}</strong>,
        // ` and all it's ${node.data?.numItems} descendants permanently?`,
        <br key="2" />,
        <React.Fragment key="3">This cannot be undone!</React.Fragment>,
      ],
      okText: 'Delete',
      cancelText: 'Cancel',
      onOk: async () => {
        // delete any pending syncs
        dispatch(clearChangeSet(codelist.id))
        await deleteMedicalConcept({
          variables: {codelistID: codelist.id},
          update(cache) {
            const normalizedId = cache.identify({id: codelist.id, __typename: 'Codelist'})
            cache.evict({id: normalizedId})
            cache.gc()

            // update phenotype codelist if this belongs to phenotype
            // if does not belong to a phenotype, SELF refetch will update the sidebar automatically
            // This is basically for the update of the codelist table in phenotype detail
            // todo: sorting?
            const immediateContainer = last(codelist.containerHierarchy)
            if (immediateContainer && immediateContainer.type === 'Phenotype') {
              const phenotypeInCache: {phenotype: Phenotype} | null = cache.readQuery({
                query: FETCH_PHENOTYPE,
                variables: {phenotypeID: immediateContainer.id},
              })
              if (phenotypeInCache) {
                cache.writeQuery({
                  query: FETCH_PHENOTYPE,
                  variables: {phenotypeID: immediateContainer.id},
                  data: {
                    phenotype: {
                      ...phenotypeInCache.phenotype,
                      codelists: phenotypeInCache.phenotype.codelists.filter((c) => codelist.id != c.id),
                    },
                  },
                })
              }
            }
          },
        })
      },
    })
  }

  const handleCompare = useCallback(async () => {
    if (openMedicalConcepts.includes(codelist.id)) {
      navigate('/codeset')
      return
    }
    if (openMedicalConcepts.length === 5) {
      await modal.error({
        title: 'More than 5 codelists',
        content: `You can only compare up to five codelists at once! Please remove some codelists from the Active Codelists area to the right by clicking the 'x' on that codelist.`,
      })
      return
    }

    // const res = await loadCodelist({
    //   variables: {codelistID: codelist.id},
    // })

    dispatch(
      addCodelist({
        // collection: node.data?.collectionID!,
        codelistId: codelist.id,
        path: [], // todo: codelist.path ?? [],
        mode: isReadOnly ? ReadMode.READONLY : ReadMode.READWRITE,
      }),
    )
    navigate('/codeset')
  }, [data, openMedicalConcepts])

  const handleExport = async () => {
    await exporter.export(codelist.name, [codelist.id])
  }

  const handleMenuClick = useCallback(
    (info: MenuInfo) => {
      switch (info.key) {
        case 'rename':
          options?.onRename?.()
          break
        case 'compare':
          handleCompare()
          break
        case 'duplicate':
          handleDuplicateConcept()
          break
        case 'delete':
          handleDelete()
          break
        case 'export':
          handleExport()
          break
        case 'share':
        case 'details':
        case 'rename_concept':
        case 'duplicate_concept':
        case 'delete_concept':
          // onClickDetails()
          break
      }
    },
    [codelist, data, openMedicalConcepts, handleCompare],
  )

  return {menuItems, handleMenuClick, updateCodelist}
}

export default useCodelistActions
