import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {Code, Codelist, Ontology} from '../..'
import {without} from 'lodash'

export enum SaveState {
  DIRTY = 'DIRTY',
  SAVING = 'SAVING',
  SAVED = 'SAVED',
}

type ChangesState = {
  changeSet: {
    [mcId: string]: ChangeSet
  }
  tempChangeSet: {
    [mcId: string]: ChangeSet
  }
  syncing: boolean
  codelistSaveState: {
    [codelistId: string]: SaveState
  }
}

export type ChangeSet = {
  [ontology: Ontology['name']]: {
    added: Code['id'][]
    removed: Code['id'][]
  }
}

const initialState: ChangesState = {
  changeSet: {},
  tempChangeSet: {},
  syncing: false,
  codelistSaveState: {},
}

const changesState = createSlice({
  name: 'changes',
  initialState,
  reducers: {
    addCodes(state, action: PayloadAction<{ontology: string; mcId: string; codes: string[]}>) {
      const workingChangeSet = state.syncing ? 'tempChangeSet' : 'changeSet'
      if (!state[workingChangeSet][action.payload.mcId]) {
        state[workingChangeSet][action.payload.mcId] = {}
      }
      if (!state[workingChangeSet][action.payload.mcId][action.payload.ontology]) {
        state[workingChangeSet][action.payload.mcId][action.payload.ontology] = {
          added: [],
          removed: [],
        }
      }

      for (const codeId of action.payload.codes) {
        if (state[workingChangeSet][action.payload.mcId][action.payload.ontology].removed.includes(codeId)) {
          state[workingChangeSet][action.payload.mcId][action.payload.ontology].removed = state[workingChangeSet][
            action.payload.mcId
          ][action.payload.ontology].removed.filter((c) => c !== codeId)
        } else {
          state[workingChangeSet][action.payload.mcId][action.payload.ontology].added.push(codeId)
        }
      }
    },
    removeCodes(state, action: PayloadAction<{ontology: string; mcId: string; codes: string[]}>) {
      const workingChangeSet = state.syncing ? 'tempChangeSet' : 'changeSet'
      if (!state[workingChangeSet][action.payload.mcId]) {
        state[workingChangeSet][action.payload.mcId] = {}
      }
      if (!state[workingChangeSet][action.payload.mcId][action.payload.ontology]) {
        state[workingChangeSet][action.payload.mcId][action.payload.ontology] = {
          added: [],
          removed: [],
        }
      }

      for (const codeId of action.payload.codes) {
        if (state[workingChangeSet][action.payload.mcId][action.payload.ontology].added.includes(codeId)) {
          state[workingChangeSet][action.payload.mcId][action.payload.ontology].added = state[workingChangeSet][
            action.payload.mcId
          ][action.payload.ontology].added.filter((c) => c !== codeId)
        } else {
          state[workingChangeSet][action.payload.mcId][action.payload.ontology].removed.push(codeId)
        }
      }

      if (
        state[workingChangeSet][action.payload.mcId][action.payload.ontology].added.length === 0 &&
        state[workingChangeSet][action.payload.mcId][action.payload.ontology].removed.length === 0
      ) {
        delete state[workingChangeSet][action.payload.mcId][action.payload.ontology]
      }
    },
    clearChangeSet(state, action: PayloadAction<Codelist['id']>) {
      if (state.tempChangeSet[action.payload]) {
        state.changeSet[action.payload] = state.tempChangeSet[action.payload]
      } else {
        delete state.changeSet[action.payload]
      }
      delete state.tempChangeSet[action.payload]
    },
    startSync(state) {
      state.syncing = true
    },
    clearQueue(state) {
      state.syncing = false
    },
    updateCodelistSaveState(state, action: PayloadAction<{codelistID: Codelist['id']; state: SaveState}>) {
      state.codelistSaveState[action.payload.codelistID] = action.payload.state
    },
  },
})

export const {addCodes, removeCodes, clearChangeSet, startSync, clearQueue, updateCodelistSaveState} =
  changesState.actions

export default changesState
