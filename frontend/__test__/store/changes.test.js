import {size} from 'lodash'
import slice, {addCodes, clearChangeSet, clearQueue, removeCodes, startSync} from '../../src/store/changes'

describe('Change set handling', () => {
  test('Handles code add', () => {
    const initialState = {
      changeSet: {},
      queue: [],
      syncing: false,
      temp: [],
    }

    const newState = slice.reducer(
      initialState,
      addCodes({
        ontology: 'a',
        mcId: '1',
        codes: ['a', 'b', 'c'],
      }),
    )

    expect(size(newState.changeSet)).toEqual(1)
  })

  test('Handles code remove', () => {
    const initialState = {
      changeSet: {1: {a: {added: ['a', 'b', 'c'], removed: []}}},
      queue: ['1'],
      syncing: false,
      temp: [],
    }

    const newState = slice.reducer(
      initialState,
      removeCodes({
        ontology: 'a',
        mcId: '1',
        codes: ['c'],
      }),
    )

    expect(size(newState.changeSet)).toEqual(1)
    expect(newState.changeSet['1']['a'].added).toEqual(['a', 'b'])
  })

  test('background sync latency scenario', () => {
    const initialState = {
      changeSet: {},
      tempChangeSet: {},
      queue: [],
      syncing: false,
      temp: [],
    }

    // add code
    const codeAdded1 = slice.reducer(
      initialState,
      addCodes({
        ontology: 'a',
        mcId: '1',
        codes: ['a', 'b', 'c'],
      }),
    )

    // start sync
    const syncStartedState = slice.reducer(codeAdded1, startSync())

    // add code again
    const codeAdded2 = slice.reducer(
      syncStartedState,
      addCodes({
        ontology: 'a',
        mcId: '1',
        codes: ['d'],
      }),
    )

    expect(size(codeAdded2.changeSet)).toEqual(1)
    expect(codeAdded2.tempChangeSet['1']['a'].added).toEqual(['d'])

    // sync complete
    const syncCompleted = slice.reducer(codeAdded2, clearChangeSet('1'))

    expect(size(syncCompleted.changeSet)).toEqual(1)
    expect(syncCompleted.changeSet['1']['a'].added).toEqual(['d'])
    expect(size(syncCompleted.tempChangeSet)).toEqual(0)

    // clear queue
    const clearQueue1 = slice.reducer(syncCompleted, clearQueue())

    // sync 2
    const syncStartedState2 = slice.reducer(clearQueue1, startSync())

    const syncCompleted2 = slice.reducer(syncStartedState2, clearChangeSet('1'))

    expect(size(syncCompleted2.changeSet)).toEqual(0)
    expect(size(syncCompleted2.tempChangeSet)).toEqual(0)
  })
})
