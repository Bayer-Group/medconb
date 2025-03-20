import descendantIntersection from '../src/descendantIntersection'
describe('Descendant interesection', () => {
  test('Determines PARTIAL correctly', () => {
    const code = {
      id: 1,
      last_descendant_id: 10,
    }
    const mcCodes = new Set([5, 6, 7])
    expect(descendantIntersection(code, mcCodes)).toEqual('PARTIAL')
  })
  test('Determines NONE correctly', () => {
    const code = {
      id: 1,
      last_descendant_id: 10,
    }
    const mcCodes = new Set([11, 12, 13])
    expect(descendantIntersection(code, mcCodes)).toEqual('NONE')
  })
  test('Determines FULL correctly', () => {
    const code = {
      id: 1,
      last_descendant_id: 10,
    }
    const mcCodes = new Set([2, 3, 4, 5, 6, 7, 8, 9, 10])
    expect(descendantIntersection(code, mcCodes)).toEqual('FULL')
  })
})
