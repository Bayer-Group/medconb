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

  if (!data) return <Skeleton />

  return <>{data.users[0].name}</>
}

export default UserDisplay
