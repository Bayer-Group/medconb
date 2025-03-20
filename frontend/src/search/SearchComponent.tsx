import {App, Button, Divider, Flex, Input, Space, Tooltip} from 'antd'
import {Filter, Schema, Visibility} from '.'
import {GlobalOutlined, UserOutlined} from '@ant-design/icons'
import Icon from '@ant-design/icons/lib/components/Icon'
import { SearchIcon, SharedIcon} from '../customIcons'
import {without} from 'lodash'
import {useState} from 'react'
import EntityTypeIcon from '../components/EntityTypeIcon'
import {CircleToggleButton} from '../scratch'

type SearchComponentProps = {
  onSearch: (searchString: string) => void
  onFilterChange: (filter: Filter) => void
  value: string
  filter: Filter
  visibility: Visibility[]
  onVisibilityChange: (visibility: Visibility[]) => void
  schema: Schema
  entityTypes: string[]
  onEntityTypesChange: (entityTypes: string[]) => void
}
const SearchComponent: React.FC<SearchComponentProps> = ({
  onSearch,
  filter,
  onFilterChange,
  value,
  schema,
  visibility,
  onVisibilityChange,
  entityTypes,
  onEntityTypesChange,
}) => {
  const [searchString, setSearchString] = useState(value)
  const {message} = App.useApp()

  const handleVisibilityToggle = (element: Visibility) => (active: boolean) => {
    if (!active && visibility.length == 1) {
      message.info('You can’t deactivate all filters, one filter needs to be active')
      return
    }
    onVisibilityChange(active ? [...visibility, element] : without(visibility, element))
  }

  const handleEntityTypeToggle = (element: string) => (active: boolean) => {
    if (!active && entityTypes.length == 1) {
      message.info('You can’t deactivate all filters, one filter needs to be active')
      return
    }
    onEntityTypesChange(active ? [...entityTypes, element] : without(entityTypes, element))
  }

  return (
    <div style={{padding: 16, paddingBottom: 32}}>
      <Flex gap={32}>
        {/* .Compact block style={{maxWidth: 500}} */}
        <Space data-tour-target="__freetext-search__">
          <Input
            // prefix={<SearchOutlined />}
            onChange={(e) => {
              setSearchString(e.target.value)
            }}
            placeholder="Search within name and description..."
            value={searchString}
            // bordered={false}
            width={300}
            style={{width: 300}}
            allowClear
            onPressEnter={() => onSearch(searchString)}
          />
          <Button
            onClick={() => onSearch(searchString)}
            type="primary"
            icon={<Icon component={() => <SearchIcon fill="#fff" />} />}
          />
        </Space>

        <Space data-tour-target="__primary-filters__">
          <Tooltip placement="topLeft" title={'Include Phenotype collections'} arrow={false}>
            <EntityTypeIcon
              type="PhenotypeCollection"
              onChange={handleEntityTypeToggle('PhenotypeCollection')}
              isActive={entityTypes.includes('PhenotypeCollection')}
            />
          </Tooltip>
          <Tooltip placement="topLeft" title={'Include Codelist collections'} arrow={false}>
            <EntityTypeIcon
              type="CodelistCollection"
              onChange={handleEntityTypeToggle('CodelistCollection')}
              isActive={entityTypes.includes('CodelistCollection')}
            />
          </Tooltip>
          <Tooltip placement="topLeft" title={'Include Phenotypes'} arrow={false}>
            <EntityTypeIcon
              type="Phenotype"
              onChange={handleEntityTypeToggle('Phenotype')}
              isActive={entityTypes.includes('Phenotype')}
            />
          </Tooltip>
          <Tooltip placement="topLeft" title={'Include Codelists'} arrow={false}>
            <EntityTypeIcon
              type="Codelist"
              onChange={handleEntityTypeToggle('Codelist')}
              isActive={entityTypes.includes('Codelist')}
            />
          </Tooltip>

          <Divider style={{marginInline: 0}} type="vertical" />

          <Tooltip placement="topLeft" title={'Include items I own'} arrow={false}>
            <CircleToggleButton
              onChange={handleVisibilityToggle('own')}
              isActive={visibility.includes('own')}
              icon={<UserOutlined />}
            />
          </Tooltip>
          <Tooltip placement="topLeft" title={'Include items shared with me'} arrow={false}>
            <CircleToggleButton
              onChange={handleVisibilityToggle('shared')}
              isActive={visibility.includes('shared')}
              icon={<Icon component={() => <SharedIcon fill="#fff" />} />}
            />
          </Tooltip>
          <Tooltip placement="topLeft" title={'Include public items'} arrow={false}>
            <CircleToggleButton
              onChange={handleVisibilityToggle('public')}
              isActive={visibility.includes('public')}
              icon={<GlobalOutlined style={{fill: '#262626'}} />}
            />
          </Tooltip>
        </Space>
      </Flex>

      {/* <FilterComponent value={filter} onChange={onFilterChange} schema={schema} /> */}
    </div>
  )
}

export default SearchComponent
