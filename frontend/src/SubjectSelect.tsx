import {useQuery} from '@apollo/client'
import {Select} from 'antd'
import {find} from 'lodash'
import React, {useMemo} from 'react'
import {User} from '..'
import {USERS} from './graphql'

export type SubjectType = 'user' | 'group'

type UserSelectProps = {
  onUserSelect: (user: User | null) => void
  value?: User['id']
  filter?: (user: User) => boolean
  type: SubjectType
}

export const EVERYONE = '00ACCE55-0400-A110-1337-000000000000'

const SubjectSelect: React.FC<UserSelectProps> = ({onUserSelect, value, filter, type}) => {
  const {loading, error, data} = useQuery(USERS, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {},
  })

  const users = useMemo(() => {
    if (!data) return []
    if (type == 'group') {
      return [{value: EVERYONE, label: 'Everyone'}]
    }
    let _users = data.users as User[]
    if (filter) {
      _users = _users.filter(filter)
    }
    return _users.map((d) => ({value: d.id, label: d.name}))
  }, [data, filter])

  const handleSubjectSelect = (val: string) => {
    if (val === null) {
      onUserSelect(val)
      return
    }
    if (val === EVERYONE) {
      onUserSelect({id: EVERYONE, externalId: 'Everyone', name: 'Everyone'})
      return
    }
    onUserSelect(find((data ?? ({} as any)).users, {id: val}))
  }

  return (
    <Select
      showSearch
      filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
      size="small"
      options={users}
      onChange={handleSubjectSelect}
      allowClear
      style={{width: 'auto', flex: 1}}
      loading={loading}
      value={value}
    />
  )
}

export default SubjectSelect
