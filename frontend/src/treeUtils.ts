import {difference, first, flatten, flattenDeep, intersection, last, orderBy, union, uniq, values} from 'lodash'
import {Code, Codelist, CodeTreeData, LocalOntology, Ontology, SearchResult} from '..'
import {ChangeSet, SearchResultState} from './store/workspace'
import {ApolloClient, gql} from '@apollo/client'
import {CODE_PATH_FRAGMENT} from './graphql'
import {db} from './db'

// export type NodeInfo = {
//   [id: string]: {
//     path: string[]
//   }
// }

// // Inverse of intersection
// // or the nodes that are ancestors of nodes that appear in the inverse of intersection
// export const filterDifference = (ontology: Ontology, value: CodeTreeData, nodeInfo: NodeInfo) => {
//   const valuesV = values(value)
//   const includeNodes = difference(union(...valuesV), intersection(...valuesV))
//   const intermediates = flatten(includeNodes.map((c) => nodeInfo[c].path))

//   const filteredNodes = includeNodes.concat(intermediates)

//   const filter = (rc: Code) => filteredNodes.includes(rc.id)

//   const processNode = (node: Code): Code => {
//     const children = node.children || []
//     if (children.length === 0) {
//       return {...node}
//     }
//     const _children = children.filter(filter).map(processNode)
//     return {...node, children: _children, numberOfChildren: _children.length}
//   }

//   return {
//     ...ontology,
//     rootCodes: ontology.rootCodes.filter(filter).map((rc) => processNode(rc)),
//   }
// }

// // only nodes that appear in all the medical concepts
// // or the nodes that are ancestors of the nodes that appear in all the medical concepts
// export const filterIntersection = (ontology: Ontology, value: CodeTreeData, nodeInfo: NodeInfo) => {
//   const includeNodes = intersection(...values(value))
//   const intermediates = flatten(includeNodes.map((c) => nodeInfo[c].path))

//   const filteredNodes = includeNodes.concat(intermediates)

//   const filter = (rc: Code) => filteredNodes.includes(rc.id)

//   const processNode = (node: Code): Code => {
//     const children = node.children || []
//     if (children.length === 0) {
//       return {...node}
//     }
//     const _children = children.filter(filter).map(processNode)
//     return {...node, children: _children, numberOfChildren: _children.length}
//   }

//   return {
//     ...ontology,
//     rootCodes: ontology.rootCodes.filter(filter).map((rc) => processNode(rc)),
//   }
// }

// // only nodes that appear in at least one of the medical concepts
// // or the nodes that are ancestors of nodes that appear in at least one of the medical concepts
// export const filterOnlySelected = (ontology: Ontology, allCodes: Code['id'][], allIntermediates: Code['id'][]) => {
//   const processNode = (node: Code): Code => {
//     const children = node.children || []
//     if (children.length === 0) {
//       return {...node}
//     }
//     const _children = children
//       .filter((c) => allIntermediates.includes(c.id) || allCodes.includes(c.id))
//       .map(processNode)
//     return {...node, children: _children}
//   }

//   return {
//     ...ontology,
//     rootCodes: ontology.rootCodes
//       .filter((rc) => allIntermediates.includes(rc.id) || allCodes.includes(rc.id))
//       .map((rc) => processNode(rc)),
//   }
// }

// export const replaceNode = (ontology: Ontology, node: Code) => {
//   const process = (_node: Code): Code => {
//     if (node.id === _node.id) return node
//     return {..._node, children: _node.children?.map(process)}
//   }

//   return {
//     ...ontology,
//     rootCodes: ontology.rootCodes.map(process),
//   }
// }

// export const dfs = (node: Code, lastNodes: string[], firstNodes: string[], nodeInfo: NodeInfo) => {
//   const children = node.children ?? []

//   if (children.length > 0) {
//     lastNodes.push(last(children)!.id)
//     firstNodes.push(first(children)!.id)

//     const allIds = children.map((n) => n.id)

//     children.forEach((code) => {
//       nodeInfo[code.id] = {
//         path: code.path.map((p) => p.id),
//       }
//     })
//   }
//   for (const child of children) {
//     dfs(child, lastNodes, firstNodes, nodeInfo)
//   }
// }

// export const treeInfo = (ontology: Ontology, concepts?: Codelist[]): [string[], string[], NodeInfo] => {
//   const lastNodes: string[] = [last(ontology.rootCodes)!.id]
//   const firstNodes: string[] = [first(ontology.rootCodes)!.id]

//   const nodeInfo: NodeInfo = {}

//   ontology.rootCodes.forEach((code) => {
//     nodeInfo[code.id] = {
//       path: code.path.map((p) => p.id),
//     }
//     dfs(code, lastNodes, firstNodes, nodeInfo)
//   })
//   ;(concepts ?? []).forEach((concept) => {
//     concept.codesets
//       .filter((cs) => cs.ontology.name === ontology.name)
//       .forEach((cs) => {
//         cs.codes.forEach((code) => {
//           nodeInfo[code.id] = {
//             path: code.path.map((p) => p.id),
//           }
//         })
//       })
//   })

//   return [uniq(lastNodes), uniq(firstNodes), nodeInfo]
// }

// export const calculateIntermediatesAsync = async (
//   concepts: Codelist[],
//   ontology: LocalOntology,
//   changeSet: {
//     [mcId: string]: ChangeSet
//   },
// ) => {
//   console.log('calculateIntermediatesAsync')
//   const codes = await concepts.reduce(async (initial, c) => {
//     const acc = await initial
//     const transientAdded = (changeSet[c.id] ?? {})[ontology.name]?.added ?? []
//     const transientremoved = (changeSet[c.id] ?? {})[ontology.name]?.removed ?? []

//     let finalCodeList = flattenDeep(
//       c.codesets.filter((cs) => cs.ontology.name === ontology.name).map((cs) => cs.codes.map((code) => code.id)),
//     )

//     finalCodeList = difference(finalCodeList.concat(transientAdded), transientremoved).map((c) => Number(c))
//     // console.time('BULK GET')
//     // const codes = await db.codes.bulkGet(finalCodeList)
//     // console.timeEnd('BULK GET')

//     // console.time('BULK GETFILTER')
//     // const codes = await db.codes.bulkGet(finalCodeList.map((c) => Number(c)))
//     const allCodes = await db.codes.where({ontology_id: ontology.name}).toArray()
//     const codes = allCodes.filter(({id}) => finalCodeList.includes(id))
//     // console.timeEnd('BULK GETFILTER')

//     acc[String(c.id)] = uniq(flatten(codes.map((c) => c.path)))
//     return acc
//   }, Promise.resolve({} as {[key: string]: string[]}))
//   return codes
// }

// export const calculateIntermediates = (
//   concepts: Codelist[],
//   ontology: Ontology,
//   changeSet: {
//     [mcId: string]: ChangeSet
//   },
//   client: ApolloClient<object>,
// ) => {
//   const codes = concepts.reduce((acc, c) => {
//     const transientAdded = (changeSet[c.id] ?? {})[ontology.name]?.added ?? []
//     const transientremoved = (changeSet[c.id] ?? {})[ontology.name]?.removed ?? []

//     let finalCodeList = flattenDeep(
//       c.codesets.filter((cs) => cs.ontology.name === ontology.name).map((cs) => cs.codes.map((code) => code.id)),
//     )

//     finalCodeList = difference(finalCodeList.concat(transientAdded), transientremoved)

//     acc[String(c.id)] = flatten(
//       finalCodeList.map((codeId) => {
//         const code: Pick<Code, 'path'> | null = client.readFragment({
//           id: `Code:${codeId}`,
//           fragment: CODE_PATH_FRAGMENT,
//         })
//         if (!code) {
//           //should not happen
//           return []
//           // throw new Error(`Code ${codeId} not found in cache!`)
//         }
//         return code.path.map((p) => p.id)
//       }),
//     )

//     return acc
//   }, {} as CodeTreeData)
//   return codes
// }

export const calculateFilteredCodes = (codes: SearchResultState[]): SearchResultState[] => {
  const visibleSearchResult: SearchResultState[] = []
  const visibleCodes: string[] = []
  orderBy(codes, (c) => c.path.length, 'asc').forEach((code) => {
    const path = code.path.slice(0, -1)

    if (intersection(visibleCodes, path).length === 0) {
      visibleSearchResult.push(code)
      visibleCodes.push(code.id)
    }
  })

  return visibleSearchResult
}
