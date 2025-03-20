import {AnyAction, CombinedState, combineReducers, configureStore, createListenerMiddleware} from '@reduxjs/toolkit'
import uiSlice from './ui'
import workspaceStore from './workspace'
import changesStore from './changes'
import localforage from 'localforage'
import {FLUSH, PAUSE, PERSIST, persistReducer, PURGE, REGISTER, REHYDRATE} from 'redux-persist'
import {union} from 'lodash'

export const listenerMiddleware = createListenerMiddleware()

const persistConfig = {
  storage: localforage,
}
const workspace = persistReducer({...persistConfig, key: '__MEDCONB__WORKSPACE'}, workspaceStore.reducer)
const ui = persistReducer(
  {
    ...persistConfig,
    blacklist: ['appLoading', 'renamingConcepts', 'renamingCollections', 'tooltipCodelist'],
    key: '__MEDCONB__UI',
  },
  uiSlice.reducer,
)
const changes = persistReducer({...persistConfig, key: '__MEDCONB__CHANGES'}, changesStore.reducer)

const combinedReducers = combineReducers({
  ui,
  workspace,
  changes,
})

const rootReducer = (state: CombinedState<any>, action: AnyAction) => {
  if (action.type === 'medconb/reset') {
    // check for action type
    state = undefined
  }
  if (action.type === 'workspace/openObject') {
    // open workspace section when an object is opened
    state = {
      ...state,
      ui: {
        ...state.ui,
        sidebarOpenSections: union([...state.ui.sidebarOpenSections], ['workspace']),
      },
    }
  }
  return combinedReducers(state, action)
}

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER, 'medconb/reset']},
    }).prepend(listenerMiddleware.middleware),
})

export default store
// export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
