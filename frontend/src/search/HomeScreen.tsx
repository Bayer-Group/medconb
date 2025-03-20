import {CloseCircleFilled} from '@ant-design/icons'
import {Typography, Tag, Select, Skeleton, Flex, Badge, Spin} from 'antd'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import {styled} from '@linaria/react'
import {useSearchParams} from 'react-router-dom'
import {useApolloClient, useQuery} from '@apollo/client'
import {FETCH_PROPERTIES_DEF, SEARCH_ENTITIES} from '../graphql'
import {capitalize, isNil, last} from 'lodash'
import Scrollbars from 'react-custom-scrollbars-2'
import Collections from '../collections/CollectionDetail'
import Phenotypes from '../phenotypes/PhenotypeDetail'
import {useDispatch} from 'react-redux'
import {updateSearchParam} from '../store/ui'
import CodelistDetail from '../codelists/CodelistDetail'
import {Element, Filter, Schema, Visibility} from '.'
import {compileFilters} from './utils'
import {Property} from '../..'
import SearchComponent from './SearchComponent'
import classNames from 'classnames'
import SearchResults from './SearchResults'
import {BreadCrumbItem} from '../components/BreadCrumbs'
import MainLoader from '../components/MainLoader'

const fallBackResult = {items: [], total: 0}

const HomeScreen = () => {
  const dispatch = useDispatch()
  const client = useApolloClient()

  const [searchParams, setSearchParams] = useSearchParams()

  const [filter, setFilter] = useState({units: []} as Filter)
  const [loading, setLoading] = useState(false)

  const search = useMemo(() => {
    return searchParams.get('query') ?? ''
  }, [searchParams.get('query')])

  const tab = useMemo(() => {
    return searchParams.get('tab') ?? 'CodelistCollection'
  }, [searchParams.get('tab')])

  const entityTypes = useMemo(() => {
    const _entityTypes = searchParams.get('entityTypes')?.trim()
    if (!_entityTypes || _entityTypes == '') {
      return ['PhenotypeCollection', 'CodelistCollection', 'Phenotype', 'Codelist']
    }

    return _entityTypes.split(',')
  }, [searchParams.get('entityTypes')])

  const visibility = useMemo(() => {
    const visParam = searchParams.get('visibility')?.trim()
    if (!visParam || visParam == '') {
      return ['public'] as Visibility[]
    }

    return visParam.split(',') as Visibility[]
  }, [searchParams.get('visibility')])

  const [entities, setEntities] = useState<{[entityType: string]: {items: any[]; total: number}}>({})

  const initEntityId = searchParams.get('entity_id')
  const initEntityType = searchParams.get('entity_type')

  useEffect(() => {
    doSearch()
  }, [search, visibility, entityTypes])

  const {data: propData} = useQuery(FETCH_PROPERTIES_DEF, {
    fetchPolicy: 'network-only',
  })

  const schema: Schema = useMemo(() => {
    const _schema = {
      elements: [],
    } as Schema
    if (!propData?.properties) return _schema

    propData.properties.forEach((property: Property) => {
      _schema.elements.push({
        type: property.dtype.toLocaleLowerCase() as Element['type'],
        name: property.name,
        intrinsic: true,
        label: capitalize(property.name),
        ...(property.dtype === 'Enum' && {
          enumValues: property.options?.map((option) => ({label: option, value: option})),
        }),
      })
    })

    return _schema
  }, [propData])

  const handleVisibilityChange = (visibility: Visibility[]) => {
    setSearchParams((params: URLSearchParams) => {
      params.set('visibility', visibility.join(','))
      return params
    })
  }

  const handleEntityTypesChange = (entityTypes: string[]) => {
    setSearchParams((params: URLSearchParams) => {
      params.set('entityTypes', entityTypes.join(','))
      return params
    })
  }

  const handleTabChange = (tab: string) => {
    setSearchParams((params: URLSearchParams) => {
      params.set('tab', tab)
      return params
    })
  }

  const handleSearch = (value: string) => {
    setSearchParams((params: URLSearchParams) => {
      params.set('query', value)
      params.delete('entity_type')
      params.delete('entity_id')
      return params
    })
  }

  const doSearch = async () => {
    setLoading(true)

    const _entities: any = {}
    for (let i = 0; i < entityTypes.length; i++) {
      const res = await query(entityTypes[i])
      if (res) {
        _entities[entityTypes[i]] = res.data.searchEntities
      }
    }
    setEntities(_entities)
    setLoading(false)
  }

  const loadMore = async (entityType: string) => {
    if (!isNil(entities[entityType]?.items) && entities[entityType].items.length == entities[entityType].total) return
    const res = await query(entityType)
    if (res) {
      setEntities({
        ...entities,
        [tab]: res.data.searchEntities,
      })
    }
  }

  const query = async (entityType: string, reset = false) => {
    let compiled = ''

    if (filter.units.length > 0) {
      compiled = compileFilters(schema, filter).trim()
    }

    const qs = [search, `visibility:'${visibility.join(',')}'`, compiled].join(' ').trim()
    return await client.query({
      query: SEARCH_ENTITIES,
      variables: {
        entityType,
        query: qs,
        ...(!reset &&
          !isNil(entities[entityType]?.items) &&
          !isNil(last(entities[entityType].items)) && {startCursor: last(entities[entityType].items)!.id}),
      },
      fetchPolicy: 'network-only',
    })
  }

  const handleEntityClick = useCallback(
    (entity: any) => {
      setSearchParams((params: URLSearchParams) => {
        params.set('entity_type', entity.__typename)
        params.set('entity_id', entity.id)
        return params
      })
    },
    [searchParams],
  )

  const handleBreadcrumbItemClick = (item: BreadCrumbItem) => {
    setSearchParams((params: URLSearchParams) => {
      params.set(
        'entity_type',
        ['PhenotypeCollection', 'CodelistCollection'].includes(item.type) ? 'Collection' : item.type,
      )
      params.set('entity_id', item.id)
      return params
    })
  }

  const handleEntityClose = () => {
    setSearchParams((params: URLSearchParams) => {
      params.delete('entity_type')
      params.delete('entity_id')
      return params
    })
  }

  useEffect(() => {
    const params: any = {}
    for (const [key, value] of searchParams.entries()) {
      params[key] = value
    }
    dispatch(updateSearchParam(params))
  }, [searchParams])

  const navigateEntity = (type: string, id: string) => {
    setSearchParams((params: URLSearchParams) => {
      params.set('entity_type', type)
      params.set('entity_id', id)
      return params
    })
  }

  const hasEntityOpen = initEntityId && initEntityType

  if (!propData) {
    return (
      <Root>
        <Skeleton />
      </Root>
    )
  }

  const tabMenu = (
    <CustomMenu>
      {entityTypes.includes('PhenotypeCollection') && (
        <li
          className={classNames({active: tab === 'PhenotypeCollection'})}
          onClick={() => handleTabChange('PhenotypeCollection')}>
          Phenotype Collections
          <Badge count={entities.PhenotypeCollection?.total ?? 0} showZero color="#FF7A45" />
          {/* {!isNil(entities.PhenotypeCollection?.total) && ` (${entities.PhenotypeCollection?.total})`} */}
        </li>
      )}

      {entityTypes.includes('CodelistCollection') && (
        <li
          className={classNames({active: tab === 'CodelistCollection'})}
          onClick={() => handleTabChange('CodelistCollection')}>
          Codelist Collections
          <Badge count={entities.CodelistCollection?.total ?? 0} showZero color="#FF7A45" />
          {/* {!isNil(entities.CodelistCollection?.total) && ` (${entities.CodelistCollection?.total})`} */}
        </li>
      )}
      {entityTypes.includes('Phenotype') && (
        <li className={classNames({active: tab === 'Phenotype'})} onClick={() => handleTabChange('Phenotype')}>
          Phenotypes
          <Badge count={entities.Phenotype?.total ?? 0} showZero color="#FAAD14" />
          {/* {!isNil(entities.Phenotype?.total) && ` (${entities.Phenotype?.total})`} */}
        </li>
      )}
      {entityTypes.includes('Codelist') && (
        <li className={classNames({active: tab === 'Codelist'})} onClick={() => handleTabChange('Codelist')}>
          Codelists
          <Badge count={entities.Codelist?.total ?? 0} showZero color="#13C2C2" />
          {/* {!isNil(entities.Codelist?.total) && ` (${entities.Codelist?.total})`} */}
        </li>
      )}
    </CustomMenu>
  )

  return (
    <Flex vertical style={{height: 'calc(100vh - 32px)'}} data-tour-target="__ontology-search__">
      <SearchComponent
        schema={schema}
        value={search}
        filter={filter}
        visibility={visibility}
        onFilterChange={setFilter}
        onVisibilityChange={handleVisibilityChange}
        onSearch={handleSearch}
        entityTypes={entityTypes}
        onEntityTypesChange={handleEntityTypesChange}
      />
      {tabMenu}
      <Root>
        {hasEntityOpen && (
          <Side>
            <Scrollbars style={{flex: 1}}>
              <SideContent>
                {entities && (
                  <SearchResults
                    onBreadCrumbItemClick={handleBreadcrumbItemClick}
                    properties={propData.properties}
                    onBottomReached={() => loadMore(tab)}
                    entities={(entities[tab] ?? fallBackResult).items}
                    onClick={handleEntityClick}
                    entityType={tab}
                    compact
                  />
                )}
              </SideContent>
            </Scrollbars>
          </Side>
        )}

        <div style={{flex: 1, height: '100%'}}>
          {hasEntityOpen && (
            <EntityPanel>
              {initEntityType == 'Collection' && (
                <Scrollbars style={{flex: 1}}>
                  <Collections readOnly id={initEntityId} navigateEntity={navigateEntity} onClose={handleEntityClose} />
                </Scrollbars>
              )}
              {initEntityType == 'Phenotype' && (
                <Scrollbars style={{flex: 1}}>
                  <Phenotypes readOnly id={initEntityId} navigateEntity={navigateEntity} onClose={handleEntityClose} />
                </Scrollbars>
              )}
              {initEntityType == 'Codelist' && (
                <CodelistDetail id={initEntityId} navigateEntity={navigateEntity} onClose={handleEntityClose} />
              )}
            </EntityPanel>
          )}
          {!hasEntityOpen && (
            <Flex vertical style={{height: '100%'}}>
              {/* {tabMenu} */}
              <Scrollbars style={{flex: 1}}>
                <div style={{marginTop: 16}}>
                  <SearchResults
                    onBreadCrumbItemClick={handleBreadcrumbItemClick}
                    properties={propData.properties}
                    onBottomReached={() => loadMore(tab)}
                    entities={(entities[tab] ?? fallBackResult).items}
                    onClick={handleEntityClick}
                    entityType={tab}
                  />
                </div>
              </Scrollbars>
            </Flex>
          )}
        </div>
        {loading && (
          <LoadingOverlay>
            <MainLoader>
              <Spin />
            </MainLoader>
          </LoadingOverlay>
        )}
      </Root>
    </Flex>
  )
}

export default HomeScreen

const Root = styled.div`
  display: flex;
  flex: 1;
  height: 100%;
  padding: 0 0 0 16px;
  position: relative;
`

const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.1);
`

const FiltersRoot = styled.div`
  padding-left: 15px;
  margin-top: 10px;
`

const FilterTag = styled(Tag)`
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  padding: 0 4px 0 7px;
  font-weight: 500;

  .ant-tag-close-icon {
    margin-left: 8px;
    font-size: 14px;
  }
`

FilterTag.defaultProps = {
  closeIcon: <CloseCircleFilled />,
  closable: true,
}

const Side = styled.div`
  width: 400px;
  height: 100%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #f1f2f5;
`

const SideTitle = styled.a`
  border-bottom: 1px solid #f1f2f5;
  padding: 8px;
  display: block;

  h5 {
    font-size: 14px;
    margin: 0;
    padding: 0;
  }
`

const SideContent = styled.div`
  /* padding: 16px 0 0 0; */

  /* ${FiltersRoot} {
    padding-left: 0;
  } */
`

const EntityPanel = styled.div`
  height: 100%;
  /* margin-top: -24px; */
`

const CustomMenu = styled.ul`
  padding: 0 16px;
  border: 0;
  /* line-height: 46px; */
  border-bottom: 1px solid rgba(5, 5, 5, 0.06);
  box-shadow: none;
  list-style-type: none;
  list-style-image: none;
  display: flex;
  gap: 16px;
  margin: 0;

  li {
    top: 1px;
    margin-top: -1px;
    margin-bottom: 0;
    border-radius: 0;
    /* padding-inline: 16px; */
    cursor: pointer;
    white-space: nowrap;
    position: relative;
    display: flex;
    gap: 6px;
    font-size: 10px;
    align-items: flex-start;
    text-transform: uppercase;
    opacity: 0.5;
    font-weight: bold;
    padding-bottom: 4px;

    .ant-avatar-string {
      font-weight: initial;
    }

    /* &:first-child {
      padding-left: 0;
    } */

    &.active {
      opacity: 1;
      &:after {
        position: absolute;
        inset-inline: 0;
        bottom: 0;
        border-bottom: 2px solid #00bcff;
        transition: border-color 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
        content: '';
      }
    }
  }
`
