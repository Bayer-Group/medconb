import {useQuery} from '@apollo/client'
import {USERS} from './graphql'
import {Skeleton} from 'antd'

const UserDisplay: React.FC<{userId: string}> = ({userId}) => {
  const {data} = useQuery(USERS, {
    variables: {
      ids: [userId],
    },
    fetchPolicy: 'cache-first',
  })

  if (!data) return <Skeleton /> // still loading

  return data.users?.length > 0 && data.users[0].name ? <>{data.users[0].name}</> : <i>Deleted User</i>
}

export default UserDisplay
