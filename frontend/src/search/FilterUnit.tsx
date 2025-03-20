import {DownOutlined} from '@ant-design/icons'
import {styled} from '@linaria/react'
import {Button, Checkbox, Input, InputNumber, Popover, Select, Space, theme} from 'antd'
import React, {useMemo} from 'react'
import {FieldExpr, Filter, LiteralExpr, Schema} from '.'
import {findFieldByName, findMatchingOpItems} from './utils'
import {find} from 'lodash'
import {CheckboxValueType} from 'antd/es/checkbox/Group'
const {useToken} = theme

type FilterUnitProps = {
  unit: Filter['units'][number]
  schema: Schema
  onChange: (unit: Filter['units'][number]) => void
}

const FilterUnit: React.FC<FilterUnitProps> = ({unit, schema, onChange}) => {
  const {hashId} = useToken()
  const element = useMemo(() => {
    return findFieldByName(schema, (unit.exprs[0] as FieldExpr).value)
  }, [unit, schema])

  const ops = useMemo(() => {
    return findMatchingOpItems(schema, {lhs: unit.exprs[0] as FieldExpr})
  }, [unit, schema])

  const op = useMemo(() => {
    return find(ops, {op: unit.op})
  }, [unit, ops])

  const handleOpChange = (op: string) => {
    onChange({
      ...unit,
      op,
    })
  }

  const handleEnumValuesChange = (values: CheckboxValueType[]) => {
    onChange({
      ...unit,
      exprs: [
        unit.exprs[0],
        {
          ...unit.exprs[1],
          value: values,
          valueType: 'enumset',
        } as LiteralExpr,
      ],
    })
  }

  const handleTextValueChange = (value: string) => {
    onChange({
      ...unit,
      exprs: [
        unit.exprs[0],
        {
          ...unit.exprs[1],
          value,
          valueType: 'text',
        } as LiteralExpr,
      ],
    })
  }
  const handleNumberValueChange = (value: string | null) => {
    onChange({
      ...unit,
      exprs: [
        unit.exprs[0],
        {
          ...unit.exprs[1],
          value,
          valueType: 'number',
        } as LiteralExpr,
      ],
    })
  }

  const content = (
    <PopupContent className={`${hashId}`}>
      <Space align="center">
        {element.label}
        <Select
          bordered={false}
          size="small"
          value={unit.op}
          style={{width: 110}}
          onChange={handleOpChange}
          options={ops.map((o) => ({label: o.op, value: o.op}))}
        />
      </Space>
      <Content>
        {op?.exprTypes.length && (
          <>
            {op.exprTypes[1] == 'enumset' && (
              <Checkbox.Group
                options={element.enumValues}
                value={(unit.exprs[1] as LiteralExpr)?.value}
                onChange={handleEnumValuesChange}
              />
            )}
            {op.exprTypes[1] == 'text' && (
              <Input
                size="small"
                onChange={(e) => {
                  handleTextValueChange(e.target.value)
                }}
                value={(unit.exprs[1] as LiteralExpr)?.value}
                // bordered={false}
                allowClear
              />
            )}
            {op.exprTypes[1] == 'number' && (
              <InputNumber
                size="small"
                onChange={handleNumberValueChange}
                value={(unit.exprs[1] as LiteralExpr)?.value}
              />
            )}
          </>
        )}
      </Content>
      {/* <div>
        <Checkbox onChange={console.log}>Own</Checkbox>
      </div>
      <div>
        <Checkbox onChange={console.log}>Shared</Checkbox>
      </div>
      <div>
        <Checkbox onChange={console.log}>Public</Checkbox>
      </div> */}
    </PopupContent>
  )
  return (
    <Popover placement="bottomLeft" arrow={false} content={content} trigger={['click']}>
      <Button size="small">
        <Space>
          {element.label}
          <DownOutlined />
        </Space>
      </Button>
    </Popover>
  )
}

export default FilterUnit

const PopupContent = styled.div`
  min-width: 180px;
  .ant-select-selector:focus,
  .ant-select-selector:active {
    border-color: transparent;
  }

  .ant-checkbox-group {
    display: flex;
    flex-direction: column;
  }
`

const Content = styled.div``
