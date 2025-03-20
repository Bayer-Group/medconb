import {findMatchingOpItems} from '../../src/search/utils'
const schema = {
  elements: [
    {
      label: 'Used for',
      name: 'used_for',
      type: 'text',
      intrinsic: true,
    },
    {
      label: 'Visibility',
      name: 'visibility',
      type: 'enum',
      intrinsic: false,
      enumValues: [
        {label: 'Own', value: 'own'},
        {label: 'Shared', value: 'shared'},
        {label: 'Public', value: 'public'},
      ],
    },
  ],
}

describe('Search expressions', () => {
  test('text property', () => {
    const items = findMatchingOpItems(schema, {lhs: {value: 'used_for'}})
    // console.log(items)
    expect(items.length).toEqual(4)
    expect(items.map((i) => i.op).sort()).toEqual(['is', 'is empty', 'is not', 'is not empty'])
  })

  test('non intrinsic property', () => {
    const items = findMatchingOpItems(schema, {lhs: {value: 'visibility'}})
    // console.log(items)
    expect(items.length).toEqual(2)
    expect(items.map((i) => i.op).sort()).toEqual(['is', 'is not'])
  })
})
