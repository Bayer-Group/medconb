import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {difference, union, xor, unionBy, omit} from 'lodash'
import {Code, Codelist, ContainerSpec, IndicatorIndex, Ontology} from '../..'
import {nanoid} from 'nanoid'
import {Filter} from '../FilterComponent'
import {Mode} from '../components/RegexInput'
import {colors} from '../utils'

export type PaneFilter = {
  showOnlySelected: boolean
  showOnlyOverlapping: boolean
  showDiffering: boolean
}

export type SearchResultState = {
  id: string
  path: string[]
  numberOfChildren: number
  code: string
  description: string
  lastDescendantId: number
}

export type PaneState = {
  id: string
  ontology: Ontology['name']
  filters: PaneFilter
  viewType: 'list' | 'tree'
  visibleConcepts: Codelist['id'][]
  filter: Filter
  filterOpen: boolean
  busy: boolean
  filteredCodes: SearchResultState[] | null
}

export type ChangeSet = {
  [ontology: Ontology['name']]: {
    added: Code['id'][]
    removed: Code['id'][]
  }
}

export enum ReadMode {
  READONLY,
  READWRITE,
}

export type OpenObject = {
  id: string
  type: 'CodelistCollection' | 'PhenotypeCollection' | 'Phenotype' | 'Codelist'
  label: string
  mode: ReadMode
}

type WorkspaceState = {
  isComparisionMode: boolean
  isDirty: boolean
  loadingConcept?: string
  panes: PaneState[]
  openCodelists: {
    id: Codelist['id']
    mode: ReadMode
    // containerHierarchy: ContainerSpec[]
  }[]
  pathById: {
    [mcId: string]: string[]
  }
  indicators: {
    [mcId: string]: {
      animal: IndicatorIndex
      color: string
    }
  }
  indicatorQueue: IndicatorIndex[]
  colorQueue: string[]
  supressDiscardWarning: boolean
  transientChangeSet: {
    [mcId: string]: ChangeSet
  }
  openObject?: OpenObject
  pendingOpenObjectNav?: OpenObject
  openObjects: OpenObject[]
}

const indicatorIndex = Array.from({length: 20}, (_, i) => (i + 1) as IndicatorIndex)

const PANE_DEFAULTS: Omit<PaneState, 'id'> = {
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
    mode: Mode.ILIKE,
  },
  busy: false,
  filteredCodes: null,
}

const initialState: WorkspaceState = {
  panes: [
    {
      id: nanoid(),
      ...PANE_DEFAULTS,
    },
  ],
  openCodelists: [],
  pathById: {},
  indicators: {},
  indicatorQueue: [...indicatorIndex],
  colorQueue: [...colors],
  isComparisionMode: false,
  isDirty: false,
  // changeSet: {},
  supressDiscardWarning: false,
  transientChangeSet: {},
  openObjects: [],
}

const workspaceStore = createSlice({
  name: 'workspace',
  initialState,
  reducers: {
    openCodelist(
      state,
      action: PayloadAction<{
        codelistId: Codelist['id']
        path: string[]
        mode: ReadMode
      }>,
    ) {
      // if (state.loadingConcept != action.payload.codelistId) return

      state.openCodelists.forEach((codelist) => {
        workspaceStore.caseReducers.closeCodelist(state, {
          type: 'workspace/closeCodelist',
          payload: {codelistId: codelist.id},
        })
      })

      workspaceStore.caseReducers.addCodelist(state, action)
      //reset comparision mode
      state.isComparisionMode = false
    },
    closeCodelist(state, action: PayloadAction<{codelistId: Codelist['id']}>) {
      const indicator = state.indicators[action.payload.codelistId]

      state.indicatorQueue.push(indicator.animal)
      state.colorQueue.push(indicator.color)

      delete state.indicators[action.payload.codelistId]

      state.openCodelists = state.openCodelists.filter((c) => c.id !== action.payload.codelistId)
      delete state.pathById[action.payload.codelistId]

      if (state.openCodelists.length === 0) {
        state.isComparisionMode = false
        //clear all filters
        state.panes = state.panes.map((p) => ({
          ...p,
          ...omit(PANE_DEFAULTS, ['filter']),
        }))
      }
    },
    addCodelist(
      state,
      action: PayloadAction<{
        codelistId: Codelist['id']
        path: string[]
        mode: ReadMode
      }>,
    ) {
      if (state.openCodelists.map((c) => c.id).includes(action.payload.codelistId)) {
        return
      }
      state.isComparisionMode = true
      // asign an animal
      state.indicators[action.payload.codelistId] = {
        animal: state.indicatorQueue.shift()!,
        color: state.colorQueue.shift()!,
      }

      state.openCodelists.push({
        id: action.payload.codelistId,
        mode: action.payload.mode,
        // containerHierarchy: action.payload.codelist.containerHierarchy,
      })
      state.panes = state.panes.map((p) => ({
        ...p,
        visibleConcepts: [...p.visibleConcepts, action.payload.codelistId],
      }))

      state.pathById[action.payload.codelistId] = action.payload.path

      // calculate changeset from saved transient
      // workspaceStore.caseReducers.updateTransient(state, action)
    },

    addPane(state) {
      state.panes.push({
        id: nanoid(),
        ...PANE_DEFAULTS,
      })
    },
    closePane(state, action: PayloadAction<{paneId: string}>) {
      state.panes = state.panes.filter((p) => p.id !== action.payload.paneId)
    },
    toggleCodelistVisibility(state, action: PayloadAction<{paneId: string; mcId: Codelist['id']}>) {
      state.panes = state.panes.map((p) => {
        if (p.id === action.payload.paneId) {
          return {
            ...p,
            visibleConcepts: xor(p.visibleConcepts, [action.payload.mcId]),
          }
        }
        return p
      })
    },

    togglePaneFilter(state, action: PayloadAction<{paneId: string; filter: keyof PaneFilter}>) {
      state.panes = state.panes.map((pane) => {
        if (pane.id === action.payload.paneId) {
          const changes = {
            [action.payload.filter]: !pane.filters[action.payload.filter],
          }
          if (action.payload.filter === 'showDiffering' && changes.showDiffering === true) {
            changes.showOnlyOverlapping = false
          }

          if (action.payload.filter === 'showOnlyOverlapping' && changes.showOnlyOverlapping === true) {
            changes.showDiffering = false
          }

          return {
            ...pane,
            filters: {
              ...pane.filters,
              ...changes,
            },
          }
        }
        return pane
      })
    },

    toggleAllPaneBusy: (state, action: PayloadAction<boolean>) => {
      state.panes = state.panes.map((pane) => ({
        ...pane,
        busy: action.payload,
      }))
    },

    setPaneBusy: (state, action: PayloadAction<{paneId: string}>) => {
      state.panes = state.panes.map((pane) => {
        if (pane.id === action.payload.paneId) {
          return {
            ...pane,
            busy: true,
          }
        }
        return pane
      })
    },
    clearPaneBusy: (state, action: PayloadAction<{paneId: string}>) => {
      state.panes = state.panes.map((pane) => {
        if (pane.id === action.payload.paneId) {
          return {
            ...pane,
            busy: false,
          }
        }
        return pane
      })
    },
    setPaneFilter: (state, action: PayloadAction<{paneId: string; filter: Filter}>) => {
      state.panes = state.panes.map((pane) => {
        if (pane.id === action.payload.paneId) {
          return {
            ...pane,
            filter: action.payload.filter,
          }
        }
        return pane
      })
    },
    togglePaneSearch: (state, action: PayloadAction<{paneId: string}>) => {
      state.panes = state.panes.map((pane) => {
        if (pane.id === action.payload.paneId) {
          return {
            ...pane,
            filterOpen: !pane.filterOpen,
          }
        }
        return pane
      })
    },

    setPaneFilteredCodes(state, action: PayloadAction<{paneId: string; codes: SearchResultState[]}>) {
      state.panes = state.panes.map((pane) => {
        if (pane.id === action.payload.paneId) {
          return {
            ...pane,
            filteredCodes: action.payload.codes,
          }
        }
        return pane
      })
    },

    clearSearch(state, action: PayloadAction<{paneId: string}>) {
      state.panes = state.panes.map((pane) => {
        if (pane.id === action.payload.paneId) {
          return {
            ...pane,
            filteredCodes: null,
            filter: {
              code: '',
              description: '',
              mode: Mode.ILIKE,
            },
          }
        }
        return pane
      })
    },

    setPaneOntology(state, action: PayloadAction<{paneId: string; ontology: Ontology['name']}>) {
      state.panes = state.panes.map((pane) => {
        if (pane.id === action.payload.paneId) {
          return {
            ...pane,
            ontology: action.payload.ontology,
          }
        }
        return pane
      })
    },

    toggleListView(state, action: PayloadAction<{paneId: string}>) {
      state.panes = state.panes.map((pane) => {
        if (pane.id === action.payload.paneId) {
          const viewType = pane.viewType === 'tree' ? 'list' : 'tree'

          return {
            ...pane,
            viewType,
          }
        }
        return pane
      })
    },

    startLoadingConcept(state, action: PayloadAction<string>) {
      state.loadingConcept = action.payload
    },

    codelistMoved(
      state,
      action: PayloadAction<{mcID: string; sourceCollectionId: string; targetCollectionId: string}>,
    ) {
      state.openCodelists = state.openCodelists.map((codelist) => {
        if (codelist.id !== action.payload.mcID) {
          return codelist
        } else {
          return {
            ...codelist,
            containerSpec: {
              type: 'Collection',
              id: action.payload.targetCollectionId,
            },
          }
        }
      })
    },
    openObject(state, action: PayloadAction<OpenObject>) {
      state.openObject = action.payload
      // state.pendingOpenObjectNav = action.payload
      if (action.payload.type !== 'Codelist') {
        state.openObjects = unionBy(state.openObjects, [action.payload], 'id')
      }
    },
    closeObject(state, action: PayloadAction<string>) {
      if (state.openObject?.id == action.payload) {
        state.openObject = undefined
      }
      state.openObjects = state.openObjects.filter((ob) => ob.id !== action.payload)
    },
    clearOpenObject(state) {
      state.openObject = undefined
    },
    clearOpenObjectNav(state) {
      state.pendingOpenObjectNav = undefined
    },
    renameObject(state, action: PayloadAction<{id: string; name: string}>) {
      if (state.openObject?.id == action.payload.id) {
        state.openObject = {...state.openObject, label: action.payload.name}
      }
      state.openObjects = state.openObjects.map((openObject) => {
        if (openObject.id === action.payload.id) {
          return {...openObject, label: action.payload.name}
        } else {
          return {...openObject}
        }
      })
    },
    updateTransient(
      state,
      action: PayloadAction<{
        codelist: Codelist
      }>,
    ) {
      if (action.payload.codelist.transientCodesets) {
        const baseOntologies = action.payload.codelist.codesets.map((cs) => cs.ontology.name)
        const transientOntologies = action.payload.codelist.transientCodesets.map((cs) => cs.ontology.name)

        const base = action.payload.codelist.codesets.reduce((a, codeset) => {
          a[codeset.ontology.name] = codeset.codes.map((c) => c.id)
          return a
        }, {} as {[ontology: string]: string[]})

        const transient = action.payload.codelist.transientCodesets.reduce((a, codeset) => {
          a[codeset.ontology.name] = codeset.codes.map((c) => c.id)
          return a
        }, {} as {[ontology: string]: string[]})

        const changes = {} as ChangeSet

        union(baseOntologies, transientOntologies).forEach((ontology) => {
          const added = difference(transient[ontology] ?? [], base[ontology] ?? [])
          const removed = difference(base[ontology] ?? [], transient[ontology] ?? [])

          changes[ontology] = {
            added,
            removed,
          }
        })
        state.transientChangeSet[action.payload.codelist.id] = changes
      } else {
        delete state.transientChangeSet?.[action.payload.codelist.id]
      }
    },
  },
})

export const {
  openCodelist,
  closeCodelist,
  addCodelist,
  toggleCodelistVisibility,
  addPane,
  closePane,
  togglePaneFilter,
  setPaneOntology,
  toggleListView,
  codelistMoved,
  togglePaneSearch,
  setPaneBusy,
  clearPaneBusy,
  setPaneFilter,
  setPaneFilteredCodes,
  clearSearch,
  startLoadingConcept,
  openObject,
  closeObject,
  clearOpenObject,
  clearOpenObjectNav,
  renameObject,
  updateTransient,
  toggleAllPaneBusy,
} = workspaceStore.actions

export default workspaceStore
