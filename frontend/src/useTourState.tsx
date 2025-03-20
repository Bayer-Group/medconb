import {useMutation, useQuery} from '@apollo/client'
import {SELF, UPDATE_PROFILE} from './graphql'

const useTourState = () => {
  const {data} = useQuery(SELF, {
    fetchPolicy: 'cache-first',
  })
  const [updateTourState] = useMutation(UPDATE_PROFILE)

  return {
    tutorialState: data?.self?.tutorialState === undefined ? undefined : JSON.parse(data?.self?.tutorialState),
    updateTourState: async (newState: any) => {
      await updateTourState({
        variables: {
          tutorialState: JSON.stringify(newState),
        },
        refetchQueries: [SELF],
      })
    },
  }
}

export default useTourState
