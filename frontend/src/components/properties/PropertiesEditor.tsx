import React, {useCallback, useMemo, useRef, useState} from 'react'
import {Property, PropertyValue} from '../../..'
import {Button, Dropdown, MenuProps, theme} from 'antd'
import Icon from '@ant-design/icons'
import {CloseIcon, PlusIcon} from '../../customIcons'
import {PropertiesRoot, PropertyContainer, PropertyRow} from '.'
import PropertyEntry from './PropertyEntry'
import {MenuInfo} from 'rc-menu/lib/interface'
import {find, sortBy} from 'lodash'
import EditableText from '../EditableText'
import {MenuItemType} from 'antd/es/menu/hooks/useItems'
import {styled} from '@linaria/react'
const {useToken} = theme

export type PropertiesEditorProps = {
  properties: Property[]
  propertyValues: PropertyValue[]
  owner?: string
  onChange?: (properties: PropertyValue[]) => void
}

const PropertiesEditor: React.FC<PropertiesEditorProps> = ({properties, owner, onChange, propertyValues}) => {
  const [addingCustom, setAddingCustom] = useState(false)
  const pendingProperty = useRef<string | null>(null)
  const {hashId} = useToken()

  const propertiesMenuItems = useMemo(() => {
    const usedProperties = propertyValues.map((p) => p.propertyID)
    let propertyOptions: MenuProps['items'] = properties
      .filter((property) => !property.readOnly && !usedProperties.includes(property.id))
      .map((property) => ({
        label: property.name,
        key: `${property.id}`,
      }))

    propertyOptions = sortBy(propertyOptions, (p) => ((p as MenuItemType).label! as string).toLowerCase())

    if (propertyOptions.length > 0) {
      propertyOptions.push({type: 'divider'})
    }

    propertyOptions.push({label: 'Custom', key: 'custom'})

    return propertyOptions
  }, [properties, propertyValues])

  const handlePropertySelect = useCallback(
    ({key}: MenuInfo) => {
      if (key == 'custom') {
        setAddingCustom(true)
        return
      }
      const property = find(propertiesMenuItems, {key})
      pendingProperty.current = (property! as MenuItemType).label as string
      onChange?.([{propertyID: Number(key), name: (property! as MenuItemType).label as string, value: ''}])
    },
    [propertyValues],
  )

  const handlePropertyUpdate = useCallback(
    (propertyValue: PropertyValue) => {
      onChange?.([propertyValue])
    },
    [propertyValues],
  )

  const _propertyValues = useMemo(() => {
    const suppliedValues = [...propertyValues]
    if (owner) {
      suppliedValues.push({name: '__owner__', value: owner})
    }
    const _values = sortBy(suppliedValues, (p) => p.name.toLowerCase())

    return _values
  }, [propertyValues, owner])

  return (
    <>
      <PropertiesRoot>
        {_propertyValues.map((propertyValue) => (
          <PropertyEntry
            blink={pendingProperty.current === propertyValue.name}
            key={propertyValue.propertyID ?? propertyValue.name}
            property={find(properties, {name: propertyValue.name})}
            value={propertyValue}
            onChange={onChange ? handlePropertyUpdate : undefined}
            onDelete={onChange ? () => onChange([{...propertyValue, value: null}]) : undefined}
          />
        ))}
        {addingCustom && (
          <PropertyRow>
            <Button
              onClick={(e) => {
                e.stopPropagation()
                setAddingCustom(false)
              }}
              className="remove"
              size="small"
              type="text"
              icon={<Icon component={() => <CloseIcon />} />}
            />
            <PropertyContainer>
              <EditableText
                value={''}
                editing
                onCancel={() => setAddingCustom(false)}
                onSave={(newValue) => {
                  setAddingCustom(false)
                  pendingProperty.current = newValue
                  onChange?.([...propertyValues, {name: newValue, value: ''}])
                }}
              />
            </PropertyContainer>
            {/* <PropertyContainer>
              <EditableText value={''} onSave={console.log} />
            </PropertyContainer> */}
          </PropertyRow>
        )}
      </PropertiesRoot>
      {onChange && (
        <AddRoot className={`${hashId}`} style={{marginLeft: 32}}>
          <Dropdown menu={{items: propertiesMenuItems, onClick: handlePropertySelect}}>
            <Button size="small" type="dashed" style={{fontSize: 12}} icon={<Icon component={PlusIcon} />}>
              Add Property
            </Button>
          </Dropdown>
        </AddRoot>
      )}
    </>
  )
}

export default PropertiesEditor

const AddRoot = styled.div`
  .ant-btn.ant-btn-sm {
    border-radius: 16px;
  }
`
