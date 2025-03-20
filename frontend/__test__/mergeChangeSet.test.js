import mergeChangeSet from '../src/mergeChangeSet'

describe('Merge ChangeSet', () => {
  test('Merges changesets correctly', () => {
    const a = {
      'ICD-10-CM': {
        added: ['4'],
        removed: [],
      },
    }

    const b = {
      'ICD-10-CM': {
        added: ['1328', '1329', '6169', '6170', '6171'],
        removed: [],
      },
    }

    const merged = mergeChangeSet(a, b)

    expect(merged).toEqual({
      'ICD-10-CM': {
        added: ['4', '1328', '1329', '6169', '6170', '6171'],
        removed: [],
      },
    })
  })

  test('merges added and removed codes correctly', () => {
    // initial  1,2,6
    // a        1,2,4
    // b        1,2,6
    const a = {
      'ICD-10-CM': {
        added: ['4'],
        removed: ['6'],
      },
    }

    const b = {
      'ICD-10-CM': {
        added: ['6', '7'],
        removed: ['4'],
      },
    }

    const merged = mergeChangeSet(a, b)

    expect(merged).toEqual({
      'ICD-10-CM': {
        added: ['7'],
        removed: [],
      },
    })
  })

  test('overall effect of adding same sets of codes is null', () => {
    const a = {
      'ICD-10-CM': {
        added: ['4', '5', '6'],
        removed: [],
      },
    }

    const b = {
      'ICD-10-CM': {
        added: [],
        removed: ['4', '5', '6'],
      },
    }

    const merged = mergeChangeSet(a, b)

    expect(merged).toEqual({
      'ICD-10-CM': {
        added: [],
        removed: [],
      },
    })
  })
  test('overall effect of adding same sets of codes is null (reversed action)', () => {
    const a = {
      'ICD-10-CM': {
        added: [],
        removed: ['4', '5', '6'],
      },
    }

    const b = {
      'ICD-10-CM': {
        added: ['4', '5', '6'],
        removed: [],
      },
    }

    const merged = mergeChangeSet(a, b)

    expect(merged).toEqual({
      'ICD-10-CM': {
        added: [],
        removed: [],
      },
    })
  })

  test('Merges changesets correctly (remove first scenario)', () => {
    const a = {
      'ICD-10-CM': {
        added: [],
        removed: ['4', '5'],
      },
    }

    const b = {
      'ICD-10-CM': {
        added: ['4', '6'],
        removed: [],
      },
    }

    const merged = mergeChangeSet(a, b)

    expect(merged).toEqual({
      'ICD-10-CM': {
        added: ['6'],
        removed: ['5'],
      },
    })
  })
})
