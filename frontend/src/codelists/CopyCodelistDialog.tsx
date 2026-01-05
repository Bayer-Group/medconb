import React, {useCallback, useMemo, useState} from 'react'
import {App, Button, Modal, Radio, Space, Divider, Typography, Spin} from 'antd'
import {Codelist, Collection, Phenotype} from '../..'
import {useMutation, useQuery} from '@apollo/client'
import {CLONE_CODE_LIST, SELF} from '../graphql'
import {styled} from '@linaria/react'
import {Title} from '../scratch'
import {FolderOutlined, FileTextOutlined} from '@ant-design/icons'
import {RootState} from '../store'

const {Text} = Typography

type CopyCodelistDialogProps = {
  codelist: Codelist
  onCancel: () => void
  onClose: () => void
}

type DestinationType = {
  id: string
  name: string
  type: 'Collection' | 'Phenotype'
  parentName?: string
}

const CopyCodelistDialog: React.FC<CopyCodelistDialogProps> = ({codelist, onCancel, onClose}) => {
  const {modal} = App.useApp()
  const [selectedDestination, setSelectedDestination] = useState<string>()
  const [copying, setCopying] = useState(false)

  const {data: wsData, loading: loadingWorkspace} = useQuery(SELF, {
    fetchPolicy: 'cache-first',
  })

  const [cloneCodelist] = useMutation(CLONE_CODE_LIST, {
    refetchQueries: [{query: SELF}],
  })

  const destinations = useMemo<DestinationType[]>(() => {
    if (!wsData?.self?.workspace?.collections) return []

    const dests: DestinationType[] = []

    // Add all private codelist collections
    const codelistCollections = wsData.self.workspace.collections.filter(
      (col: Collection) => col.itemType === 'Codelist' && col.visibility === 'Private',
    )

    codelistCollections.forEach((col: Collection) => {
      dests.push({
        id: col.id,
        name: col.name,
        type: 'Collection',
      })
    })

    // Add all phenotypes from private phenotype collections
    const phenotypeCollections = wsData.self.workspace.collections.filter(
      (col: Collection) => col.itemType === 'Phenotype' && col.visibility === 'Private',
    )

    phenotypeCollections.forEach((col: Collection) => {
      col.items.forEach((phenotype: Phenotype) => {
        dests.push({
          id: phenotype.id,
          name: phenotype.name,
          type: 'Phenotype',
          parentName: col.name,
        })
      })
    })

    return dests
  }, [wsData])

  const handleCopy = useCallback(async () => {
    if (!selectedDestination) {
      await modal.error({
        title: 'No destination selected',
        content: 'Please select a destination to copy the codelist to.',
      })
      return
    }

    setCopying(true)

    try {
      await cloneCodelist({
        variables: {
          codelistID: codelist.id,
          position: {
            containerID: selectedDestination,
          },
        },
      })

      onClose()
    } catch (error) {
      await modal.error({
        title: 'Copy failed',
        content: error instanceof Error ? error.message : 'Failed to copy codelist',
      })
    } finally {
      setCopying(false)
    }
  }, [selectedDestination, codelist.id, cloneCodelist, onClose, modal])

  const codelistCollectionDests = destinations.filter((d) => d.type === 'Collection')
  const phenotypeDests = destinations.filter((d) => d.type === 'Phenotype')

  return (
    <Modal
      open
      title="Copy Codelist"
      onCancel={onCancel}
      width={600}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="copy" type="primary" onClick={handleCopy} loading={copying} disabled={!selectedDestination}>
          Copy
        </Button>,
      ]}>
      <Space direction="vertical" size="large" style={{width: '100%'}}>
        <div>
          <Text strong>Source Codelist:</Text>
          <div style={{marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 4}}>
            <Text>{codelist.name}</Text>
          </div>
        </div>

        {loadingWorkspace ? (
          <div style={{textAlign: 'center', padding: 40}}>
            <Spin />
          </div>
        ) : destinations.length === 0 ? (
          <div style={{textAlign: 'center', padding: 40}}>
            <Text type="secondary">
              No writable destinations available. Please create a collection or phenotype first.
            </Text>
          </div>
        ) : (
          <div>
            <Title>Select Destination:</Title>
            <DestinationList>
              <Radio.Group
                value={selectedDestination}
                onChange={(e) => setSelectedDestination(e.target.value)}
                style={{width: '100%'}}>
                <Space direction="vertical" size="small" style={{width: '100%'}}>
                  {codelistCollectionDests.length > 0 && (
                    <>
                      <SectionTitle>Codelist Collections</SectionTitle>
                      {codelistCollectionDests.map((dest) => (
                        <Radio key={dest.id} value={dest.id} style={{width: '100%'}}>
                          <DestinationItem>
                            <FolderOutlined style={{marginRight: 8, color: '#1890ff'}} />
                            {dest.name}
                          </DestinationItem>
                        </Radio>
                      ))}
                    </>
                  )}

                  {phenotypeDests.length > 0 && (
                    <>
                      {codelistCollectionDests.length > 0 && <Divider style={{margin: '12px 0'}} />}
                      <SectionTitle>Phenotypes</SectionTitle>
                      {phenotypeDests.map((dest) => (
                        <Radio key={dest.id} value={dest.id} style={{width: '100%'}}>
                          <DestinationItem>
                            <FileTextOutlined style={{marginRight: 8, color: '#52c41a'}} />
                            {dest.name}
                            {dest.parentName && (
                              <Text type="secondary" style={{marginLeft: 8, fontSize: 12}}>
                                (in {dest.parentName})
                              </Text>
                            )}
                          </DestinationItem>
                        </Radio>
                      ))}
                    </>
                  )}
                </Space>
              </Radio.Group>
            </DestinationList>
          </div>
        )}
      </Space>
    </Modal>
  )
}

export default CopyCodelistDialog

const DestinationList = styled.div`
  max-height: 400px;
  overflow-y: auto;
  padding: 8px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: #fafafa;
`

const SectionTitle = styled.div`
  font-weight: 600;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
  text-transform: uppercase;
  margin-bottom: 8px;
  margin-top: 4px;
`

const DestinationItem = styled.div`
  display: flex;
  align-items: center;
  padding: 4px 0;
`
