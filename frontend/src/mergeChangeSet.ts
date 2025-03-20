import {keys, difference, union} from 'lodash'
import {ChangeSet} from './store/changes'

const mergeChangeSet = (a: ChangeSet, b: ChangeSet): ChangeSet => {
  const ontologies = union(keys(a), keys(b))

  return ontologies.reduce((acc, ontology) => {
    const added = difference(
      union(a[ontology]?.added ?? [], b[ontology]?.added ?? []),
      union(a[ontology]?.removed ?? [], b[ontology]?.removed ?? []),
    )

    const removed = union(
      difference(a[ontology]?.removed ?? [], b[ontology]?.added ?? []),
      difference(b[ontology]?.removed ?? [], a[ontology]?.added ?? []),
    )

    acc[ontology] = {
      added,
      removed,
    }
    return acc
  }, {} as ChangeSet)
}

export default mergeChangeSet
