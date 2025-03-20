import {NodeModel} from '@minoru/react-dnd-treeview'
import {createSlice, PayloadAction} from '@reduxjs/toolkit'
import {union, xor} from 'lodash'
import {Ontology} from '../..'

type UIState = {
  sideBarOpen: boolean
  openWorkspaceMenu: {
    [section: string]: NodeModel['id'][]
  }
  renamingConcepts: string[]
  renamingCollections: string[]
  ontologyTreeOpenState: {
    [id: Ontology['name']]: number[]
  }
  tooltipCodelist?: string
  // codeById: NodeInfo
  saveInProgress: boolean
  enableInfoBubbles: boolean
  openStudy?: string
  openPhenotype?: string
  activeSidePanel?: string
  sidebarOpenSections: string[]
  searchParams: any
  appLoading: number
  largeCodelistLoading: boolean
  largeCodelistChunks: number
  largeCodelistLoadedChunks: number
  codelistLoadProgress: number
}

const initialState: UIState = {
  sideBarOpen: true,
  appLoading: 0,
  openWorkspaceMenu: {
    private_codelist_collection: [],
    private_phenotype_collection: [],
    shared_codelist_collection: [],
    shared_phenotype_collection: [],
  },
  renamingConcepts: [],
  renamingCollections: [],
  ontologyTreeOpenState: {},
  // codeById: {},
  saveInProgress: false,
  enableInfoBubbles: true,
  activeSidePanel: 'active_concepts',
  sidebarOpenSections: ['private_codelist_collection', 'private_phenotype_collection'],
  searchParams: {},
  codelistLoadProgress: 0,
  largeCodelistChunks: 0,
  largeCodelistLoadedChunks: 0,
  largeCodelistLoading: false,
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sideBarOpen = !state.sideBarOpen
    },
    toggleInfoBubbles: (state) => {
      state.enableInfoBubbles = !state.enableInfoBubbles
    },
    setOpenMenu: (state, action: PayloadAction<{section: string; items: NodeModel['id'][]}>) => {
      state.openWorkspaceMenu[action.payload.section] = action.payload.items
    },
    addOpenMenu: (state, action: PayloadAction<{section: string; item: NodeModel['id']}>) => {
      state.openWorkspaceMenu[action.payload.section].push(action.payload.item)
    },
    addRenamingCodelist: (state, action: PayloadAction<string>) => {
      state.renamingConcepts = union(state.renamingConcepts, [action.payload])
    },
    removeRenamingCodelist: (state, action: PayloadAction<string>) => {
      state.renamingConcepts = state.renamingConcepts.filter((e) => action.payload !== e)
    },
    addRenamingCollection: (state, action: PayloadAction<string>) => {
      state.renamingCollections = union(state.renamingCollections, [action.payload])
    },
    removeRenamingCollection: (state, action: PayloadAction<string>) => {
      state.renamingCollections = state.renamingCollections.filter((e) => action.payload !== e)
    },
    toggleOntologyNode: (state, action: PayloadAction<{ontology: string; code: number}>) => {
      state.ontologyTreeOpenState[action.payload.ontology] = xor(state.ontologyTreeOpenState[action.payload.ontology], [
        action.payload.code,
      ])
    },
    setOpenNodes: (state, action: PayloadAction<{ontology: string; codes: number[]}>) => {
      state.ontologyTreeOpenState[action.payload.ontology] = action.payload.codes
    },
    addOpenNodes: (state, action: PayloadAction<{ontology: string; codes: number[]}>) => {
      state.ontologyTreeOpenState[action.payload.ontology] = union(
        state.ontologyTreeOpenState[action.payload.ontology],
        action.payload.codes,
      )
    },
    collapseAllNodes: (state, action: PayloadAction<{ontology: string}>) => {
      state.ontologyTreeOpenState[action.payload.ontology] = []
    },
    // setOntologies: (state, action: PayloadAction<{ontologies: Ontology[]}>) => {
    //   let newNodeInfo: NodeInfo = {}
    //   action.payload.ontologies.forEach((ontology) => {
    //     newNodeInfo = {
    //       ...newNodeInfo,
    //       ...treeInfo(ontology)[2],
    //     }
    //   })

    //   state.codeById = {
    //     ...state.codeById,
    //     ...newNodeInfo,
    //   }
    // },
    // updateOntologyNode: (state, action: PayloadAction<{node: Code}>) => {
    //   // state.ontologies[action.payload.ontology] = replaceNode(
    //   //   state.ontologies[action.payload.ontology],
    //   //   action.payload.node,
    //   // )
    //   const newNodeInfo = {}
    //   dfs(action.payload.node, [], [], newNodeInfo)
    //   state.codeById = {
    //     ...state.codeById,
    //     ...newNodeInfo,
    //   }
    // },
    // updateOntologyCodes: (state, action: PayloadAction<Code[]>) => {
    //   const newNodeInfo: NodeInfo = {}
    //   action.payload.forEach((code) => {
    //     newNodeInfo[code.id] = {
    //       path: code.path.map((p) => p.id),
    //     }
    //   })
    //   state.codeById = {
    //     ...state.codeById,
    //     ...newNodeInfo,
    //   }
    // },
    // updateOntologiesByConcept: (state, action: PayloadAction<Codelist>) => {
    //   const newNodeInfo: NodeInfo = {}
    //   action.payload.codesets.forEach((cs) => {
    //     cs.codes.forEach((code) => {
    //       newNodeInfo[code.id] = {
    //         path: code.path.map((p) => p.id),
    //       }
    //     })
    //   })

    //   if (action.payload.transientCodesets) {
    //     action.payload.transientCodesets.forEach((cs) => {
    //       cs.codes.forEach((code) => {
    //         newNodeInfo[code.id] = {
    //           path: code.path.map((p) => p.id),
    //         }
    //       })
    //     })
    //   }

    //   state.codeById = {
    //     ...state.codeById,
    //     ...newNodeInfo,
    //   }
    // },
    tooltipCodelist: (state, action: PayloadAction<string | undefined>) => {
      state.tooltipCodelist = action.payload
    },
    startSave: (state) => {
      state.saveInProgress = true
    },
    endSave: (state) => {
      state.saveInProgress = false
    },
    setOpenStudy: (state, action: PayloadAction<string | undefined>) => {
      state.openStudy = action.payload
    },
    setOpenPhenotype: (state, action: PayloadAction<string | undefined>) => {
      state.openPhenotype = action.payload
    },
    toggleRightPanelItem: (state, action: PayloadAction<string | undefined>) => {
      if (!action.payload) {
        state.activeSidePanel = undefined
      } else {
        state.activeSidePanel = xor([action.payload], [state.activeSidePanel])[0] ?? undefined
      }
    },
    toggleSidebarSection: (state, action: PayloadAction<string>) => {
      state.sidebarOpenSections = xor(state.sidebarOpenSections, [action.payload])
    },
    startAppLoading: (state) => {
      state.appLoading = state.appLoading + 1
    },
    doneAppLoading: (state) => {
      state.appLoading = state.appLoading - 1
    },
    updateSearchParam: (state, action: PayloadAction<any>) => {
      state.searchParams = action.payload
    },
    startLargeCodelistLoading: (state, action: PayloadAction<number>) => {
      state.largeCodelistChunks = action.payload
      state.largeCodelistLoading = true
      state.largeCodelistLoadedChunks = 0
      state.codelistLoadProgress = 0
    },
    largeCodelistLoadProgress: (state) => {
      state.largeCodelistLoadedChunks = state.largeCodelistLoadedChunks + 1
      state.codelistLoadProgress = Math.round((state.largeCodelistLoadedChunks / state.largeCodelistChunks) * 100)
    },
    doneLoadingLargeCodelist: (state) => {
      state.largeCodelistLoading = false
      state.codelistLoadProgress = 0
      state.largeCodelistLoadedChunks = 0
      state.largeCodelistChunks = 0
    },
  },
})

export const {
  toggleSidebar,
  toggleInfoBubbles,
  setOpenMenu,
  addOpenMenu,
  addRenamingCollection,
  addRenamingCodelist,
  removeRenamingCollection,
  removeRenamingCodelist,
  toggleOntologyNode,
  collapseAllNodes,
  setOpenNodes,
  // setOntologies,
  // updateOntologyNode,
  // updateOntologyCodes,
  // updateOntologiesByConcept,
  // tooltipCodelist,
  startSave,
  endSave,
  addOpenNodes,
  setOpenStudy,
  setOpenPhenotype,
  toggleRightPanelItem,
  toggleSidebarSection,
  updateSearchParam,
  startLargeCodelistLoading,
  largeCodelistLoadProgress,
  doneLoadingLargeCodelist,
  startAppLoading,
  doneAppLoading,
} = uiSlice.actions

export default uiSlice
