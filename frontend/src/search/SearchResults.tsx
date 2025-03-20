import {styled} from '@linaria/react'
import Editor from '../components/Editor'
import { ToggleButtonPlain} from '../scratch'
import { useEffect, useMemo, useRef} from 'react'
import {useIntersectionObserver} from '../useIntersectionObserver'
import {find, last, sortBy} from 'lodash'
import BreadCrumbs, {BreadCrumbItem} from '../components/BreadCrumbs'
import {Col, Empty, Flex, Row, Typography} from 'antd'
import {containerHierarchyToBreadcrumbItems} from '../utils'
import Visibility from '../components/Visibility'
import {PropertiesRoot} from '../components/properties'
import PropertyEntry from '../components/properties/PropertyEntry'

type SearchResultsProps = {
  entities: any[]
  compact?: boolean
  onClick: (entity: any) => void
  onBottomReached: () => void
  entityType: string
  properties: any
  onBreadCrumbItemClick: (item: BreadCrumbItem) => void
}
const SearchResults: React.FC<SearchResultsProps> = ({
  entities,
  entityType,
  properties,
  onClick,
  onBottomReached,
  onBreadCrumbItemClick,
  compact = false,
}) => {
  const lastNode = useRef<HTMLDivElement | null>(null)
  const entry = useIntersectionObserver(lastNode, {
    threshold: [0, 0.5],
  })

  useEffect(() => {
    if (entry && entry.isIntersecting === true && entry.intersectionRatio >= 0) {
      onBottomReached()
    }
  }, [entry, lastNode.current])

  if (entities.length === 0) {
    //
    let desc
    switch (entityType) {
      case 'PhenotypeCollection':
        desc = 'phenotype collections'
        break
      case 'CodelistCollection':
        desc = 'codelist collections'
        break
      case 'Phenotype':
        desc = 'phenotypes'
        break
      case 'Codelist':
        desc = 'codelists'
        break

      default:
        break
    }
    return (
      <Empty
        style={{transform: 'translateY(100px)'}}
        description={`No ${desc} found`}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    )
  }

  return (
    <>
      {entities.map((entity: any, i: number) => {
        const Component = compact ? SearchResultItemCompact : SearchResultItemExpanded
        return (
          <Component
            key={entity.id}
            onBreadCrumbItemClick={onBreadCrumbItemClick}
            onClick={() => onClick(entity)}
            properties={properties}
            entity={entity}
            entityType={entityType}
          />
        )
      })}
      <div key={last(entities)?.id ?? 'undefined'} ref={lastNode}></div>
    </>
  )
}

export default SearchResults

type SearchResultItemProps = {
  onClick: () => void
  entity: any
  entityType: string
  properties: any
  onBreadCrumbItemClick: (item: BreadCrumbItem) => void
}

const SearchResultItemCompact: React.FC<SearchResultItemProps> = ({
  onClick,
  entity,
  entityType,
  onBreadCrumbItemClick,
}) => {
  return (
    <SideTitle onClick={onClick} key={entity.id}>
      <Flex align="center" gap={8} style={{marginBottom: 4}}>
        <Visibility visibility={entity.visibility ?? entity.containerHierarchy[0]?.visibility} />
        <Typography.Title
          title={entity.name}
          style={{marginBottom: 0, maxWidth: 350, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}
          level={4}>
          {entity.name}
        </Typography.Title>
      </Flex>
      <BreadCrumbs
        onClick={onBreadCrumbItemClick}
        items={containerHierarchyToBreadcrumbItems(entityType, entity.containerHierarchy)}
      />
      <Editor
        readOnly={true}
        style={{
          WebkitLineClamp: 3,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
        }}
        defaultValue={entity.medicalDescription ?? entity.description}
      />
    </SideTitle>
  )
}

const SearchResultItemExpanded: React.FC<SearchResultItemProps> = ({
  onClick,
  entity,
  entityType,
  properties,
  onBreadCrumbItemClick,
}) => {
  const _propertyValues = useMemo(() => {
    const suppliedValues = [...(entity.properties ?? [])]

    if (entity.ownerID) {
      suppliedValues.push({name: '__owner__', value: entity.ownerID})
    }
    const _values = sortBy(suppliedValues, (p) => p.name.toLowerCase())

    return _values
  }, [entity.properties, entityType, entity])
  return (
    <ItemRowRoot>
      <Row>
        <Col span={24}>
          <Flex align="center" gap={8} style={{marginBottom: 4}}>
            <Visibility visibility={entity.visibility ?? entity.containerHierarchy[0]?.visibility} />
            <a onClick={onClick}>
              <Typography.Title style={{marginBottom: 0}} level={4}>
                {entity.name}
              </Typography.Title>
            </a>
          </Flex>
        </Col>
        <Col span={24}>
          <BreadCrumbs
            onClick={onBreadCrumbItemClick}
            items={containerHierarchyToBreadcrumbItems(entityType, entity.containerHierarchy)}
          />
        </Col>
      </Row>

      <Row>
        <Col span={12}>
          <ToggleButtonPlain>{entityType === 'Phenotype' ? 'MEDICAL DESCRIPTION' : 'DESCRIPTION'}</ToggleButtonPlain>

          <div style={{marginLeft: 20}}>
            <Editor
              readOnly={true}
              defaultValue={entity.description ?? entity.medicalDescription}
              style={{
                WebkitLineClamp: 3,
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
              }}
            />
          </div>
        </Col>
        {entityType !== 'Codelist' && (
          <Col span={12}>
            <ToggleButtonPlain>PROPERTIES</ToggleButtonPlain>
            <PropertiesRoot>
              {_propertyValues.map((propertyValue: any) => (
                <PropertyEntry
                  key={propertyValue.name}
                  property={find(properties, {id: propertyValue.propertyID})!}
                  value={propertyValue}
                />
              ))}
            </PropertiesRoot>
          </Col>
        )}
      </Row>
    </ItemRowRoot>
  )
}

const ItemRowRoot = styled.div`
  margin-bottom: 20px;
  box-shadow: 0px 0px 30px 0px rgba(0, 0, 0, 0.05);
  padding: 8px 0;
`

const SideTitle = styled.div`
  border-bottom: 1px solid #f1f2f5;
  padding: 8px 0;
  display: block;
  cursor: pointer;

  h5 {
    font-size: 14px;
    margin: 0;
    padding: 0;
  }
`
