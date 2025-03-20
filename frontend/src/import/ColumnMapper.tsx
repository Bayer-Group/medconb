import {styled} from '@linaria/react'
import {Button, Checkbox, Input, Select, Space, Typography} from 'antd'
import {isString, map} from 'lodash'
import React, {useEffect, useState} from 'react'
const {Option} = Select
const {Text} = Typography

export type ImportColumnMap = {
  ontology: number
  code: number
  concept: number | string
}

type ColumnMapperProps = {
  headers: string[]
  filename: string
  initColumnMap: ImportColumnMap
  onProceed: (columnMap: ImportColumnMap) => void
  onBack: () => void
}

export const columnLables = {
  concept: 'Medical Codelist Name',
  ontology: 'Ontology',
  code: 'Code',
}

const ColumnMapper: React.FC<ColumnMapperProps> = ({headers, filename, initColumnMap, onProceed, onBack}) => {
  const [columnMap, setColumnMap] = useState(initColumnMap)
  const [multi, setMulti] = useState(false) // If file contains multiple medical concepts

  if (!multi && !columnMap.concept && !!filename) {
    const conceptName = filename.split('.').slice(0, -1).join('.')
    setColumnMap({...columnMap, concept: conceptName})
  }

  return (
    <div>
      <Checkbox onChange={(e) => setMulti(e.target.checked)}>File contains multiple Medical Concepts</Checkbox>
      <Mapper>
        {map(columnLables, (label, key) => (
          <div key={key}>{label}</div>
        ))}
        {map(columnLables, (_, key) =>
          key === 'concept' && !multi ? (
            <Input
              key={key}
              size="small"
              value={isString(columnMap[key]) ? columnMap[key] : ''}
              placeholder="Enter name of codelist"
              onChange={(e) => setColumnMap({...columnMap, [key]: e.target.value})}
              style={{width: 300}}
            />
          ) : (
            <Select
              key={key}
              size="small"
              defaultValue={columnMap[key as keyof ImportColumnMap]}
              style={{width: 300}}
              onChange={(v) => {
                setColumnMap({...columnMap, [key]: v})
              }}>
              {headers.map((h, i) => (
                <Option key={h} value={i}>
                  {h}
                </Option>
              ))}
            </Select>
          ),
        )}
      </Mapper>
      <Space>
        {onBack && (
          <Button size="small" onClick={onBack}>
            Back
          </Button>
        )}
        <Button type="primary" size="small" onClick={() => onProceed(columnMap)}>
          Proceed
        </Button>
      </Space>
    </div>
  )
}

type ColumnMapperSummaryProps = {
  headers: string[]
  columnMap: ImportColumnMap
}

export const ColumnMapperSummary: React.FC<ColumnMapperSummaryProps> = ({headers, columnMap}) => {
  return (
    <div>
      <Mapper>
        {map(columnLables, (label, key) => (
          <div key={key}>{label}</div>
        ))}
        {map(columnLables, (_, key) => {
          return (
            <Text key={key}>
              {isString(columnMap[key as keyof ImportColumnMap])
                ? columnMap[key as keyof ImportColumnMap]
                : headers[columnMap[key as keyof ImportColumnMap] as number]}
            </Text>
          )
        })}
      </Mapper>
    </div>
  )
}

export const Mapper = styled.div`
  display: grid;
  grid-template-columns: 200px 1fr;
  grid-template-rows: repeat(3, 1.5rem);
  grid-auto-flow: column;
  grid-column-gap: 0px;
  grid-row-gap: 4px;
  align-items: center;
  margin-bottom: 6px;
`

export default ColumnMapper
