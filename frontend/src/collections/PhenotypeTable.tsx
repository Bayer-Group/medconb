import {ActionType, ProColumns, ProTable} from '@ant-design/pro-components'
import {Phenotype, Property} from '../..'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {EditableP, TableTitleSpace, Title} from '../scratch'
import {useQuery} from '@apollo/client'
import {FETCH_PHENOTYPE, FETCH_PROPERTIES_DEF} from '../graphql'
import {find, isNil} from 'lodash'
import {Link, useNavigate} from 'react-router-dom'
import {Typography, Button, Dropdown, MenuProps, Space} from 'antd'
import UserDisplay from '../UserDisplay'
import dayjs from 'dayjs'
import Icon from '@ant-design/icons/lib/components/Icon'
import {PlusIcon} from '../customIcons'
import usePhenotypeActions from '../phenotypes/usePhenotypeActions'
const {Text} = Typography
type PhenotypeTableProps = {
  phenotypes: any[]
  collections?: {
    id: string
    name: string
  }[]
  navigateEntity?: (type: string, id: string) => void
  onNavigateToSearch: () => void
  onAddPhenotype: () => Promise<void>
  readOnly: boolean
  onBulkAdd?: (phenotypeIds: string[], collectionId: string) => Promise<any>
}

const PhenotypeTable: React.FC<PhenotypeTableProps> = ({
  phenotypes,
  collections = [],
  onNavigateToSearch,
  navigateEntity,
  onBulkAdd,
  onAddPhenotype,
  readOnly,
}) => {
  const actionRef = useRef<ActionType>()
  useEffect(() => {
    actionRef.current?.reload()
  }, [phenotypes.length])
  const [working, setWorking] = useState(false)
  const [addingPhenotype, setAddingPhenotype] = useState(false)

  const handleAddPhenotype = useCallback(async () => {
    setAddingPhenotype(true)
    await onAddPhenotype()
    setAddingPhenotype(false)
  }, [onAddPhenotype])

  const {data: propData} = useQuery(FETCH_PROPERTIES_DEF, {
    fetchPolicy: 'cache-first',
  })
  const [columns, columnState] = useMemo(() => {
    const defaultColumnState = {
      name: {show: true},
      codelists: {show: true},
    } as any
    const cols = [] as ProColumns<Phenotype>[]
    cols.push({
      disable: true,
      title: 'Name',
      key: 'name',
      dataIndex: 'name',
      render: (_, record) => <PhenotypeCell phenotype={record} navigateEntity={navigateEntity} />,
    })
    ;(propData?.properties ?? [])
      .filter((p: Property) => p.class === 'Phenotype')
      .forEach((property: Property) => {
        defaultColumnState[property.name] = {show: property.required}
        cols.push({
          title: property.name,
          key: property.name,
          render: (_, record) => {
            const p = find(record.properties, {propertyID: property.id})
            if (!isNil(p)) {
              if (property.dtype == 'User') return p.value ? <UserDisplay userId={p.value} /> : '-'
              if (property.dtype == 'Time') return p.value ? dayjs(parseInt(p?.value) * 1000).format('lll') : '-'
            }
            return p?.value ?? '-'
          },
        })
      })

    cols.push({
      title: 'Codelists',
      key: 'codelists',
      render: (_, record) => {
        return (record.codelists ?? []).map((c) => c.name).join(',')
      },
    })

    return [cols, defaultColumnState]
  }, [propData])
  const showCheckbox = collections.length > 0 && onBulkAdd

  const handleBulkAdd = (items: string[], container: string) => {
    setWorking(true)
    onBulkAdd?.(items, container).then(() => {
      setWorking(false)
    })
  }

  return (
    <ProTable<Phenotype>
      // key={data.collection.id}
      columns={columns}
      actionRef={actionRef}
      ghost
      // cardBordered
      dataSource={phenotypes}
      editable={{
        type: 'multiple',
      }}
      loading={!propData || working}
      columnsState={{
        defaultValue: columnState,
        persistenceKey: 'pro-table-singe-demos',
        persistenceType: 'localStorage',
        onChange(value) {
          // console.log('value: ', value)
        },
      }}
      rowSelection={
        showCheckbox
          ? {
              getCheckboxProps() {
                return {
                  // disabled: true,
                }
              },
            }
          : undefined
      }
      tableAlertOptionRender={({selectedRowKeys, onCleanSelected, selectedRows}) => {
        if (!showCheckbox) return

        const items: MenuProps['items'] = collections.map((c) => ({key: c.id, label: c.name}))
        const text = collections.length > 1 ? 'Add to' : `Add to ${collections[0].name}`
        let elem = (
          <Button
            type="link"
            onClick={
              collections.length > 1 ? undefined : () => handleBulkAdd(selectedRowKeys as string[], collections[0].id)
            }>
            {text}
          </Button>
        )

        if (collections.length > 1) {
          elem = (
            <Dropdown
              trigger={['click']}
              menu={{items, onClick: ({key}) => handleBulkAdd(selectedRowKeys as string[], key)}}
              placement="bottomRight"
              arrow>
              {elem}
            </Dropdown>
          )
        }

        return (
          <Space>
            {elem}
            <Button type="link" onClick={onCleanSelected}>
              Cancel
            </Button>
          </Space>
        )
      }}
      rowKey="id"
      search={false}
      options={{
        density: false,
        setting: {
          listsHeight: 400,
        },
      }}
      form={{
        syncToUrl: (values, type) => {
          if (type === 'get') {
            return {
              ...values,
              created_at: [values.startTime, values.endTime],
            }
          }
          return values
        },
      }}
      pagination={false}
      defaultSize={'small'}
      dateFormatter="string"
      scroll={{x: 'max-content'}}
      headerTitle={
        <TableTitleSpace>
          <Title>Phenotypes</Title>
          {!readOnly && (
            <>
              <Button
                onClick={handleAddPhenotype}
                loading={addingPhenotype}
                disabled={addingPhenotype}
                size="small"
                type="dashed"
                style={{fontSize: 12}}
                icon={<Icon component={PlusIcon} />}>
                Create new phenotype
              </Button>
              <Text style={{fontWeight: 'normal', fontStyle: 'italic', color: '#8c8c8c', fontSize: 10}}>
                or you can add an existing Phenotypes through the{' '}
                <a href="#" onClick={onNavigateToSearch}>
                  search
                </a>
              </Text>
            </>
          )}
        </TableTitleSpace>
      }
    />
  )
}

export default PhenotypeTable

const PhenotypeCell = ({
  phenotype,
  navigateEntity,
}: {
  phenotype: Phenotype
  navigateEntity?: (type: string, id: string) => void
}) => {
  const navigate = useNavigate()
  const [renaming, setRenaming] = useState(false)
  const {menuItems, handleMenuClick, updatePhenotype} = usePhenotypeActions(
    phenotype,
    phenotype.containerHierarchy[0]?.visibility !== 'Private',
    {
      onRename: () => setRenaming(true),
    },
  )
  const handleRename = useCallback(
    async (newName: string) => {
      await updatePhenotype({name: newName})
      setRenaming(false)
    },
    [phenotype],
  )
  return (
    <Dropdown menu={{items: menuItems, onClick: handleMenuClick}} trigger={['contextMenu']}>
      <span
        style={{cursor: renaming ? 'initial' : 'pointer', color: renaming ? 'initial' : '#1677ff'}}
        onClick={(e) => {
          e.preventDefault()
          if (navigateEntity && !renaming) {
            navigateEntity('Phenotype', phenotype.id)
          }
          if (!renaming) {
            navigate(`/phenotype/${phenotype.id}`)
          }
        }}
        // to={`/phenotype/${phenotype.id}`}
      >
        <EditableP
          editStyle={{background: '#f1f2f5', color: 'rgba(0, 0, 0, 0.88)'}}
          onCancel={() => setRenaming(false)}
          value={phenotype.name ?? ''}
          editMode={renaming}
          onSave={handleRename}
        />
      </span>
    </Dropdown>
  )
}
