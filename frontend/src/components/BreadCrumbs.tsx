import {styled} from '@linaria/react'
import {Space} from 'antd'
import {flatMap} from 'lodash'
import React from 'react'
import {lighten} from 'polished'
import classNames from 'classnames'
import EntityTypeIcon from './EntityTypeIcon'

export type BreadCrumbItem = {
  type: 'Codelist' | 'Phenotype' | 'CodelistCollection' | 'PhenotypeCollection'
  name: string
  id: string
}

type BreadCrumbsProps = {
  items: BreadCrumbItem[]
  onClick: (item: BreadCrumbItem) => void
}
const BreadCrumbs: React.FC<BreadCrumbsProps> = ({items, onClick}) => {
  const breadcrumbs = items.map((item, index) => {
    return (
      <Pill
        key={item.id}
        className={classNames({
          last: index === items.length - 1,
          codelist: item.type === 'Codelist',
          phenotype: item.type === 'Phenotype',
          phenotypeCollection: item.type === 'PhenotypeCollection',
          codelistCollection: item.type === 'CodelistCollection',
        })}>
        <Space>
          <EntityTypeIcon isActive type={item.type} size="small" />
          <a
            href=""
            key={item.id}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onClick(item)
            }}>
            {item.name}
          </a>
        </Space>
      </Pill>
    )
  })

  return (
    <Root>
      <Space>
        {/* {vizIcon} */}
        {flatMap(breadcrumbs, (value, index: number, array) => (array.length - 1 !== index ? [value, ' / '] : value))}
      </Space>
    </Root>
  )
}

export default BreadCrumbs

const Root = styled.div`
  font-size: 11px;
  color: #8c8c8c;

  a {
    color: #8c8c8c;
  }

  .ant-space-item:last-child {
    color: initial;
  }
`

const Pill = styled.div`
  display: inline-flex;
  border-radius: 20px;
  padding: 2px 4px 2px 0;

  &.last {
    a {
      color: #262626;
    }
    &.codelist {
    }

    &.phenotype {
    }

    &.phenotypeCollection {
    }

    &.codelistCollection {
    }
  }
`
