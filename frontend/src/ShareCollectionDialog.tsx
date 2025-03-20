import React, {useCallback, useMemo, useState} from 'react'
import {App, Button, Col, Divider, Empty, Modal, Radio, Row, Space, Spin} from 'antd'
import Icon, {ExclamationCircleFilled, GlobalOutlined, TeamOutlined, UserOutlined} from '@ant-design/icons'
import {Title} from './scratch'
import SubjectSelect, {EVERYONE, SubjectType} from './SubjectSelect'
import {useMutation, useQuery} from '@apollo/client'
import {FETCH_COLLECTION, SELF, SHARE_COLLECTION, UPDATE_COLLECTION, USERS} from './graphql'
import {Collection, User} from '..'
import {styled} from '@linaria/react'
import {union} from 'lodash'
import type {RadioChangeEvent} from 'antd'
import {CloseIcon} from './customIcons'

type ShareCollectionDialogProps = {
  onCancel: () => void
  onClose: () => void
  collectionID: Collection['id']
}

const ShareCollectionDialog: React.FC<ShareCollectionDialogProps> = ({onCancel, collectionID}) => {
  const [user, setUser] = useState<User | null>(null)
  const [newOwner, setNewOwner] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [transferring, setTransferring] = useState(false)
  const [transferOwnershipOpen, setTransferOwnershipOpen] = useState(false)
  const {modal} = App.useApp()
  const {
    loading: colLoading,
    error: colError,
    data: colData,
  } = useQuery(FETCH_COLLECTION, {
    fetchPolicy: 'network-only',
    variables: {
      collectionID,
    },
  })
  const [shareCollection] = useMutation(SHARE_COLLECTION, {
    refetchQueries: [{query: FETCH_COLLECTION, variables: {collectionID}}],
  })
  const [updateCollection] = useMutation(UPDATE_COLLECTION)

  const doShare = async () => {
    if (!user) {
      return
    }
    setLoading(true)
    await shareCollection({
      variables: {
        collectionID,
        readerIds: union(colData.collection.sharedWith, [user.id]),
      },
      awaitRefetchQueries: true,
    })
    setLoading(false)
    setUser(null)
  }

  const handleTransferOwnership = () => {
    if (newOwner) {
      modal.confirm({
        title: 'Are you sure?',
        icon: <ExclamationCircleFilled />,
        content:
          'Once the transfer is completed, you will no longer have editing permissions over the collection or its items.',
        onOk: async () => {
          setTransferring(true)
          await updateCollection({
            variables: {
              collectionID,
              ownerID: newOwner.id,
            },
            refetchQueries: [SELF],
            awaitRefetchQueries: true,
          })
          setTransferring(false)
          setNewOwner(null)
        },
      })
      return
    }
  }

  const handleShare = useCallback(async () => {
    if (user) {
      if (user.id === EVERYONE) {
        modal.confirm({
          title: 'Are you sure?',
          icon: <ExclamationCircleFilled />,
          content: 'This will be public and locked for editing',
          onOk: doShare,
        })
        return
      }

      await doShare()
    }
  }, [user, colData])

  const handleUnshare = useCallback(
    async (userId: string) => {
      await shareCollection({
        variables: {
          collectionID,
          readerIds: colData.collection.sharedWith.filter((r: string) => r !== userId),
        },
      })
    },
    [colData],
  )
  const [subjectType, setSubjectType] = useState<SubjectType>('user')

  const onSubjectTypeChange = (e: RadioChangeEvent) => {
    setSubjectType(e.target.value)
  }

  return (
    <Modal open footer={false} onCancel={onCancel} closeIcon={<Icon component={() => <CloseIcon />} />}>
      {!colData && <Spin size="small" />}
      {!!colData && (
        <>
          <Title style={{marginBottom: 20}}>{`Share "${colData.collection.name}"`}</Title>
          <Radio.Group onChange={onSubjectTypeChange} value={subjectType}>
            <Radio value={'user'}>
              <Space>
                <UserOutlined />
                User
              </Space>
            </Radio>
            <Radio value={'group'}>
              <Space>
                <TeamOutlined />
                Group
              </Space>
            </Radio>
          </Radio.Group>
          <Space.Compact block size="small" style={{marginTop: 8}}>
            <SubjectSelect
              onUserSelect={setUser}
              value={user?.id}
              type={subjectType}
              filter={(user) => !colData.collection.sharedWith.includes(user.id)}
            />
            <Button size="small" disabled={!user || loading} onClick={handleShare} type="primary" loading={loading}>
              Share Collection
            </Button>
          </Space.Compact>
          <Divider />

          <AccessListContainer>
            <AccessList onRemove={handleUnshare} value={colData.collection.sharedWith} />
          </AccessListContainer>
          <Button danger ghost size="small" onClick={() => setTransferOwnershipOpen(true)}>
            Transfer Ownership
          </Button>
          {transferOwnershipOpen && (
            <div>
              <p>
                This feature allows you to transfer the ownership of a particular collection, along with all the items
                it contains, to another user. Once the transfer is completed, you will no longer have editing
                permissions over the collection or its items. These permissions will be granted to the selected user to
                whom you've transferred ownership.
              </p>
              <Space.Compact block size="small" style={{marginTop: 8}}>
                <SubjectSelect
                  onUserSelect={setNewOwner}
                  value={newOwner?.id}
                  type={'user'}
                  filter={(user) => user.id != colData.collection.ownerID}
                />
                <Button
                  size="small"
                  danger
                  disabled={!newOwner || transferring}
                  onClick={handleTransferOwnership}
                  type="primary"
                  loading={transferring}>
                  Transfer
                </Button>
              </Space.Compact>
            </div>
          )}
        </>
      )}
    </Modal>
  )
}

export default ShareCollectionDialog

type AccessListProps = {
  value?: User['id'][]
  onRemove: (userId: string) => void
}
const AccessList: React.FC<AccessListProps> = ({onRemove, value = []}) => {
  const {loading, error, data} = useQuery(USERS, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {},
  })

  const users = useMemo(() => {
    if (!data) return []
    return (data.users as User[]).filter((u) => value.includes(u.id))
    // .map((d) => ({value: d.id, label: d.name}))
    // if(value.includes(EVERYONE.toLowerCase())) {
    //   _users.unshift({})
    // }
    // return _users
  }, [data, value])

  if (users.length === 0 && !value.includes(EVERYONE.toLowerCase())) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Collection not shared with anyone" />
  }

  return (
    <>
      <Title>Shared with</Title>
      {value.includes(EVERYONE.toLowerCase()) && (
        <UserRow key={EVERYONE} gutter={16}>
          <Col span={12}>
            <Space>
              <GlobalOutlined />
              Everyone
            </Space>
          </Col>
        </UserRow>
      )}
      {users.map((u) => (
        <UserRow key={u.id} gutter={16}>
          <Col span={12}>
            <Space>
              <UserOutlined />
              {u.name} ({u.externalId})
            </Space>
          </Col>
          <Col span={6} offset={6}>
            <Button type="link" size="small" onClick={() => onRemove(u.id)}>
              Remove
            </Button>
          </Col>
        </UserRow>
      ))}
    </>
  )
}

const AccessListContainer = styled.div`
  margin-top: 20px;
`

const UserRow = styled(Row)`
  margin-bottom: 10px;
  margin-top: 10px;
`
