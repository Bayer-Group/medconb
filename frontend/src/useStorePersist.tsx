import {useApolloClient} from '@apollo/client'
import {isNil, keys} from 'lodash'
import {useRef} from 'react'
import {useDispatch, useSelector} from 'react-redux'
// import useInterval from 'use-interval'
import {FETCH_CODE_LIST, STORE_TRANSIENT_CHANGES} from './graphql'
import {RootState} from './store'
import {SaveState, clearChangeSet, clearQueue, updateCodelistSaveState, startSync} from './store/changes'
import useChangeSet from './useChangeSet'
import {useInterval} from './useInterval'
import {updateTransient} from './store/workspace'
import {Codelist} from '..'
import {changeSetCodelistIdSelector} from './store/selectors'

type Change = {ontologyID: string; added: string[]; removed: string[]}
const useStorePersist = (interval: number) => {
  const working = useRef(false)
  const workingQueue = useRef<string[]>()
  const changeSet = useChangeSet()
  const client = useApolloClient()
  const dispatch = useDispatch()

  const saveInProgress = useSelector((state: RootState) => state.ui.saveInProgress)
  const queue = useSelector((state: RootState) => changeSetCodelistIdSelector(state))

  useInterval(async () => {
    console.log('[Sync] Periodic sync start')
    if (working.current === true) {
      console.log('[Sync] Already busy')
      return
    }

    if (!workingQueue.current) {
      workingQueue.current = queue
    }

    working.current = true
    dispatch(startSync())

    const changesSize = workingQueue.current.length

    if (changesSize == 0) {
      console.log('[Sync] No changes to sync')
      console.log('[Sync] Exiting')
      working.current = false
      workingQueue.current = undefined
      dispatch(clearQueue())
      return
    }

    if (saveInProgress) {
      console.log('[Sync] Save in progress')
      console.log('[Sync] Exiting')
      working.current = false
      workingQueue.current = undefined
      dispatch(clearQueue())
      return
    }

    console.log(`[Sync] ${changesSize} changes to be sync`)
    for (const codelistID of workingQueue.current) {
      const changes: Change[] = []
      for (const ontology of keys(changeSet[codelistID])) {
        if (
          changeSet[codelistID][ontology].added.length === 0 &&
          changeSet[codelistID][ontology].removed.length === 0
        ) {
          continue
        }

        changes.push({
          ontologyID: ontology,
          added: changeSet[codelistID][ontology].added ?? [],
          removed: changeSet[codelistID][ontology].removed ?? [],
        })
      }

      try {
        dispatch(updateCodelistSaveState({codelistID, state: SaveState.SAVING}))
        const before = await client.query({
          query: FETCH_CODE_LIST,
          variables: {
            codelistID,
          },
          fetchPolicy: 'network-only',
        })

        const sanitizedChanges = sanitize(before.data.codelist, changes)

        const res = await client.mutate({
          mutation: STORE_TRANSIENT_CHANGES,
          variables: {
            codelistID,
            changes: sanitizedChanges,
          },
        })
        dispatch(updateTransient({codelist: res.data.storeTransientChanges}))
        dispatch(clearChangeSet(codelistID))
      } catch (error) {
        console.log(error)
      } finally {
        dispatch(updateCodelistSaveState({codelistID, state: SaveState.SAVED}))
      }
    }
    console.log('[Sync] Sync complete')
    console.log('[Sync] Exiting')
    working.current = false
    workingQueue.current = undefined
    dispatch(clearQueue())
  }, interval)
}

export default useStorePersist

export const sanitize = (codelist: Codelist, changes: Change[]): Change[] => {
  const index = codelist.codesets.reduce((a, c) => {
    a[c.ontology.name] = c.codes.map((c) => c.id)
    return a
  }, {} as {[ontologyID: string]: string[]})
  return changes.map((change) => {
    const cs = index[change.ontologyID]

    const added = isNil(cs) ? change.added : (change.added ?? []).filter((code) => !cs.includes(code))
    const removed = isNil(cs) ? [] : (change.removed ?? []).filter((code) => cs.includes(code))

    return {
      ontologyID: change.ontologyID,
      added,
      removed,
    }
  })
}
