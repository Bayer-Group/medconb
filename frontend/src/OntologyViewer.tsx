import Icon, {EllipsisOutlined} from '@ant-design/icons'
import {useApolloClient, useLazyQuery} from '@apollo/client'
import {styled} from '@linaria/react'
import {Button, Col, Dropdown, Row, Space, Spin, Switch} from 'antd'
import {ItemType} from 'antd/lib/menu/hooks/useItems'
import {useLiveQuery} from 'dexie-react-hooks'
import {cloneDeep, compact, difference, flatten, isEmpty, keys, some, union, uniq, values} from 'lodash'
import {MenuInfo} from 'rc-menu/lib/interface'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {Codelist, CodeTreeDataSet, IndicatorIndex, LocalCode, LocalOntology} from '..'
import ConceptIndicator from './components/ConceptIndicator'
import MainLoader from './components/MainLoader'
import SelectOntology from './components/SelectOntology'
import {CloseIcon, FilterIcon} from './customIcons'
import {db} from './db'
import FilterComponent, {Filter} from './FilterComponent'
import {FETCH_CODE_LIST, SEARCH_CODES, SEARCH_CODES_LINEAR} from './graphql'
import OntologyListView from './OntologyListView'
import {RootState} from './store'
import {addOpenNodes, collapseAllNodes, doneAppLoading, setOpenNodes, startAppLoading} from './store/ui'
import {
  clearSearch,
  PaneState,
  ReadMode,
  SearchResultState,
  setPaneFilter,
  setPaneFilteredCodes,
  setPaneOntology,
  toggleCodelistVisibility,
  toggleListView,
  togglePaneFilter,
  updateTransient,
} from './store/workspace'
import {calculateFilteredCodes} from './treeUtils'
import {combineLatest} from './utils'
import VirtualCodeTree, {VCodeTreeHandle} from './VirtualCodeTree'
import {addCodes} from './store/changes'
import useChangeSet from './useChangeSet'
import InlineHelp from './InlineHelp'

const MAX_CODES = 100000

type OntologyViewerProps = {
  // ontologies: Ontology[]
  onPaneAdd?: () => void
  onPaneClose?: () => void
  pane: PaneState
}

const OntologyViewer: React.FC<OntologyViewerProps> = ({onPaneAdd, onPaneClose, pane}) => {
  // const [paneMenuVisible, setPaneMenuVisible] = useState(false)
  const dispatch = useDispatch()
  const client = useApolloClient()
  const [chunks, setChunks] = useState(0)
  const [codesAreStale, setCodesAreStale] = useState(true)
  const lastCodeIds = useRef<Set<number>>(new Set())
  const codes_ = useRef<LocalCode[]>([])

  const ontologies = useLiveQuery(() => db.ontologies.toArray())
  const ontology = useMemo(() => (ontologies ?? []).find((o) => o.name === pane.ontology), [ontologies, pane.ontology])

  const codeTreeRef = useRef<VCodeTreeHandle>(null)
  const [codelists, setMedicalConcepts] = useState<Codelist[]>([])
  const changeSet = useChangeSet()

  const visibleCodelists = useMemo(
    () => codelists.filter((mc) => pane.visibleConcepts.includes(mc.id)),
    [codelists, pane.visibleConcepts],
  )

  const visibleCodelistsCodeIds = useMemo<CodeTreeDataSet>(() => {
    if (!visibleCodelists || !ontology) {
      return {} as CodeTreeDataSet
    }

    return visibleCodelists.reduce((acc, mc) => {
      const codeSet = mc.codesets.filter((cs) => cs.ontology.name == ontology.name)[0]

      const transientAdded = (changeSet[mc.id] ?? [])[ontology.name]?.added ?? []
      const transientremoved = (changeSet[mc.id] ?? [])[ontology.name]?.removed ?? []

      const reducedCodeset = codeSet ? codeSet.codes.map((c) => c.id) : []

      acc[String(mc.id)] = new Set(
        difference(union(reducedCodeset, compact(transientAdded)), compact(transientremoved)).map((c) => Number(c)),
      )
      return acc
    }, {} as CodeTreeDataSet)
  }, [ontology, visibleCodelists, changeSet])

  // Query the codes for the ontology
  // For linear ontologies we can not load all codes at once as there
  // are too many; so we limit the query based on the filters.
  // To avoid re-querying too often (is expensive) we keep track of the
  // last loaded codes (codes_) and only re-query when the filter
  // results require it (subset of loaded codes).
  const showOnlySelectedCodes = pane.filters.showOnlySelected || pane.viewType === 'list'

  const codes = useLiveQuery(() => {
    if (!ontology) return []
    let query = db.codes.where({ontology_id: ontology.name})
    let resultPromise: Promise<(LocalCode | undefined)[]> | null = null

    if (ontology.is_linear) {
      if (showOnlySelectedCodes) {
        const selectedCodes = values(visibleCodelistsCodeIds).reduce((a, c) => a.union(c), new Set())
        if (selectedCodes.isSubsetOf(new Set(codes_.current.map((c) => c.id)))) {
          return codes_.current
        }
        resultPromise = db.codes.bulkGet(Array.from(selectedCodes))
      } else if (pane.filteredCodes !== null) {
        const filteredIds = new Set(pane.filteredCodes.map((c) => c.id))
        if (filteredIds.isSubsetOf(new Set(codes_.current.map((c) => c.id)))) {
          return codes_.current
        }
        resultPromise = db.codes.bulkGet(Array.from(filteredIds))
      } else {
        query = query.limit(MAX_CODES)
      }
    }

    setCodesAreStale(true)
    console.time(`queryOntologyCodes`)
    return (resultPromise ? resultPromise : query.toArray())
      .then((codes) => {
        codes_.current = codes.filter((c) => c !== undefined)
        const ids = new Set<number>()
        for (let l = codes_.current.length, i = 0; i < l; i++) {
          ids.add(codes_.current[i].id)
        }
        lastCodeIds.current = ids
        return codes_.current
      })
      .finally(() => {
        console.timeEnd(`queryOntologyCodes`)
        setCodesAreStale(false)
      })
  }, [ontology, showOnlySelectedCodes, visibleCodelistsCodeIds, pane.filteredCodes])

  const [searchCodes] = useLazyQuery(SEARCH_CODES)
  const [searchCodesLinear] = useLazyQuery(SEARCH_CODES_LINEAR)

  const indicators = useSelector((state: RootState) => state.workspace.indicators)
  const openConcepts = useSelector((state: RootState) => state.workspace.openCodelists)

  const onSelectOntology = (onto: LocalOntology) => {
    setCodesAreStale(true) // made unstale in `useLiveQuery` for codes
    dispatch(setPaneOntology({paneId: pane.id, ontology: onto.name}))
  }

  useEffect(() => {
    if (openConcepts.length === 0) {
      return
    }
    // dispatch(setPaneBusy({paneId: pane.id}))

    // dispatch(startAppLoading())
    const observables = openConcepts.map((entry) => {
      return client.watchQuery({
        query: FETCH_CODE_LIST,
        variables: {codelistID: entry.id},
        fetchPolicy: 'cache-first',
      })
    })
    combineLatest(...observables).subscribe((res) => {
      const results: Codelist[] = res.map((r) => {
        let codelist: Codelist = cloneDeep(r.data.codelist)

        codelist.readonly = true
        if (openConcepts.find((entry) => entry.id === codelist.id)?.mode == ReadMode.READWRITE) {
          codelist.readonly = false
        }

        return codelist
      })
      setMedicalConcepts(results)
      results.forEach((codelist) => {
        dispatch(updateTransient({codelist}))
      })
      // dispatch(doneAppLoading())
    })
  }, [openConcepts])

  const colors = useMemo(
    () =>
      keys(indicators).reduce((acc, c) => {
        acc[c] = indicators[c].color
        return acc
      }, {} as {[key: string]: string}),
    [indicators],
  )

  const animals = useMemo(
    () =>
      keys(indicators).reduce((acc, c) => {
        acc[c] = indicators[c].animal
        return acc
      }, {} as {[key: string]: IndicatorIndex}),
    [indicators],
  )

  const handleMenuClick = useCallback(
    ({key}: MenuInfo) => {
      switch (key) {
        case 'add_window':
          if (onPaneAdd) onPaneAdd()
          break
        case 'show_selected':
          dispatch(
            togglePaneFilter({
              paneId: pane.id,
              filter: 'showOnlySelected',
            }),
          )
          break
        case 'show_overlapping':
          dispatch(
            togglePaneFilter({
              paneId: pane.id,
              filter: 'showOnlyOverlapping',
            }),
          )
          break
        case 'show_differing':
          dispatch(
            togglePaneFilter({
              paneId: pane.id,
              filter: 'showDiffering',
            }),
          )
          break
        case 'expand_all': {
          const codes = codeTreeRef.current?.getAllInclusiveCodes()
          dispatch(
            setOpenNodes({
              ontology: ontology.name,
              codes,
            }),
          )
          break
        }
        case 'add_all': {
          if (codelists.length === 1 && ontology && ontology.is_linear && codes) {
            const codelist = codelists[0]
            const existingCodeIds = visibleCodelistsCodeIds[String(codelist.id)] ?? new Set<number>()
            const visibleCodes = (
              pane.filteredCodes !== null
                ? pane.filteredCodes.map((c) => c.id)
                : (codes as LocalCode[]).map((c) => c.id)
            ).filter((id) => !existingCodeIds.has(id))

            if (visibleCodes.length > 0) {
              dispatch(
                addCodes({
                  ontology: ontology.name,
                  mcId: String(codelist.id),
                  codes: visibleCodes.map((c) => `${c}`),
                }),
              )
            }
          }
          break
        }

        case 'collapse_all':
          dispatch(
            collapseAllNodes({
              ontology: ontology.name,
            }),
          )
          break
        case 'list_view':
          dispatch(
            toggleListView({
              paneId: pane.id,
            }),
          )
          break
      }
    },
    [onPaneAdd, pane, ontology, codeTreeRef.current, codes, codelists, visibleCodelistsCodeIds],
  )

  const items = useMemo(() => {
    const menuItems = [
      {
        label: (
          <Row>
            <Col flex={1}>Show only selected</Col>
            <Col>
              <Switch
                size="small"
                disabled={pane.filters.showOnlyOverlapping || pane.filters.showDiffering || pane.viewType === 'list'}
                checked={
                  pane.filters.showOnlySelected ||
                  pane.filters.showOnlyOverlapping ||
                  pane.filters.showDiffering ||
                  pane.viewType === 'list'
                }
              />
            </Col>
          </Row>
        ),
        key: 'show_selected',
        disabled:
          codelists.length < 1 ||
          pane.filters.showOnlyOverlapping ||
          pane.filters.showDiffering ||
          pane.viewType === 'list',
      },
      {
        label: (
          <Row>
            <Col flex={1}>Show only overlapping</Col>
            <Col>
              <Switch
                style={{marginLeft: 20}}
                size="small"
                disabled={codelists.length < 2}
                checked={pane.filters.showOnlyOverlapping}
              />
            </Col>
          </Row>
        ),
        key: 'show_overlapping',
        disabled: codelists.length < 2,
      },
      {
        label: (
          <Row>
            <Col flex={1}>Show differing</Col>
            <Col>
              <Switch size="small" disabled={codelists.length < 2} checked={pane.filters.showDiffering} />
            </Col>
          </Row>
        ),
        key: 'show_differing',
        disabled: codelists.length < 2,
      },
      {type: 'divider'},
      {
        label: (
          <Row>
            <Col flex={1}>List view</Col>
            <Col>
              <Switch size="small" checked={pane.viewType === 'list'} disabled={codelists.length < 1} />
            </Col>
          </Row>
        ),
        key: 'list_view',
        disabled: codelists.length < 1,
      },
      {type: 'divider'},
      {
        label: 'Expand all selected',
        key: 'expand_all',
        disabled: codelists.length < 1 || pane.viewType === 'list',
      },
      {label: <>Collapse all tiers</>, key: 'collapse_all', disabled: pane.viewType === 'list'},
      {
        label: (
          <>
            Add all visible
            <InlineHelp content={'You must have a single concept active and use a linear ontology.'} />
          </>
        ),
        key: 'add_all',
        disabled: codelists.length !== 1 || pane.viewType === 'list' || !ontology?.is_linear,
      },
    ] as ItemType[]

    if (onPaneAdd) {
      menuItems.push({type: 'divider'})
      menuItems.push({label: 'Add window for comparision', key: 'add_window'})
    }

    return menuItems

    // return <Menu key={pane.id} onClick={handleMenuClick} items={menuItems} />
  }, [onPaneAdd, codelists, ontology])

  const onSearch = async (f: Filter): Promise<SearchResultState[]> => {
    // dispatch(setPaneBusy({paneId: pane.id}))
    dispatch(startAppLoading())
    try {
      const query: any = {}

      if (f.code.trim() !== '') {
        query['code'] = {
          value: f.code,
          type: f.mode,
        }
      } else {
        query['code'] = null
      }

      const description = f.description.trim()

      if (description !== '') {
        query['description'] = description
      }

      if (isEmpty(query)) return []

      let searchFunc = searchCodes

      if (!ontology) console.log('WARNING: Ontology is not defined')

      if (ontology && ontology.is_linear) {
        searchFunc = searchCodesLinear
      }

      const res = await searchFunc({
        variables: {
          query,
          ontologyID: pane.ontology,
        },
        // fetchPolicy: 'network-only',
      })

      return res.data.searchCodes.map((c: {id: string; path: {id: string}[]}) => ({
        id: Number.parseInt(c.id),
        path: c.path ? c.path.map((p) => Number.parseInt(p.id)) : [Number.parseInt(c.id)],
      }))
    } catch (error) {
      console.log(error)
    } finally {
      dispatch(setPaneFilter({paneId: pane.id, filter: f}))
      dispatch(doneAppLoading())
      // dispatch(clearPaneBusy({paneId: pane.id}))
    }
    return []
  }

  const handleSearchClick = (f: Filter) => {
    // if nothing changed, don't trigger a search
    if (pane.filter.code === f.code && pane.filter.mode === f.mode && pane.filter.description === f.description) {
      return
    }

    if (f.code === '' && f.description === '') {
      dispatch(
        clearSearch({
          paneId: pane.id,
        }),
      )
      return
    }

    onSearch(f)
      .then((filteredCodes) => {
        if (!filteredCodes || !ontology) {
          return
        }

        if (pane.viewType === 'tree' && !ontology.is_linear) {
          const allPath: number[] = uniq(flatten(calculateFilteredCodes(filteredCodes).map((c) => c.path.slice(0, -1))))
          dispatch(addOpenNodes({ontology: ontology.name, codes: allPath}))
        }

        dispatch(setPaneFilteredCodes({paneId: pane.id, codes: filteredCodes}))
      })
      .catch(console.log)
  }

  useEffect(() => {
    if (ontology && (pane.filter.code.length > 0 || (pane.filter.description ?? '').length > 3)) {
      handleSearchClick(pane.filter)
    }
  }, [pane.filter, pane.ontology, openConcepts, ontology])

  const allReady = !!ontologies && !!ontology && !codesAreStale

  if (!allReady) {
    return (
      <Root>
        <MainLoader>
          <Spin size="large" />
        </MainLoader>
      </Root>
    )
  }

  return (
    <Root data-tour-target="__ontology-viewer__">
      {/* <div> */}
      <Header>
        <Toolbar>
          <Space data-tour-target="__ontology-selector__">
            <SelectOntology onChange={onSelectOntology} value={ontology} ontologies={ontologies} />
            {openConcepts.map((entry, i) => {
              return (
                <ConceptIndicator
                  color={indicators[entry.id].color}
                  key={entry.id}
                  index={indicators[entry.id].animal}
                  disabled={!pane.visibleConcepts.includes(entry.id)}
                  onClick={() => {
                    dispatch(toggleCodelistVisibility({paneId: pane.id, mcId: entry.id}))
                  }}
                  aria-label="Toggle Code List visibility"
                />
              )
            })}
          </Space>
          <Space data-tour-target="__ontology-search__">
            <FilterComponent value={pane.filter} onFilterChange={handleSearchClick} />
          </Space>
          <Space style={{marginRight: 10}} data-tour-target="__ontology-menu__">
            {some(values(pane.filters), Boolean) && <FilterIndicator />}

            <Dropdown
              key={pane.id}
              trigger={['click']}
              menu={{onClick: handleMenuClick, items}}
              // open={paneMenuVisible}
              // onOpenChange={setPaneMenuVisible}
              placement={'bottomRight'}>
              <Button
                onClick={(e) => e.preventDefault()}
                aria-label="toggle viewer options"
                size="small"
                type="text"
                icon={<EllipsisOutlined />}
              />
            </Dropdown>
            {!!onPaneClose && <Button size="small" type="text" onClick={() => onPaneClose()} icon={<CloseIcon />} />}
          </Space>
        </Toolbar>
      </Header>
      {/* <div style={{position: 'absolute', inset: '6px 0 6px 12px'}}> */}
      {/* onCodeChange={onCodeToggle} */}
      <ViewerWrapper data-tour-target="__ontology-main__">
        {pane.viewType === 'list' && (
          <OntologyListView
            search={pane.filter}
            ontologyCodes={codes as LocalCode[]}
            colors={colors}
            ontology={ontology}
            filters={pane.filters}
            filteredCodes={pane.filteredCodes}
            codelists={visibleCodelists}
            codelistsCodeIds={visibleCodelistsCodeIds}
            animals={animals}
          />
        )}
        {pane.viewType === 'tree' && (
          <VirtualCodeTree
            ontology={ontology}
            ontologyCodes={codes as LocalCode[]}
            codelists={visibleCodelists}
            codelistsCodeIds={visibleCodelistsCodeIds}
            key={ontology.name}
            filters={pane.filters}
            search={pane.filter}
            animals={animals}
            colors={colors}
            handle={codeTreeRef}
            searchResults={pane.filteredCodes}
          />
          // <CodeTree
          //   search={pane.filter}
          //   ref={codeTreeRef}
          //   ontology={ontology}
          //   key={ontology.name}
          //   colors={colors}
          //   filters={pane.filters}
          //   codes={pane.filteredCodes}
          //   animals={animals}
          //   concepts={visibleCodelists}
          // />
        )}
      </ViewerWrapper>
      {/* </div> */}
      {/* </div> */}
      {pane.busy && (
        <ViewerBusy showFilter={pane.filterOpen}>{chunks == 1 && <Spin className="__list-loading" />}</ViewerBusy>
      )}
    </Root>
  )
}

// export default withOntologies(OntologyViewer)
export default OntologyViewer

const FilterIndicator = () => {
  return (
    <IndicatorRoot>
      <Space align="center">
        <FilterIconContainer>
          <Icon component={FilterIcon} style={{color: '#fff'}} />
        </FilterIconContainer>
        Filter applied
      </Space>
    </IndicatorRoot>
  )
}

const ViewerWrapper = styled.div`
  padding-left: 12px;
  height: calc(100% - 54px);
`

const ViewerBusy = styled.div<{showFilter: boolean}>`
  position: absolute;
  inset: 0;
  top: ${(props) => (props.showFilter ? 76 : 44)}px;
  pointer-events: none;
  z-index: 8;
  background: rgba(241, 242, 245, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
`

const IndicatorRoot = styled.div`
  border-radius: 50px;
  border: 1px solid #d9d9d9;
  padding: 2px 8px 2px 2px;
`

const FilterIconContainer = styled.div`
  display: flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #262626;
`

const Header = styled.div`
  margin-bottom: 10px;
  background: #fff;
  padding: 6px 6px 6px 12px;
  z-index: 3;
  position: sticky;
  top: 0;
  box-shadow: 1px 4px 14px -2px rgba(191, 191, 191, 0.29);
  -webkit-box-shadow: 1px 4px 14px -2px rgba(191, 191, 191, 0.29);
  -moz-box-shadow: 1px 4px 14px -2px rgba(191, 191, 191, 0.29);
`

const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
`

const Root = styled.div`
  background: #fff;
  /* border-radius: 4px; */
  border-right: 1px solid #f0f0f0;
  height: 100%;
  max-height: 100%;
  position: relative;
  overflow: auto;
  // padding-left: 12px;
`
