import {last} from 'lodash'
import {reorderTabs} from '../src/components/OverflowTabs'

describe('Overflow tabs', () => {
  test('does nothing when active item is already visible and no overflow', () => {
    const tabs = [
      {id: 1, name: 'a'},
      {id: 2, name: 'b'},
      {id: 3, name: 'c'},
      {id: 4, name: 'd'},
      {id: 5, name: 'e'},
      {id: 6, name: 'f'},
    ]

    const active = {id: 2, name: 'f'}

    const [tabItems, dropdownItems] = reorderTabs(tabs, 6, active)

    expect(tabItems.length).toEqual(6)
    expect(dropdownItems.length).toEqual(0)

    expect(last(tabItems).id).toEqual(6)
  })
  test('does nothing when active item is already visible', () => {
    const tabs = [
      {id: 1, name: 'a'},
      {id: 2, name: 'b'},
      {id: 3, name: 'c'},
      {id: 4, name: 'd'},
      {id: 5, name: 'e'},
      {id: 6, name: 'f'},
    ]

    const active = {id: 2, name: 'f'}

    const [tabItems, dropdownItems] = reorderTabs(tabs, 3, active)

    expect(tabItems.length).toEqual(3)
    expect(dropdownItems.length).toEqual(3)

    expect(last(tabItems).id).toEqual(3)
  })
  test('reorders tabs correctly when active item is not visible', () => {
    const tabs = [
      {id: 1, name: 'a'},
      {id: 2, name: 'b'},
      {id: 3, name: 'c'},
      {id: 4, name: 'd'},
      {id: 5, name: 'e'},
      {id: 6, name: 'f'},
    ]

    const active = {id: 6, name: 'f'}

    const [tabItems, dropdownItems] = reorderTabs(tabs, 3, active)

    expect(tabItems.length).toEqual(3)
    expect(dropdownItems.length).toEqual(3)

    expect(last(tabItems).id).toEqual(6)
  })
})
