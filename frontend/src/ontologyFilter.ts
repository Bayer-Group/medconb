import {flatten, keys, values} from 'lodash'
import {CodeTreeDataSet, IntermediateType, LocalCode} from '..'
import descendantIntersection from './descendantIntersection'
import {PaneFilter, SearchResultState} from './store/workspace'
import {calculateFilteredCodes} from './treeUtils'

type Opts = {
  value: CodeTreeDataSet
  filters: PaneFilter
  openNodes: number[]
  searchFilter?: number[]
  searchResults: SearchResultState[] | null
}
export type TreeNode = LocalCode & {
  i: {[mcId: string]: IntermediateType} /* Intermediate */
  fd: boolean /* First descendant */
}
const filterOntology = (codes: LocalCode[], opts: Opts): TreeNode[] => {
  console.time(`filterOntology`)
  const filtered: TreeNode[] = []
  const valuesV = values(opts.value)

  const filteredBySearch = opts.searchResults ? calculateFilteredCodes(opts.searchResults) : null
  const filteredIds = filteredBySearch ? new Set(filteredBySearch.map((c) => Number(c.id))) : null
  const filteredIntermediates = filteredBySearch
    ? new Set(flatten(filteredBySearch.map((c) => c.path.slice(0, -1).map((p) => Number(p)))))
    : null

  const selectedCodes = valuesV.reduce((a, c) => a.union(c), new Set())

  const selectedIntermediates = new Set(
    flatten(codes.filter(({id}) => selectedCodes.has(id)).map(({path}) => path.slice(0, -1))),
  )

  const overLapping = valuesV.reduce((a, c) => a.intersection(c), valuesV[0]) ?? new Set()
  const overLappingIntermediates = new Set(
    flatten(codes.filter(({id}) => overLapping.has(id)).map(({path}) => path.slice(0, -1))),
  )

  const differing = selectedCodes.difference(overLapping)
  const differingIntermediates = new Set(
    flatten(codes.filter(({id}) => differing.has(id)).map(({path}) => path.slice(0, -1))),
  )

  // const codelistWiseIntermediates = keys(opts.value).reduce((a, c) => {
  //   a[c] = new Set(flatten(codes.filter(({id}) => opts.value[c].has(id)).map(({path}) => path.slice(0, -1))))
  //   return a
  // }, {} as {[mcId: string]: Set<number>})

  console.time(`filterOntologyLoop`)
  let lastDepth = 0
  for (let i = 0; i < codes.length; i++) {
    let add = true
    const path = codes[i].path.slice(0, -1)
    if (
      filteredBySearch !== null &&
      filteredIntermediates !== null &&
      filteredIds !== null &&
      !filteredIds.has(codes[i].id) &&
      !filteredIntermediates.has(codes[i].id)
    ) {
      i += codes[i].last_descendant_id - codes[i].id
      continue
    }

    if (opts.filters.showOnlySelected) {
      if (!(selectedCodes.has(codes[i].id) || selectedIntermediates.has(codes[i].id))) {
        add = false
        i += codes[i].last_descendant_id - codes[i].id
        // continue
      }
    }
    if (opts.filters.showOnlyOverlapping) {
      if (!(overLapping.has(codes[i].id) || overLappingIntermediates.has(codes[i].id))) {
        add = false
        i += codes[i].last_descendant_id - codes[i].id
      }
    }
    if (opts.filters.showDiffering) {
      if (!(differing.has(codes[i].id) || differingIntermediates.has(codes[i].id))) {
        add = false
        i += codes[i].last_descendant_id - codes[i].id
      }
    }

    if (add) {
      filtered.push({
        ...codes[i],
        fd: path.length > lastDepth,
        i: keys(opts.value).reduce((a, c) => {
          a[c] = descendantIntersection(codes[i], opts.value[c])
          return a
        }, {} as {[mcId: string]: IntermediateType}),
      })
      lastDepth = path.length
    }
    if (!opts.openNodes.includes(codes[i].id)) {
      i += codes[i].last_descendant_id - codes[i].id
    }
  }
  console.timeEnd(`filterOntologyLoop`)
  console.timeEnd(`filterOntology`)

  return filtered
}

export default filterOntology
