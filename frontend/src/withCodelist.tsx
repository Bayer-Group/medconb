import {useQuery} from '@apollo/client'
import React from 'react'
import {Codelist} from '..'
import {FETCH_CODE_LIST} from './graphql'

type CodeListVars = {
  collectionID: string
  codelistID: Codelist['id']
}

const withCodelist = <P extends CodeListVars>(Element: React.ComponentType<P>): React.FC<Omit<P, 'codelist'>> => {
  return (props: Omit<P, 'codelist'>) => {
    const {loading, data, error} = useQuery(FETCH_CODE_LIST, {
      variables: {collectionID: props.collectionID, codelistID: props.codelistID},
    })

    if (loading) return <p>Loading...</p>

    return <Element {...(props as P)} collectionID={props.collectionID} codelist={data.codelist} />
  }
}

export default withCodelist
