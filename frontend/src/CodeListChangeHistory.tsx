import React, {useMemo} from 'react'
import {useQuery} from '@apollo/client'
import {FETCH_CODE_LIST_CHANGE_SET} from './graphql'
import ChangeHistory, {Commit} from './components/ChangeHistory'

type CodeListChangeHistoryProps = {
  collectionID: string
  codelistID: string
}

const CodeListChangeHistory: React.FC<CodeListChangeHistoryProps> = ({collectionID, codelistID}) => {
  const {loading, data, error} = useQuery(FETCH_CODE_LIST_CHANGE_SET, {
    variables: {collectionID, codelistID},
  })

  const commits = useMemo(() => {
    if (loading) return []

    return Array.from(data.codelist.commits).reverse() as Commit[]
  }, [data])

  if (loading) return <p>Loading...</p>
  return <ChangeHistory history={commits} codelistID={codelistID} />
}

export default CodeListChangeHistory
