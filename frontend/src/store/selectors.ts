import {createSelector} from '@reduxjs/toolkit'
import {RootState} from '.'
import {Codelist} from '../..'
import {ReadMode} from './workspace'
import {keys} from 'lodash'

const readonlyMapSelector = createSelector([(state: RootState) => state.workspace.openCodelists], (openCodelists) =>
  openCodelists.reduce(
    (a, c) => {
      a[c.id] = c.mode
      return a
    },
    {} as {[codelistId: Codelist['id']]: ReadMode},
  ),
)

const openCodelistIdSelector = createSelector([(state: RootState) => state.workspace.openCodelists], (openCodelists) =>
  openCodelists.map((c) => c.id),
)

const changeSetCodelistIdSelector = createSelector([(state: RootState) => state.changes.changeSet], (changeSet) =>
  keys(changeSet),
)

export {readonlyMapSelector, openCodelistIdSelector, changeSetCodelistIdSelector}
