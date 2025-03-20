import React, {useEffect} from 'react'
import {useSelector} from 'react-redux'
import {RootState} from './store'
import CollectionDetail from './collections/CollectionDetail'
import PhenotypeDetail from './phenotypes/PhenotypeDetail'
import {useNavigate} from 'react-router-dom'
import {isEmpty} from 'lodash'
import {ReadMode} from './store/workspace'

const OpenObject = () => {
  const openObject = useSelector((state: RootState) => state.workspace.openObject)
  const navigate = useNavigate()
  const searchParams = useSelector((state: RootState) => state.ui.searchParams)

  useEffect(() => {
    if (!openObject) {
      let url = '/'
      if (!isEmpty(searchParams)) {
        const params = new URLSearchParams()
        for (const key in searchParams) {
          params.append(key, searchParams[key])
        }
        url = `${url}?${params.toString()}`
      }
      navigate(url)
    }
  }, [openObject])

  if (openObject && ['phenotype_collection', 'codelist_collection'].includes(openObject?.type ?? ''))
    return <CollectionDetail readOnly={openObject.mode == ReadMode.READONLY} id={openObject.id} />
  if (openObject?.type === 'phenotype')
    return <PhenotypeDetail readOnly={openObject.mode == ReadMode.READONLY} id={openObject.id} />

  return null
}

export default OpenObject
