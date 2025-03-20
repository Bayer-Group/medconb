import {ActionType, ProColumns, ProTable} from '@ant-design/pro-components'
import {Codelist} from '../..'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {Count, EditableP, TableTitleSpace, Title} from '../scratch'
import {Button, Dropdown, MenuProps, Space, Typography} from 'antd'
import {styled} from '@linaria/react'
import Icon from '@ant-design/icons/lib/components/Icon'
import {PlusIcon} from '../customIcons'
import useCodelistActions from '../codelists/useCodelistActions'
const {Text} = Typography
type CodelistTableProps = {
  codelists: any[]
  onCodelistClick: (id: string) => void
  containers?: {
    id: string
    name: string
  }[]
  onNavigateToSearch: () => void
  onAddCodelist: () => void
  readOnly: boolean
  onBulkAdd?: (codelistIds: string[], containerId: string) => Promise<any>
}

const CodelistTable: React.FC<CodelistTableProps> = ({
  codelists,
  onCodelistClick,
  containers = [],
  onBulkAdd,
  readOnly,
  onAddCodelist,
  onNavigateToSearch,
}) => {
  const actionRef = useRef<ActionType>()
  useEffect(() => {
    actionRef.current?.reload()
  }, [codelists.length])
  const [working, setWorking] = useState(false)
  const [addingCodelist, setAddingCodelist] = useState(false)

  const handleAddCodelist = useCallback(async () => {
    setAddingCodelist(true)
    await onAddCodelist()
    setAddingCodelist(false)
  }, [onAddCodelist])

  const columns: ProColumns<Partial<Codelist>>[] = useMemo(() => {
    return [
      {
        dataIndex: 'name',
        title: 'Name',
        render: (_, record) => (
          <CodelistCell readOnly={readOnly} onCodelistClick={() => onCodelistClick(record.id!)} codelist={record} />
        ),
      },
      {
        key: 'summary',
        title: 'Summary',
        render: (_, record) => {
          return (
            <div>
              <Space size={'middle'}>
                {(record.codesets ?? []).map((codeset) => (
                  <Indicator key={codeset.ontology.name}>
                    <span>{codeset.ontology.name}</span>
                    {/* {codeset.changed && <ChangedCount>{codeset.codes}</ChangedCount>} */}
                    {/* {!codeset.changed && <Count>{codeset.codes}</Count>} */}
                    <Count>{codeset.codes.length}</Count>
                  </Indicator>
                ))}
              </Space>
            </div>
          )
        },
      },
    ]
  }, [])
  const showCheckbox = containers.length > 0 && onBulkAdd
  const handleBulkAdd = (items: string[], container: string) => {
    if (!onBulkAdd) {
      return
    }
    setWorking(true)
    onBulkAdd(items, container).then(() => {
      setWorking(false)
    })
  }
  return (
    <ProTable<Partial<Codelist>>
      columns={columns}
      actionRef={actionRef}
      ghost
      dataSource={codelists}
      editable={{
        type: 'multiple',
      }}
      loading={working}
      rowSelection={showCheckbox ? {} : undefined}
      tableAlertOptionRender={({selectedRowKeys, onCleanSelected, selectedRows}) => {
        if (!showCheckbox) return

        const items: MenuProps['items'] = containers.map((c) => ({key: c.id, label: c.name}))
        const text = containers.length > 1 ? 'Add to' : `Add to ${containers[0].name}`
        let elem = (
          <Button
            type="link"
            onClick={
              containers.length > 1 ? undefined : () => handleBulkAdd(selectedRowKeys as string[], containers[0].id)
            }>
            {text}
          </Button>
        )

        if (containers.length > 1) {
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
      columnsState={{
        persistenceKey: 'pro-table-singe-demos',
        persistenceType: 'localStorage',
        onChange(value) {
          // console.log('value: ', value)
        },
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
          <Title>Codelists</Title>
          {!readOnly && (
            <>
              <Button
                onClick={handleAddCodelist}
                size="small"
                type="dashed"
                loading={addingCodelist}
                disabled={addingCodelist}
                style={{fontSize: 12}}
                icon={<Icon component={PlusIcon} />}>
                Create new codelist
              </Button>
              <Text style={{fontWeight: 'normal', fontStyle: 'italic', color: '#8c8c8c', fontSize: 10}}>
                or you can add an existing Codelist through the{' '}
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

export default CodelistTable

const CodelistCell = ({
  codelist,
  onCodelistClick,
  readOnly,
}: {
  onCodelistClick: () => void
  codelist: Codelist
  readOnly: boolean
}) => {
  const [renaming, setRenaming] = useState(false)
  const {menuItems, handleMenuClick, updateCodelist} = useCodelistActions(codelist, readOnly, {
    onRename: () => setRenaming(true),
  })

  const handleRename = useCallback(
    async (newName: string) => {
      await updateCodelist({name: newName})
      setRenaming(false)
    },
    [codelist],
  )

  return (
    <Dropdown menu={{items: menuItems, onClick: handleMenuClick}} trigger={['contextMenu']}>
      <span
        style={{cursor: renaming ? 'initial' : 'pointer', color: renaming ? 'initial' : '#1677ff'}}
        onClick={(e) => {
          e.preventDefault()
          if (!renaming) onCodelistClick()
        }}>
        <EditableP
          editStyle={{background: '#f1f2f5', color: 'rgba(0, 0, 0, 0.88)'}}
          onCancel={() => setRenaming(false)}
          value={codelist.name ?? ''}
          editMode={renaming}
          onSave={handleRename}
        />
      </span>
    </Dropdown>
  )
}

const Indicator = styled.div`
  font-size: 9px;
  color: #8c8c8c;
`
