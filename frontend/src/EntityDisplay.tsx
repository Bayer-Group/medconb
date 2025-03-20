import {useQuery} from '@apollo/client'
import {FETCH_CODE_LIST, FETCH_COLLECTION, FETCH_PHENOTYPE} from './graphql'
import {Skeleton} from 'antd'

const PhenotypeDisplay: React.FC<{phenotypeID: string; onClick?: () => void}> = ({phenotypeID, onClick}) => {
  const {data} = useQuery(FETCH_PHENOTYPE, {
    variables: {
      phenotypeID,
    },
    fetchPolicy: 'cache-first',
  })

  if (!data) return <Skeleton />

  return onClick ? (
    <a
      onClick={(e) => {
        e.preventDefault()
        onClick()
      }}>
      {data.phenotype.name}
    </a>
  ) : (
    data.phenotype.name
  )
}

const CollectionDisplay: React.FC<{collectionID: string; onClick?: () => void}> = ({collectionID, onClick}) => {
  const {data} = useQuery(FETCH_COLLECTION, {
    variables: {
      collectionID,
    },
    fetchPolicy: 'cache-first',
  })

  if (!data) return <Skeleton />

  return onClick ? (
    <a
      onClick={(e) => {
        e.preventDefault()
        onClick()
      }}>
      {data.collection.name}
    </a>
  ) : (
    data.collection.name
  )
}

const CodelistDisplay: React.FC<{codelistID: string; onClick?: () => void}> = ({codelistID, onClick}) => {
  const {data} = useQuery(FETCH_CODE_LIST, {
    variables: {
      codelistID,
    },
    fetchPolicy: 'cache-first',
  })

  if (!data) return <Skeleton />

  return onClick ? (
    <a
      onClick={(e) => {
        e.preventDefault()
        onClick()
      }}>
      {data.codelist.name}
    </a>
  ) : (
    data.codelist.name
  )
}

export {PhenotypeDisplay, CollectionDisplay, CodelistDisplay}
