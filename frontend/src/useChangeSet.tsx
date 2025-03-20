import {keys, union} from 'lodash'
import {useMemo} from 'react'
import {useSelector} from 'react-redux'
import mergeChangeSet from './mergeChangeSet'
import {RootState} from './store'
import {ChangeSet} from './store/changes'

// cleanup change sets before worked upon
const useChangeSet = () => {
  const transient = useSelector((state: RootState) => state.workspace.transientChangeSet)
  const changeSet = useSelector((state: RootState) => state.changes.changeSet)
  const tempChangeSet = useSelector((state: RootState) => state.changes.tempChangeSet)

  return useMemo(() => {
    const finalChangeSet = union(keys(changeSet), keys(tempChangeSet)).reduce(
      (a, mcID) => {
        a[mcID] = mergeChangeSet(changeSet[mcID] ?? {}, tempChangeSet[mcID] ?? {})
        return a
      },
      {} as {
        [mcId: string]: ChangeSet
      },
    )

    const t = union(keys(transient), keys(finalChangeSet)).reduce(
      (a, mcID) => {
        a[mcID] = mergeChangeSet(transient[mcID] ?? {}, finalChangeSet[mcID] ?? {})
        return a
      },
      {} as {
        [mcId: string]: ChangeSet
      },
    )
    // filter empty changeset
    return keys(t).reduce(
      (a, c) => {
        const hasChanges = keys(t[c]).reduce((d, e) => {
          return d || t[c][e].added.length > 0 || t[c][e].removed.length > 0
        }, false)

        if (hasChanges) {
          a[c] = t[c]
        }

        return a
      },
      {} as {
        [mcId: string]: ChangeSet
      },
    )
  }, [transient, changeSet, tempChangeSet])
}

export default useChangeSet
