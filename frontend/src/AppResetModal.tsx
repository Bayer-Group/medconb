import {CaretDownFilled, CaretRightFilled, MinusCircleFilled, PlusCircleFilled} from '@ant-design/icons'
import {useQuery} from '@apollo/client'
import {Button, Flex, Skeleton, Space, Typography} from 'antd'
import {keys, size, xor} from 'lodash'
import {useState} from 'react'
import {useSelector} from 'react-redux'
import {Codelist} from '..'
import {FETCH_CODE_LIST} from './graphql'
import {ChangeSetDisplay} from './SaveCodelist'
import {RootState} from './store'
import {ChangeSet} from './store/changes'

const {Text} = Typography

type AppResetModalProps = {}

const AppResetModal: React.FC<AppResetModalProps> = () => {
  const changeSet = useSelector((state: RootState) => state.changes.changeSet)
  const [changesExpanded, setChangesExpanded] = useState(false)
  return (
    <Flex vertical>
      {size(changeSet) === 0 && (
        <Typography.Text>
          There are no unsaved changes. You will be logged out, all open Codelists, Phenotypes, etc. will be closed. The
          UI will be reset and all data will be re-loaded from the server.
        </Typography.Text>
      )}
      {size(changeSet) > 0 && (
        <Flex vertical gap={8}>
          <Typography.Text>
            {`There are unsaved changes which will be lost. There are ${size(
              changeSet,
            )} codelists that are not saved yet. Normally they should be saved within the next 10 seconds if you have an internet connection.
            When you proceed anyway, these changes will be lost. You will be logged out, all open Codelists, Phenotypes, etc. will be closed. The UI will be reset and all data will be re-loaded from the server.`}
          </Typography.Text>

          <Button
            size="small"
            type="text"
            style={{
              opacity: changesExpanded ? 1 : 0.5,
              fontSize: 12,
              fontWeight: 'normal',
              justifyContent: 'left',
            }}
            icon={changesExpanded ? <CaretDownFilled /> : <CaretRightFilled />}
            onClick={() => setChangesExpanded(!changesExpanded)}>
            Show me which codelists have unsaved changes
          </Button>

          {changesExpanded && (
            <Flex vertical gap={16} style={{padding: 8}}>
              {keys(changeSet).map((codelistId) => (
                <div key={codelistId}>
                  <CodelistChangeSet codelistId={codelistId} changeSet={changeSet[codelistId]} />
                </div>
              ))}
            </Flex>
          )}
        </Flex>
      )}
    </Flex>
  )
}

type CodelistChangeSetProps = {
  codelistId: string
  changeSet: ChangeSet
}
const CodelistChangeSet: React.FC<CodelistChangeSetProps> = ({codelistId, changeSet}) => {
  const [codesExpanded, setCodesExpanded] = useState<string[]>([])
  const {data} = useQuery<Codelist>(FETCH_CODE_LIST, {
    variables: {
      codelistID: codelistId,
    },
    fetchPolicy: 'cache-first',
  })

  return (
    <>
      {!data && <Skeleton />}
      {data && (
        <>
          {data.codelist.name} ( Part of {data.codelist.containerHierarchy.map((c) => c.name).join('.')})
        </>
      )}
      {keys(changeSet).map((ontology) => (
        <div key={ontology}>
          <Space align="center" style={{fontSize: 10}}>
            <Text>{ontology}</Text>
            {changeSet[ontology].added.length > 0 && (
              <>
                <PlusCircleFilled style={{color: '#00BCFF'}} />
                {changeSet[ontology].added.length}
              </>
            )}

            {changeSet[ontology].removed.length > 0 && (
              <>
                <MinusCircleFilled />
                {changeSet[ontology].removed.length}
              </>
            )}

            <Button
              size="small"
              type="text"
              style={{
                opacity: codesExpanded.includes(ontology) ? 1 : 0.5,
                fontSize: 12,
                fontWeight: 'normal',
              }}
              icon={codesExpanded.includes(ontology) ? <CaretDownFilled /> : <CaretRightFilled />}
              onClick={() => setCodesExpanded(xor(codesExpanded, [ontology]))}>
              Show codes
            </Button>
          </Space>
          {codesExpanded.includes(ontology) && (
            <div style={{marginBottom: 6}}>
              <ChangeSetDisplay key={ontology} changeSet={changeSet[ontology]} />
            </div>
          )}
        </div>
      ))}
    </>
  )
}

export default AppResetModal
