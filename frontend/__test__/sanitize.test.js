import {sanitize} from '../src/useStorePersist'

describe('Changeset sanitize', () => {
  test('Cleans existing codes that were added', () => {
    const codelist = {
      id: 'a',
      name: 'aa',
      description: 'a desc',
      codesets: [
        {
          ontology: {
            name: 'x',
          },
          codes: [
            {id: 'm', code: 'M'},
            {id: 'n', code: 'N'},
            {id: 'o', code: 'O'},
          ],
        },
      ],
      transientCodesets: [],
      containerHierarchy: [],
    }

    const changes = [
      {
        ontologyID: 'x',
        added: ['p', 'm'],
      },
    ]

    const sanitized = sanitize(codelist, changes)
    expect(sanitized[0].added.length).toEqual(1)
    expect(sanitized[0].added[0]).toEqual('p')
  })

  test('Cleans removed codes that didnt exist in the codeset', () => {
    const codelist = {
      id: 'a',
      name: 'aa',
      description: 'a desc',
      codesets: [
        {
          ontology: {
            name: 'x',
          },
          codes: [
            {id: 'm', code: 'M'},
            {id: 'n', code: 'N'},
            {id: 'o', code: 'O'},
          ],
        },
      ],
      transientCodesets: [],
      containerHierarchy: [],
    }

    const changes = [
      {
        ontologyID: 'x',
        removed: ['p'],
      },
    ]

    const sanitized = sanitize(codelist, changes)
    expect(sanitized[0].removed.length).toEqual(0)
  })

  test('Cleans both removed and added codes properly', () => {
    const codelist = {
      id: 'a',
      name: 'aa',
      description: 'a desc',
      codesets: [
        {
          ontology: {
            name: 'x',
          },
          codes: [
            {id: 'm', code: 'M'},
            {id: 'n', code: 'N'},
            {id: 'o', code: 'O'},
          ],
        },
      ],
      transientCodesets: [],
      containerHierarchy: [],
    }

    const changes = [
      {
        ontologyID: 'x',
        added: ['q', 'm'],
        removed: ['p'],
      },
    ]

    const sanitized = sanitize(codelist, changes)
    expect(sanitized[0].removed.length).toEqual(0)

    expect(sanitized[0].added.length).toEqual(1)
    expect(sanitized[0].added[0]).toEqual('q')
  })
})
