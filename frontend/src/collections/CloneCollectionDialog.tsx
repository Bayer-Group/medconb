import React, {useCallback, useState} from 'react'
import {App, Button, Modal, Space, Typography} from 'antd'
import {Collection} from '../..'
import {CLONE_COLLECTION, SELF} from '../graphql'
import {useMutation} from '@apollo/client'

const {Text} = Typography

type CloneCollectionDialogProps = {
  collection: Collection
  onCancel: () => void
  onClose: () => void
}

const CloneCollectionDialog: React.FC<CloneCollectionDialogProps> = ({collection, onCancel, onClose}) => {
  const {modal} = App.useApp()
  const [cloning, setCloning] = useState(false)
  const [cloneCollection] = useMutation(CLONE_COLLECTION, {
    refetchQueries: [{query: SELF}],
    awaitRefetchQueries: true,
  })

  const handleClone = useCallback(async () => {
    setCloning(true)

    try {
      await cloneCollection({
        variables: {
          collectionID: collection.id,
        },
      })

      onClose()
    } catch (error) {
      await modal.error({
        title: 'Clone failed',
        content: error instanceof Error ? error.message : 'Failed to clone collection',
      })
    } finally {
      setCloning(false)
    }
  }, [collection.id, cloneCollection, onClose, modal])

  return (
    <Modal
      open
      title="Clone Collection to Workspace"
      onCancel={onCancel}
      width={500}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="copy" type="primary" onClick={handleClone} loading={cloning}>
          Clone to My Workspace
        </Button>,
      ]}>
      <Space direction="vertical" size="large" style={{width: '100%'}}>
        <div>
          <Text>
            This will clone <Text strong>"{collection.name}"</Text>, including all{' '}
            <Text strong>
              {collection.items?.length ?? 0} {collection.itemType === 'Codelist' ? 'codelist(s)' : 'phenotype(s)'}
            </Text>{' '}
            to your workspace.
          </Text>
        </div>
        <div>
          <Text type="secondary" style={{fontSize: 12}}>
            Collection Type: {collection.itemType}
          </Text>
        </div>
      </Space>
    </Modal>
  )
}

export default CloneCollectionDialog
