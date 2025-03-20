import {useApolloClient, useQuery} from '@apollo/client'
import {styled} from '@linaria/react'
import {groupBy, isEqual, keys, last} from 'lodash'
import React, {useEffect, useMemo, useState} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import CodeListSummary from './CodeListSummary'
import {FETCH_CODE_LIST, FETCH_COLLECTION, FETCH_PHENOTYPE} from './graphql'
import {Title} from './scratch'
import {RootState} from './store'
import {closeCodelist} from './store/workspace'
import InlineHelp from './InlineHelp'
import {Codelist} from '..'
import {openCodelistIdSelector} from './store/selectors'

type RightPanelProps = {}

const RightPanel: React.FC<RightPanelProps> = ({}) => {
  const openCodelists = useSelector((state: RootState) => openCodelistIdSelector(state))
  // const openCodelistsKey = openCodelists.map((c) => c.id)
  const [codelists, setMedicalConcepts] = useState<Codelist[]>([])
  const client = useApolloClient()
  useEffect(() => {
    // setMedicalConcepts([])
    ;(async () => {
      const results = await Promise.all(
        openCodelists.map(async (entry) => {
          const res = await client.query({
            query: FETCH_CODE_LIST,
            variables: {codelistID: entry},
            fetchPolicy: 'cache-first',
          })
          // codeCache.updateByMedicalConcept(res.data.codelist)
          return res.data.codelist
        }),
      )

      setMedicalConcepts(results)
    })()
  }, [openCodelists])

  const byCollection = useMemo(() => {
    // return []
    return groupBy(
      codelists.filter((c) => openCodelists.includes(c.id)),
      (codeList) => {
        const containerSpec = last(codeList.containerHierarchy)
        return `${containerSpec!.id}:${containerSpec!.type}`
      },
    )
  }, [codelists, openCodelists])

  return (
    <Root data-tour-target="__ontology-active-codelists__">
      <Title style={{position: 'sticky', top: 0}}>
        ACTIVE CODELISTS
        <InlineHelp
          content={
            'Codelists you have activated appear in this area as a card.' +
            ' Information about the codelist, such as the number of codes' +
            ' in each Ontology, a text description, and an automatically' +
            ' generated version history, are displayed on the card.'
          }
        />
      </Title>
      {openCodelists.length > 0 && (
        <>
          {keys(byCollection).map((collectionID) => (
            <ActiveConceptGroup collectionID={collectionID} codeLists={byCollection[collectionID]} key={collectionID} />
          ))}
        </>
      )}
      {openCodelists.length == 0 && (
        <>
          <p></p>
          <p>
            <b>No codelists are active!</b>
          </p>
          <ul style={{paddingInline: '20px'}}>
            <li>
              <b>To activate a codelist</b>, click on the title of a codelist in the sidebar.
            </li>
            <li>
              <b>To activate multiple codelists</b>,
            </li>
            <ol>
              <li>Activate a single codelist in the sidebar</li>
              <li>
                Right click on the second Medical Codelist in the sidebar and select ‘Compare Codelist’ from the context
                menu.
                <br />
                After entering comparison mode, a single click on additional codelists will add them to the Active
                Codelists Tray.
              </li>
            </ol>
            <li>
              <b>To deactivate a Codelist</b>, click on the ‘x’ button at the top right of the Active Codelist Card.
            </li>
          </ul>
        </>
      )}
    </Root>
  )
}

type ActiveConceptGroupProps = {
  collectionID: string
  codeLists: RootState['workspace']['openCodelists']
}

const ActiveConceptGroup: React.FC<ActiveConceptGroupProps> = ({collectionID, codeLists}) => {
  const dispatch = useDispatch()
  const indicators = useSelector((state: RootState) => state.workspace.indicators)
  const [ID, type] = collectionID.split(':')

  const {loading, data, error} = useQuery(type == 'Collection' ? FETCH_COLLECTION : FETCH_PHENOTYPE, {
    variables: {
      ...(type == 'Collection' && {collectionID: ID}),
      ...(type == 'Phenotype' && {phenotypeID: ID}),
    },
  })

  if (loading) return <p>Loading</p>
  const name = type == 'Collection' ? data.collection.name : data.phenotype.name

  return (
    <>
      <p>
        [{type[0].toUpperCase()}] {name}
      </p>
      {codeLists.map(({id: codelistId}) => {
        // const MyMedicalConceptSummary = withMedicalConcept(MedicalConceptSummary, collectionID, codelistId)
        return (
          <CodeListSummary
            indicator={indicators[codelistId]}
            collectionID={collectionID}
            codelistID={codelistId}
            onClose={() => {
              dispatch(
                closeCodelist({
                  codelistId,
                }),
              )
            }}
            key={codelistId}
          />
        )
      })}
    </>
  )
}

export default RightPanel

const Root = styled.div`
  width: 325px;
  padding: 8px;
  /* height: 100vh; */
  overflow-y: auto;

  .ant-btn.ant-btn-sm {
    font-size: 12px;
  }
`

const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
`
