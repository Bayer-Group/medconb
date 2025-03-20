import Icon, {EllipsisOutlined} from '@ant-design/icons'
import {useApolloClient, useLazyQuery} from '@apollo/client'
import {styled} from '@linaria/react'
import {Button, Col, Dropdown, Row, Skeleton, Space, Spin, Switch} from 'antd'
import {ItemType} from 'antd/lib/menu/hooks/useItems'
import {useLiveQuery} from 'dexie-react-hooks'
import {flatten, isEmpty, keys, some, uniq, values} from 'lodash'
import {MenuInfo} from 'rc-menu/lib/interface'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {Codelist, IndicatorIndex, LocalCode} from '..'
import ConceptIndicator from './components/ConceptIndicator'
import SelectOntology from './components/SelectOntology'
import {CloseIcon, FilterIcon} from './customIcons'
import FilterComponent, {Filter} from './FilterComponent'
import {FETCH_CODE_LIST, SEARCH_CODES} from './graphql'
import OntologyListView from './OntologyListView'
import {RootState} from './store'
import {addOpenNodes, collapseAllNodes, doneAppLoading, setOpenNodes, startAppLoading} from './store/ui'
import {
  clearSearch,
  PaneState,
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
import {db} from './db'

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
  const ontologies = useLiveQuery(() => db.ontologies.toArray())
  const codes = useLiveQuery(() => {
    return db.codes.where({ontology_id: pane.ontology}).toArray()
  }, [pane.ontology])
  const ontology = (ontologies ?? []).find((o) => o.name === pane.ontology)

  const codeTreeRef = useRef<VCodeTreeHandle>(null)
  const [codelists, setMedicalConcepts] = useState<Codelist[]>([])

  const [searchCodes] = useLazyQuery(SEARCH_CODES)

  const indicators = useSelector((state: RootState) => state.workspace.indicators)
  const openConcepts = useSelector((state: RootState) => state.workspace.openCodelists)

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
      const results: Codelist[] = res.map((r) => r.data.codelist)
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
    [onPaneAdd, pane, ontology, codeTreeRef.current],
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
      {label: 'Collapse all tiers', key: 'collapse_all', disabled: pane.viewType === 'list'},
    ] as ItemType[]

    if (onPaneAdd) {
      menuItems.push({type: 'divider'})
      menuItems.push({label: 'Add window for comparision', key: 'add_window'})
    }

    return menuItems

    // return <Menu key={pane.id} onClick={handleMenuClick} items={menuItems} />
  }, [onPaneAdd, codelists])

  const onSearch = useCallback(
    async (f: Filter) => {
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

        const description = f.description //https://stackoverflow.com/a/66721429/876117
          .replace(/^[\p{P}\p{S}]+/gu, '')
          .replace(/[\p{P}\p{S}]+$/gu, '')
          .trim()

        if (description !== '') {
          query['description'] = description
        }

        if (isEmpty(query)) return

        const res = await searchCodes({
          variables: {
            query,
            ontologyID: pane.ontology,
          },
          // fetchPolicy: 'network-only',
        })

        return res.data.searchCodes
      } catch (error) {
        console.log(error)
      } finally {
        dispatch(setPaneFilter({paneId: pane.id, filter: f}))
        dispatch(doneAppLoading())
        // dispatch(clearPaneBusy({paneId: pane.id}))
      }
    },
    [pane.id, pane.filter, pane.ontology],
  )

  const handleSearchClick = (f: Filter) => {
    if (f.code.length > 0 || (f.description ?? '').length > 3) {
      onSearch(f)
        .then((filteredCodes) => {
          if (filteredCodes) {
            if (pane.viewType === 'tree') {
              const allPath: number[] = uniq(
                flatten(
                  calculateFilteredCodes(
                    filteredCodes.map((c) => ({
                      id: c.id,
                      path: c.path.map((p) => p.id),
                    })),
                  ).map((c) => c.path.slice(0, -1).map((p) => Number(p))),
                ),
              )
              // console.log(calculateFilteredCodes(filteredCodes), allPath)
              dispatch(
                addOpenNodes({
                  ontology: ontology.name,
                  codes: allPath,
                }),
              )
            }

            dispatch(
              setPaneFilteredCodes({
                paneId: pane.id,
                codes: filteredCodes.map((c) => ({
                  id: c.id,
                  path: c.path.map((p) => p.id),
                })),
              }),
            )
          }
        })
        .catch(console.log)
    } else {
      dispatch(
        clearSearch({
          paneId: pane.id,
        }),
      )
    }
  }

  const visibleCodelists = useMemo(
    () => codelists.filter((mc) => pane.visibleConcepts.includes(mc.id)),
    [codelists, pane.visibleConcepts],
  )

  useEffect(() => {
    if (ontology && (pane.filter.code.length > 0 || (pane.filter.description ?? '').length > 3)) {
      handleSearchClick(pane.filter)
    }
  }, [pane.filter, pane.ontology, openConcepts, ontology])

  if (!ontology) {
    return (
      <Root>
        <Skeleton />
      </Root>
    )
  }

  return (
    <Root data-tour-target="__ontology-viewer__">
      {/* <div> */}
      <Header>
        <Toolbar>
          <Space data-tour-target="__ontology-selector__">
            <SelectOntology
              onChange={(onto) => dispatch(setPaneOntology({paneId: pane.id, ontology: onto.name}))}
              value={ontology}
              ontologies={ontologies ?? []}
            />
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
            concepts={codelists.filter((mc) => pane.visibleConcepts.includes(mc.id))}
            animals={animals}
          />
        )}
        {pane.viewType === 'tree' && (
          <VirtualCodeTree
            ontology={ontology}
            ontologyCodes={codes as LocalCode[]}
            concepts={visibleCodelists}
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
