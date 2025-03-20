import React, {useCallback, useMemo} from 'react'
import {Property, PropertyValue} from '../../..'
import {PropertyContainer, PropertyRow} from '.'
// import EditableText from '../EditableText'
import {Button, Dropdown, Typography} from 'antd'
import {MenuInfo} from 'rc-menu/lib/interface'
import {CloseIcon} from '../../customIcons'
import Icon from '@ant-design/icons/lib/components/Icon'
import classNames from 'classnames'
import {EditableP} from '../../scratch'
import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import UserDisplay from '../../UserDisplay'
dayjs.extend(localizedFormat)

type PropertyEntryProps = {
  property?: Property
  value: PropertyValue
  onChange?: (property: PropertyValue) => void
  onDelete?: () => void
  blink?: boolean
}

const PropertyEntry: React.FC<PropertyEntryProps> = ({property, value, onChange, onDelete, blink}) => {
  const handleMenuOptionClick = useCallback(({key}: MenuInfo) => {
    onChange?.({...value, value: key})
  }, [])
  const valueEntry = useMemo(() => {
    // if (!onChange) {
    //   return <>{value?.value ?? ''}</>
    // }
    if (value.name == '__owner__') {
      return value?.value ? <UserDisplay userId={value?.value} /> : '-'
    }
    switch (property?.dtype) {
      case 'Number':
      case 'Text':
        if (!onChange) {
          return <>{value?.value ?? ''}</>
        }
        return (
          <EditableP
            editableDefault
            value={value?.value ?? ''}
            onSave={(newValue) => onChange?.({...value, value: newValue})}
          />
        )
      case 'User':
        return value?.value ? <UserDisplay userId={value?.value} /> : '-'
      case 'Time':
        return value?.value ? dayjs(parseInt(value?.value) * 1000).format('lll') : '-'
      case 'Enum': {
        if (!onChange) {
          return <>{value?.value ?? ''}</>
        }
        if (!property.options || property.options.length == 0) {
          throw new Error(`No options defined for property ${property.name}.`)
        }
        const options = property.options.map((o) => ({key: o, label: o}))
        return (
          <Dropdown trigger={['click']} menu={{items: options, onClick: handleMenuOptionClick}}>
            <a style={{display: 'block', height: '100%', minHeight: 19, minWidth: '100%'}}>{value?.value}</a>
          </Dropdown>
        )
      }
      default:
        if (!onChange) {
          return <>{value?.value ?? ''}</>
        }
        // throw new Error(`Property type ${property.dtype} not supported.`)
        return <EditableP value={value?.value ?? ''} onSave={(newValue) => onChange?.({...value, value: newValue})} />
    }
  }, [property?.id, value, onChange])
  return (
    <PropertyRow
      className={classNames({
        blink: blink,
        readonly: property?.required || value.name == '__owner__',
        invalid: property?.required && (value?.value ?? '').trim() == '',
      })}>
      {onDelete && !property?.readOnly && (
        <Button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="remove"
          size="small"
          type="text"
          icon={<Icon component={() => <CloseIcon />} />}
        />
      )}
      {(!onDelete || property?.readOnly) && <span />}
      <PropertyContainer className="property">
        <Typography.Text style={{height: 23}} ellipsis>
          {value.name == '__owner__' ? 'Owner' : value.name}
        </Typography.Text>
      </PropertyContainer>
      <PropertyContainer>{valueEntry}</PropertyContainer>
    </PropertyRow>
  )
}

export default PropertyEntry
