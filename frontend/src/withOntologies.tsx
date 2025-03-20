import {useApolloClient, useQuery} from '@apollo/client'
import React from 'react'
import {useDispatch} from 'react-redux'
import { ONTOLOGIES} from './graphql'
import {setOntologies} from './store/ui'

const withOntologies = <P extends object>(Element: React.ComponentType<P>): React.FC<Omit<P, 'ontologies'>> => {
  return (props: Omit<P, 'ontologies'>) => {
    const dispatch = useDispatch()
    const client = useApolloClient()
    // const needOntologies = useSelector((state: RootState) => size(state.ui.ontologies) == 0)

    const {loading, data, error} = useQuery(ONTOLOGIES, {
      onCompleted: (d) => {
        // d.ontologies.forEach((ontology: Ontology) => {
        //   client.writeQuery({
        //     query: FETCH_ONTOLOGY,
        //     data: {
        //       ontology,
        //     },
        //     variables: {
        //       name: ontology.name,
        //     },
        //     overwrite: true,
        //   })
        // })

        dispatch(
          setOntologies({
            ontologies: d.ontologies,
          }),
        )
      },
    })

    if (!data) return <p>Loading...</p>

    return <Element {...(props as P)} />
  }
}

export default withOntologies
