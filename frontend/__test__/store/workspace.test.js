import slice, {addCodelist, closeCodelist, openCodelist, toggleCodelistVisibility} from '../../src/store/workspace'

describe('Opening medical concepts', () => {
  test('Opens first medical concept correctly', () => {
    const initialState = {
      openCodelists: [],
      pathById: {},
      panes: [],
      indicators: {},
      indicatorQueue: [1, 2, 3],
      colorQueue: ['a', 'b'],
      changeSet: {},
      loadingConcept: 1,
    }
    const codelist = {
      id: '1',
      name: 'MC1',
      type: 'ATOMIC',
      codesets: [],
      containerHierarchy: [],
    }
    expect(slice.reducer(initialState, openCodelist({collection: 3, codelistId: '1', path: [], mode: 0}))).toEqual({
      openCodelists: [
        {
          id: '1',
          mode: 0,
          // containerHierarchy: [],
        },
      ],
      indicators: {
        1: {
          animal: 1,
          color: 'a',
        },
      },
      indicatorQueue: [2, 3],
      colorQueue: ['b'],
      isComparisionMode: false,
      panes: [],
      pathById: {
        1: [],
      },
      changeSet: {},
      loadingConcept: 1,
    })
  })

  test('opens additional medical concept correctly when in comparision mode', () => {
    const initialState = {
      isComparisionMode: true,
      panes: [],
      pathById: {
        1: [],
      },
      openCodelists: [
        {
          id: '1',
          mode: 0,
          // containerHierarchy: [],
        },
      ],
      indicators: {
        1: {
          animal: 1,
          color: 'a',
        },
      },
      indicatorQueue: [2, 3],
      colorQueue: ['b'],
      changeSet: {},
      loadingConcept: 2,
    }

    const codelist = {
      id: '2',
      name: 'MC1',
      type: 'ATOMIC',
      codesets: [],
      // containerHierarchy: [],
    }

    expect(slice.reducer(initialState, addCodelist({collection: 2, codelistId: '2', path: [], mode: 0}))).toEqual({
      isComparisionMode: true,
      panes: [],
      pathById: {
        1: [],
        2: [],
      },
      openCodelists: [
        {
          id: '1',
          mode: 0,
          // containerHierarchy: [],
        },
        {
          id: '2',
          mode: 0,
          // containerHierarchy: [],
        },
      ],
      indicators: {
        1: {
          animal: 1,
          color: 'a',
        },
        2: {
          animal: 2,
          color: 'b',
        },
      },
      indicatorQueue: [3],
      colorQueue: [],
      changeSet: {},
      loadingConcept: 2,
    })
  })

  test('closes MC correctly when in comparision mode', () => {
    const initialState = {
      isComparisionMode: true,
      panes: [],
      pathById: {
        1: [],
        2: [],
      },
      openCodelists: [
        {
          id: '1',
          mode: 0,
          // containerHierarchy: [],
        },
        {
          id: '2',
          mode: 0,
          // containerHierarchy: [],
        },
      ],
      indicators: {
        1: {
          animal: 1,
          color: 'a',
        },
        2: {
          animal: 2,
          color: 'b',
        },
      },
      indicatorQueue: [3],
      colorQueue: [],
      changeSet: {},
      loadingConcept: 2,
    }

    expect(slice.reducer(initialState, closeCodelist({collection: 3, codelistId: '1'}))).toEqual({
      isComparisionMode: true,
      panes: [],
      pathById: {
        2: [],
      },
      openCodelists: [
        {
          id: '2',
          mode: 0,
          // containerHierarchy: [],
        },
      ],
      indicators: {
        2: {
          animal: 2,
          color: 'b',
        },
      },
      indicatorQueue: [3, 1],
      colorQueue: ['a'],
      changeSet: {},
      loadingConcept: 2,
    })
  })

  test('replaces medical concept correctly when not in comparision mode', () => {
    const initialState = {
      isComparisionMode: false,
      changeSet: {},
      panes: [],
      pathById: {},
      openCodelists: [
        {
          id: '1',
          mode: 0,
          // containerHierarchy: [],
        },
      ],
      indicators: {
        1: {
          animal: 1,
          color: 'a',
        },
      },
      indicatorQueue: [2, 3],
      colorQueue: ['b'],
      loadingConcept: 2,
    }

    const codelist = {
      id: '2',
      name: 'MC1',
      type: 'ATOMIC',
      codesets: [],
      containerHierarchy: [],
    }

    expect(slice.reducer(initialState, openCodelist({collection: 2, mode: 0, codelistId: '2', path: []}))).toEqual({
      isComparisionMode: false,
      openCodelists: [
        {
          id: '2',
          mode: 0,
          // containerHierarchy: [],
        },
      ],
      pathById: {
        2: [],
      },
      indicators: {
        2: {
          animal: 2,
          color: 'b',
        },
      },
      indicatorQueue: [3, 1],
      colorQueue: ['a'],
      changeSet: {},
      panes: [],
      loadingConcept: 2,
    })
  })

  test('Resets pane when last MC is closed', () => {
    const initialState = {
      isComparisionMode: false,
      openCodelists: [
        {
          id: '2',
          mode: 0,
          // containerHierarchy: [],
        },
      ],
      pathById: {
        2: [],
      },
      indicators: {
        2: {
          animal: 2,
          color: 'b',
        },
      },
      indicatorQueue: [3, 1],
      colorQueue: ['a'],
      changeSet: {},
      panes: [
        {
          id: '123',
          filters: {
            showOnlyOverlapping: false,
            showOnlySelected: false,
            showDiffering: false,
          },
          viewType: 'list',
          ontology: 'ICD-10-CM',
          visibleConcepts: [],
          filterOpen: false,
          filter: {
            code: '',
            description: '',
            mode: 'ILIKE',
          },
          busy: false,
          filteredCodes: null,
        },
      ],
    }

    expect(slice.reducer(initialState, closeCodelist({collection: 2, codelistId: '2'}))).toEqual({
      isComparisionMode: false,
      openCodelists: [],
      pathById: {},
      indicators: {},
      indicatorQueue: [3, 1, 2],
      colorQueue: ['a', 'b'],
      changeSet: {},
      panes: [
        {
          id: '123',
          filters: {
            showOnlyOverlapping: false,
            showOnlySelected: false,
            showDiffering: false,
          },
          viewType: 'tree',
          ontology: 'ICD-10-CM',
          visibleConcepts: [],
          filterOpen: false,
          filter: {
            code: '',
            description: '',
            mode: 'ILIKE',
          },
          busy: false,
          filteredCodes: null,
        },
      ],
    })
  })

  test('toggle concept visibility correctly', () => {
    const initialState = {
      panes: [
        {
          id: '123',
          filters: {
            showOnlyOverlapping: false,
            showOnlySelected: false,
            showDiffering: false,
          },
          viewType: 'tree',
          ontology: 'ICD-10-CM',
          visibleConcepts: ['1', '2'],
          filterOpen: false,
          filter: {
            code: '',
            description: '',
            mode: 'ILIKE',
          },
          busy: false,
          filteredCodes: null,
        },
      ],
    }

    expect(slice.reducer(initialState, toggleCodelistVisibility({paneId: '123', mcId: '2'}))).toEqual({
      panes: [
        {
          id: '123',
          filters: {
            showOnlyOverlapping: false,
            showOnlySelected: false,
            showDiffering: false,
          },
          viewType: 'tree',
          ontology: 'ICD-10-CM',
          visibleConcepts: ['1'],
          filterOpen: false,
          filter: {
            code: '',
            description: '',
            mode: 'ILIKE',
          },
          busy: false,
          filteredCodes: null,
        },
      ],
    })
  })
})
