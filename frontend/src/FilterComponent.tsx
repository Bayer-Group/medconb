import {styled} from '@linaria/react'
import {Button, Input, Space} from 'antd'
import {useEffect, useState} from 'react'
import RegexInput, {Mode} from './components/RegexInput'
import InlineHelp from './InlineHelp'

export type Filter = {
  code: string
  mode: Mode
  description: string
}

type FilterComponentProps = {
  onFilterChange: (filter: Filter) => void
  value: Filter
}

const FilterComponent: React.FC<FilterComponentProps> = ({onFilterChange, value}) => {
  const [iv, setInternalValue] = useState(value)
  useEffect(() => {
    setInternalValue(value)
  }, [value])

  return (
    <Root>
      <Space>
        <RegexInput
          onChange={(code, mode) => {
            setInternalValue({...iv, mode, code: code ?? ''})
          }}
          onEnter={() => onFilterChange(iv)}
          mode={iv.mode}
          value={iv.code}
        />
        <Input
          size="small"
          onChange={(e) => {
            setInternalValue({...iv, description: e.target.value})
          }}
          placeholder="Search Description"
          value={iv.description}
          allowClear
          onPressEnter={() => onFilterChange(iv)}
        />
        <Button
          onClick={() => {
            onFilterChange(iv)
          }}
          size="small">
          Search
        </Button>
        {(iv.code.trim() !== '' || iv.description.trim() !== '') && (
          <Button
            type="dashed"
            onClick={() => onFilterChange({code: '', mode: Mode.POSIX, description: ''})}
            size="small">
            Clear Search
          </Button>
        )}
        <InlineHelp
          content={
            'This is the Ontology Viewer Search. The elements of the Ontology View will' +
            ' be filtered according to the search results.' +
            ' A search in the description always searches for the whole text.' +
            ' A search in the code always applies to the whole code.' +
            ' Use "%" and "_" as placeholders for any amount or a single character or' +
            ' switch to regex mode and use regex.'
          }
        />
      </Space>
    </Root>
  )
}

export default FilterComponent

const Root = styled.div`
  padding: 4px;
  text-align: right;
  flex: 1;
`
