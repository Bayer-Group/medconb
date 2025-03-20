import slice, {updateOntologyNode} from '../../src/store/ui'
import ontology from '../sampleOntology'

describe('UI Redux store', () => {
  describe('Ontology tracking', () => {
    test.todo('No longer needed')
    // test('Updates nodes correctly', () => {
    //   const initialState = {
    //     sideBarOpen: true,
    //     openWorkspaceMenu: [],
    //     renamingConcepts: [],
    //     renamingCollections: [],
    //     ontologyTreeOpenState: {},
    //     ontologies: {
    //       Onto: ontology,
    //     },
    //   }
    //   const newState = slice.reducer(
    //     initialState,
    //     updateOntologyNode({
    //       ontology: 'Onto',
    //       node: {
    //         id: 'o',
    //         code: 'o',
    //         description: 'desc o',
    //         path: [{id: 'l'}, {id: 'm'}],
    //         numberOfChildren: 2,
    //         children: [
    //           {
    //             id: 'p',
    //             code: 'p',
    //             description: 'desc p',
    //             path: [{id: 'l'}, {id: 'm'}, {id: 'o'}],
    //             numberOfChildren: 0,
    //           },
    //           {
    //             id: 'q',
    //             code: 'q',
    //             description: 'desc q',
    //             path: [{id: 'l'}, {id: 'm'}, {id: 'o'}],
    //             numberOfChildren: 0,
    //           },
    //         ],
    //       },
    //     }),
    //   )
    //   const newNodeO = newState.ontologies['Onto'].rootCodes[3].children[0].children[1]
    //   expect(newNodeO.children.length).toEqual(2)
    //   expect(newNodeO.children.map((c) => c.id)).toEqual(['p', 'q'])
    //   expect(newNodeO.numberOfChildren).toEqual(2)
    // })
  })
})
