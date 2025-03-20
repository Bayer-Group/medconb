import {
  calculateFilteredCodes,
  calculateIntermediates,
  filterDifference,
  filterIntersection,
  filterOnlySelected,
  treeInfo,
} from '../src/treeUtils'
import ontology from './sampleOntology'

describe('Tree Utilities', () => {
  describe('Intermediates', () => {
    test.todo('No longer needed')
    // const medicalConcepts = [
    //   {
    //     id: 'x',
    //     codesets: [
    //       {
    //         ontology: {name: 'Onto'},
    //         codes: [
    //           {id: 'f', path: [{id: 'd'}, {id: 'e'}], descendantIDs: []},
    //           {id: 'c', path: [{id: 'a'}], descendantIDs: []},
    //         ],
    //       },
    //     ],
    //   },
    //   {
    //     id: 'y',
    //     codesets: [
    //       {
    //         ontology: {name: 'Onto'},
    //         codes: [
    //           {id: 'f', path: [{id: 'd'}, {id: 'e'}], descendantIDs: []},
    //           {id: 'k', path: [{id: 'h'}, {id: 'i'}], descendantIDs: []},
    //         ],
    //       },
    //     ],
    //   },
    //   {
    //     id: 'z',
    //     codesets: [
    //       {
    //         ontology: {name: 'Onto'},
    //         codes: [
    //           {id: 'f', path: [{id: 'd'}, {id: 'e'}], descendantIDs: []},
    //           {id: 'c', path: [{id: 'a'}], descendantIDs: []},
    //         ],
    //       },
    //     ],
    //   },
    // ]

    // test('calculate intermediate without changeset', () => {
    //   test.todo('No longer needed')
    //   // const changeSet = {
    //   //   x: {},
    //   //   y: {},
    //   //   z: {},
    //   // }

    //   // const [_, __, nodeInfo] = treeInfo(ontology, medicalConcepts)
    //   // const intermediates = calculateIntermediates(medicalConcepts, ontology, changeSet, nodeInfo)

    //   // expect(intermediates['x'].sort()).toEqual(['a', 'd', 'e'].sort())
    //   // expect(intermediates['y'].sort()).toEqual(['h', 'i', 'd', 'e'].sort())
    //   // expect(intermediates['z'].sort()).toEqual(['a', 'd', 'e'].sort())
    // })

    // test('calculate intermediate with added changset', () => {
    //   test.todo('No longer needed')
    //   // const changeSet = {
    //   //   x: {},
    //   //   y: {},
    //   //   z: {
    //   //     Onto: {
    //   //       added: ['k'],
    //   //       removed: [],
    //   //     },
    //   //   },
    //   // }

    //   // const [_, __, nodeInfo] = treeInfo(ontology, medicalConcepts)
    //   // const intermediates = calculateIntermediates(medicalConcepts, ontology, changeSet, nodeInfo)
    //   // expect(intermediates['x'].sort()).toEqual(['a', 'd', 'e'].sort())
    //   // expect(intermediates['y'].sort()).toEqual(['h', 'i', 'd', 'e'].sort())
    //   // expect(intermediates['z'].sort()).toEqual(['a', 'd', 'e', 'h', 'i'].sort())
    // })

    // test('calcualtes intermediates when code from same branch is removed', () => {
    //   test.todo('No longer needed')
    //   // const medicalConcepts2 = [
    //   //   {
    //   //     id: 'x',
    //   //     codesets: [
    //   //       {
    //   //         ontology: {name: 'Onto'},
    //   //         codes: [
    //   //           {id: 'b', path: [{id: 'a'}], descendantIDs: []},
    //   //           {id: 'c', path: [{id: 'a'}], descendantIDs: []},
    //   //         ],
    //   //       },
    //   //     ],
    //   //   },
    //   // ]

    //   // const changeSet = {
    //   //   x: {
    //   //     Onto: {
    //   //       added: [],
    //   //       removed: ['c'],
    //   //     },
    //   //   },
    //   // }

    //   // const [_, __, nodeInfo] = treeInfo(ontology, medicalConcepts2)
    //   // const intermediates = calculateIntermediates(medicalConcepts2, ontology, changeSet, nodeInfo)

    //   // expect(intermediates['x'].sort()).toEqual(['a'].sort())
    // })

    // test('calculate intermediate with removed changset', () => {
    //   test.todo('No longer needed')
    //   // const changeSet = {
    //   //   x: {
    //   //     Onto: {
    //   //       added: [],
    //   //       removed: ['f'],
    //   //     },
    //   //   },
    //   //   y: {
    //   //     Onto: {
    //   //       added: [],
    //   //       removed: ['f'],
    //   //     },
    //   //   },
    //   //   z: {
    //   //     Onto: {
    //   //       added: ['e'],
    //   //       removed: ['f'],
    //   //     },
    //   //   },
    //   // }

    //   // const [_, __, nodeInfo] = treeInfo(ontology, medicalConcepts)
    //   // const intermediates = calculateIntermediates(medicalConcepts, ontology, changeSet, nodeInfo)
    //   // expect(intermediates['x'].sort()).toEqual(['a'].sort())
    //   // expect(intermediates['y'].sort()).toEqual(['h', 'i'].sort())
    //   // expect(intermediates['z'].sort()).toEqual(['a', 'd'].sort())
    // })
  })

  // test('Filter difference', () => {
  //   test.todo('No longer needed')
  //   // const medicalConcepts = [
  //   //   {
  //   //     codesets: [
  //   //       {
  //   //         ontology: {name: 'Onto'},
  //   //         codes: [
  //   //           {id: 'f', path: [{id: 'd'}, {id: 'e'}], descendantIDs: []},
  //   //           {id: 'c', path: [{id: 'a'}], descendantIDs: []},
  //   //         ],
  //   //       },
  //   //     ],
  //   //   },
  //   //   {
  //   //     codesets: [
  //   //       {
  //   //         ontology: {name: 'Onto'},
  //   //         codes: [
  //   //           {id: 'f', path: [{id: 'd'}, {id: 'e'}], descendantIDs: []},
  //   //           {id: 'k', path: [{id: 'h'}, {id: 'i'}], descendantIDs: []},
  //   //         ],
  //   //       },
  //   //     ],
  //   //   },
  //   //   {
  //   //     codesets: [
  //   //       {
  //   //         ontology: {name: 'Onto'},
  //   //         codes: [{id: 'c', path: [{id: 'a'}], descendantIDs: []}],
  //   //       },
  //   //     ],
  //   //   },
  //   // ]
  //   // const value = {
  //   //   x: ['f', 'c'],
  //   //   y: ['f', 'k'],
  //   //   z: ['c'],
  //   // }

  //   // const [_, __, nodeInfo] = treeInfo(ontology, medicalConcepts)

  //   // const filtered = filterDifference(ontology, value, nodeInfo)
  //   // expect(filtered.rootCodes.map((c) => c.id)).toEqual(['a', 'd', 'h'])

  //   // // node b should not be there
  //   // expect(filtered.rootCodes[0].children.map((c) => c.id)).toEqual(['c'])
  //   // expect(filtered.rootCodes[0].numberOfChildren).toEqual(1)

  //   // // node d should not have g as child
  //   // expect(filtered.rootCodes[1].children[0].children[0].children).toEqual([])

  //   // // node h should have node i as child
  //   // expect(filtered.rootCodes[2].children.map((c) => c.id)).toEqual(['i'])

  //   // // node i should only have node k as child
  //   // expect(filtered.rootCodes[2].children[0].children.map((c) => c.id)).toEqual(['k'])
  // })

  // test('Filter intersection', () => {
  //   test.todo('No longer needed')
  //   // const medicalConcepts = [
  //   //   {
  //   //     codesets: [
  //   //       {
  //   //         ontology: {name: 'Onto'},
  //   //         codes: [
  //   //           {id: 'f', path: [{id: 'd'}, {id: 'e'}], descendantIDs: []},
  //   //           {id: 'c', path: [{id: 'a'}], descendantIDs: []},
  //   //         ],
  //   //       },
  //   //     ],
  //   //   },
  //   //   {
  //   //     codesets: [
  //   //       {
  //   //         ontology: {name: 'Onto'},
  //   //         codes: [
  //   //           {id: 'f', path: [{id: 'd'}, {id: 'e'}], descendantIDs: []},
  //   //           {id: 'k', path: [{id: 'h'}, {id: 'i'}], descendantIDs: []},
  //   //         ],
  //   //       },
  //   //     ],
  //   //   },
  //   // ]
  //   // const value = {
  //   //   x: ['f', 'c'],
  //   //   y: ['f', 'k'],
  //   // }

  //   // const [_, __, nodeInfo] = treeInfo(ontology, medicalConcepts)

  //   // const filtered = filterIntersection(ontology, value, nodeInfo)

  //   // expect(filtered.rootCodes.map((c) => c.id)).toEqual(['d'])

  //   // expect(filtered.rootCodes[0].children.map((c) => c.id)).toEqual(['e'])

  //   // expect(filtered.rootCodes[0].children[0].children.map((c) => c.id)).toEqual(['f'])

  //   // // node f should not have children
  //   // expect(filtered.rootCodes[0].children[0].children[0].children).toEqual([])
  //   // expect(filtered.rootCodes[0].children[0].children[0].numberOfChildren).toEqual(0)
  // })

  // test('filterOnlySelected', () => {
  //   test.todo('No longer needed')
  //   // const filtered = filterOnlySelected(ontology, ['q'], ['l', 'p'])
  //   // // console.log(filtered.rootCodes[0].children)
  //   // expect(filtered.rootCodes.map((c) => c.id)).toEqual(['l'])
  //   // expect(filtered.rootCodes[0].children.length).toEqual(1)
  // })

  test('search result filtering', () => {
    const result = [
      {
        id: 3,
        path: [1, 2, 3],
      },
      {
        id: 4,
        path: [1, 2, 3, 4],
      },
      {
        id: 5,
        path: [1, 2, 3, 4, 5],
      },
    ]

    const filtered = calculateFilteredCodes(result)
    console.log(filtered)
    expect(filtered.length).toEqual(1)
    expect(filtered[0].id).toEqual(3)
  })

  test('search result filtering sorted', () => {
    const result = [
      {
        id: 4,
        path: [1, 2, 3, 4],
      },
      {
        id: 5,
        path: [1, 2, 3, 4, 5],
      },
      {
        id: 3,
        path: [1, 2, 3],
      },
    ]

    const filtered = calculateFilteredCodes(result)
    expect(filtered.length).toEqual(1)
    expect(filtered[0].id).toEqual(3)
  })
})
