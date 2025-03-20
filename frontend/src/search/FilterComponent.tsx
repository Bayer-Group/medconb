import Icon from '@ant-design/icons/lib/components/Icon'
import {styled} from '@linaria/react'
import {Button, Dropdown, Space, theme} from 'antd'
import {MenuProps} from 'antd/lib'
import {PlusIcon} from '../customIcons'
import {useMemo} from 'react'
import { FieldExpr, Filter, Schema} from '.'
import FilterUnit from './FilterUnit'
import {MenuInfo} from 'rc-menu/lib/interface'
const {useToken} = theme

type FilterComponentProps = {
  schema: Schema
  value: Filter
  onChange: (filter: Filter) => void
}

const FilterComponent: React.FC<FilterComponentProps> = ({schema, value, onChange}) => {
  const {hashId} = useToken()

  // const filter: Filter = {
  //   units: [
  //     {
  //       type: 'op',
  //       op: 'is',
  //       exprs: [
  //         {type: 'field', value: 'visibility'},
  //         {type: 'literal', valueType: 'enumset', value: ['Own', 'Shared']},
  //       ],
  //     },
  //   ],
  // }

  const filtersMenu = useMemo(() => {
    // const usedProperties = propertyValues.map((p) => p.propertyID)
    const usedFields = value.units.map((unit) => (unit.exprs[0] as FieldExpr).value)
    const propertyOptions = schema.elements
      .filter((e) => !usedFields.includes(e.name))
      .map((e) => ({
        key: e.name,
        label: e.label,
      }))
    return propertyOptions
  }, [value])

  const handleMenuClick: MenuProps['onClick'] = (e: MenuInfo) => {
    // e.key
    onChange({
      ...value,
      units: [
        ...value.units,
        {
          type: 'op',
          op: 'is',
          exprs: [{type: 'field', value: e.key}],
        },
      ],
    })
  }

  const handleUnitChange = (field: string) => (unit: Filter['units'][number]) => {
    onChange({
      ...value,
      units: value.units.map((u) => {
        if ((u.exprs[0] as FieldExpr).value == field) {
          return unit
        }
        return u
      }),
    })
  }

  return (
    <Root className={`${hashId}`}>
      <Space style={{marginTop: 8}}>
        {value.units.map((unit) => (
          <FilterUnit
            key={(unit.exprs[0] as FieldExpr).value}
            schema={schema}
            unit={unit}
            onChange={handleUnitChange((unit.exprs[0] as FieldExpr).value)}
          />
        ))}
        {filtersMenu.length > 0 && (
          <Dropdown menu={{items: filtersMenu, onClick: handleMenuClick}}>
            <Button size="small" type="dashed" style={{fontSize: 12}} icon={<Icon component={PlusIcon} />}>
              Add Filter
            </Button>
          </Dropdown>
        )}
      </Space>
    </Root>
  )
}

export default FilterComponent

const Root = styled.div`
  font-size: 12px;

  .ant-btn.ant-btn-sm {
    border-radius: 16px;
  }
`
