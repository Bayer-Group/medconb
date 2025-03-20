import flatOntology from './sampleFlatOntology'
import filterOntology from '../src/ontologyFilter'
/*
                1                                     14
      /         |         \                  /         |
     2          6          10               15        19
  /  |  \    /  |  \    /  |  \         /   |   \    /
 3   4   5  7   8   9  11  12  13      16   17  18  20
*/
describe('Ontology tree filter', () => {
  describe('Show only selected', () => {
    test('All anscestor open', () => {
      const value = {
        mc1: new Set([9, 13, 20]),
      }

      const filtered = filterOntology(flatOntology, {
        value,
        openNodes: [1, 6, 10, 14, 19],
        filters: {showOnlySelected: true},
        // intermediates: new Set([1, 6, 10, 14, 19]),
      })
      // 1, 6, 9, 10, 13, 14, 19, 20
      expect(filtered.length).toEqual(8)
      expect(filtered.map((c) => c.id)).toEqual([1, 6, 9, 10, 13, 14, 19, 20])
    })

    test('All anscestor closed', () => {
      const value = {
        mc1: new Set([9, 13, 20]),
      }

      const filtered = filterOntology(flatOntology, {
        value,
        openNodes: [],
        filters: {showOnlySelected: true},
        // intermediates: new Set([1, 6, 10, 14, 19]),
      })
      // 1, 14
      expect(filtered.length).toEqual(2)
      expect(filtered.map((c) => c.id)).toEqual([1, 14])
    })

    test('Show only selected with a node with children', () => {
      const value = {
        mc1: new Set([9, 13, 15]),
      }

      const filtered = filterOntology(flatOntology, {
        value,
        openNodes: [1, 6, 10, 14],
        filters: {showOnlySelected: true},
        intermediates: new Set([1, 6, 10, 14]),
      })
      // 1, 6, 9, 10, 13, 14, 15
      expect(filtered.length).toEqual(7)
      expect(filtered.map((c) => c.id)).toEqual([1, 6, 9, 10, 13, 14, 15])
    })

    test('Show only selected with both parent and child', () => {
      const value = {
        mc1: new Set([9, 13, 15, 20]),
      }

      const filtered = filterOntology(flatOntology, {
        value,
        openNodes: [1, 6, 10, 14, 19],
        intermediates: new Set([1, 6, 10, 14, 19]),
        filters: {showOnlySelected: true},
      })
      // 1, 6, 9, 10, 13, 14, 15, 19, 20
      expect(filtered.length).toEqual(9)
      expect(filtered.map((c) => c.id)).toEqual([1, 6, 9, 10, 13, 14, 15, 19, 20])
    })
  })

  test('Show only overlapping', () => {
    const value = {
      mc1: new Set([9, 13, 20]),
      mc2: new Set([9, 11, 16]),
    }

    const filtered = filterOntology(flatOntology, {
      value,
      intermediates: new Set([1, 6, 10, 14, 15, 19]),
      openNodes: [1, 6, 10],
      filters: {showOnlyOverlapping: true},
    })
    // 1, 6, 9
    expect(filtered.length).toEqual(3)
    expect(filtered.map((c) => c.id)).toEqual([1, 6, 9])
  })

  test('Show only differing', () => {
    const value = {
      mc1: new Set([9, 13, 20]),
      mc2: new Set([9, 11, 16]),
    }

    const filtered = filterOntology(flatOntology, {
      value,
      openNodes: [1, 6, 10, 14, 15, 19],
      intermediates: new Set([]),
      filters: {showDiffering: true},
    })
    // 1, 10, 11, 13, 14, 15, 16, 19, 20
    expect(filtered.length).toEqual(9)

    expect(filtered.map((c) => c.id)).toEqual([1, 10, 11, 13, 14, 15, 16, 19, 20])
  })
})
