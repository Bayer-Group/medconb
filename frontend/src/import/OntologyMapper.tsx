import {styled} from '@linaria/react'
import {Button, Select, Space, Typography} from 'antd'
import {compact, keys, size, values} from 'lodash'
import React, {useState} from 'react'

const {Text} = Typography
const {Option} = Select

export type OntologyMap = {[ontology: string]: string}

type OntologyMapperProps = {
  validOntologies: string[]
  ontologies: string[]
  value?: OntologyMap
  onProceed: (ontologyMap: OntologyMap) => void
  onBack?: () => void
}

const OntologyMapper: React.FC<OntologyMapperProps> = ({
  ontologies,
  validOntologies,
  onProceed,
  onBack,
  value = {},
}) => {
  const [working, setWorking] = useState(false)
  const [internalValue, setValue] = useState(value ?? {})

  const handleProceed = async () => {
    setWorking(true)
    await onProceed(internalValue)
    setWorking(false)
  }

  return (
    <>
      <Mapper numRows={ontologies.length}>
        {ontologies.map((o) => (
          <div key={o}>{o}</div>
        ))}
        {ontologies.map((o) => (
          <Select
            size="small"
            key={o}
            defaultValue={!!value && value[o]}
            style={{width: 300}}
            onChange={(v) => {
              setValue({...internalValue, [o]: v})
            }}>
            {validOntologies.map((o, i) => (
              <Option key={o} value={o}>
                {o}
              </Option>
            ))}
            <Option key={'skip'} value={'skip'}>
              -- do not import --
            </Option>
          </Select>
        ))}
      </Mapper>
      <Space>
        {onBack && (
          <Button size="small" onClick={onBack}>
            Back
          </Button>
        )}
        <Button
          disabled={compact(values(internalValue)).length !== ontologies.length || working}
          type="primary"
          loading={working}
          size="small"
          onClick={handleProceed}>
          Proceed
        </Button>
      </Space>
    </>
  )
}

export default OntologyMapper

type ColumnMapperSummaryProps = {
  value: OntologyMap
}

export const OntologyMapperSummary: React.FC<ColumnMapperSummaryProps> = ({value}) => {
  return (
    <Mapper numRows={size(value)}>
      {keys(value).map((o) => (
        <div key={o}>{o}</div>
      ))}
      {values(value).map((o) => (o === 'skip' ? 'Skipped' : <Text key={o}>{o}</Text>))}
    </Mapper>
  )
}

const Mapper = styled.div<{numRows: number}>`
  display: grid;
  grid-template-columns: 200px 1fr;
  grid-template-rows: ${(props) => `repeat(${props.numRows}, 2rem)`};
  grid-auto-flow: column;
  grid-column-gap: 0px;
  grid-row-gap: 4px;
  align-items: center;
`
