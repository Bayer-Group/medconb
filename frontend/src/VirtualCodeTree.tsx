import {grey} from '@ant-design/colors'
import {CaretDownOutlined, CaretRightOutlined} from '@ant-design/icons'
import {styled} from '@linaria/react'
import {Space} from 'antd'
import cx from 'classnames'
import {compact, curry, difference, flatten, isEqual, keys, range, union, uniq, values} from 'lodash'
import {
  CSSProperties,
  memo,
  RefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import useMeasure from 'react-use-measure'
import {areEqual, VariableSizeList as List, VariableSizeList} from 'react-window'
import {Codelist, CodeTreeDataSet, IndicatorIndex, LocalCode, LocalOntology} from '..'
import {Filter} from './FilterComponent'
import CodeCheckbox, {CodeSelectFlag} from './components/CodeCheckbox'
import ConceptIndicator from './components/ConceptIndicator'
import filterOntology, {TreeNode} from './ontologyFilter'
import {RootState} from './store'
import {addCodes, removeCodes} from './store/changes'
import {doneAppLoading, startAppLoading, toggleOntologyNode} from './store/ui'
import {PaneFilter, SearchResultState} from './store/workspace'
import {calculateFilteredCodes} from './treeUtils'
import useChangeSet from './useChangeSet'
import {flushSync} from 'react-dom'
import {preview} from 'vite'

export type VCodeTreeHandle = {
  getAllInclusiveCodes: () => number[]
}

type VirtualCodeTreeProps = {
  concepts: Codelist[]
  ontologyCodes: LocalCode[]
  search: Filter
  filters: PaneFilter
  ontology: LocalOntology
  colors: {[mcId: string]: string}
  animals: {[mcId: string]: IndicatorIndex}
  handle: RefObject<VCodeTreeHandle>
  searchResults: SearchResultState[] | null
}

const Wrapper: React.FC<VirtualCodeTreeProps> = (props) => {
  const [ref, bounds] = useMeasure()
  return (
    <div style={{height: '100%'}} ref={ref}>
      <VirtualCodeTree {...props} height={bounds.height} />
    </div>
  )
}

const VirtualCodeTree: React.FC<VirtualCodeTreeProps & {height: number}> = ({
  ontologyCodes,
  concepts,
  filters,
  ontology,
  search,
  colors,
  animals,
  searchResults,
  height,
  handle,
}) => {
  const changeSet = useChangeSet()
  const openNodes = useSelector((state: RootState) => state.ui.ontologyTreeOpenState)
  const dispatch = useDispatch()
  const listRef = useRef<VariableSizeList<TreeNode>>(null)
  const [codes, setCodes] = useState<TreeNode[]>([])
  const [intermediates, setIntermediates] = useState<number[]>([])
  const computedValue = useMemo<CodeTreeDataSet>(() => {
    if (!concepts) {
      return {} as CodeTreeDataSet
    }

    return concepts.reduce((acc, mc) => {
      const codeSet = mc.codesets.filter((cs) => cs.ontology.name == ontology.name)[0]

      const transientAdded = (changeSet[mc.id] ?? [])[ontology.name]?.added ?? []
      const transientremoved = (changeSet[mc.id] ?? [])[ontology.name]?.removed ?? []

      const reducedCodeset = codeSet ? codeSet.codes.map((c) => c.id) : []

      acc[String(mc.id)] = new Set(
        difference(union(reducedCodeset, compact(transientAdded)), compact(transientremoved)).map((c) => Number(c)),
      )
      return acc
    }, {} as CodeTreeDataSet)
  }, [ontology.name, concepts, changeSet])

  useImperativeHandle(handle, () => ({
    getAllInclusiveCodes: () => intermediates,
  }))

  const filterCodes = (showLoader = false) => {
    if (showLoader) {
      dispatch(startAppLoading())
    }

    setTimeout(() => {
      const _codes = values(computedValue).reduce((a, c) => a.union(c), new Set())
      const _int = uniq(flatten(ontologyCodes.filter(({id}) => _codes.has(id)).map(({path}) => path.slice(0, -1))))
      const filtered = filterOntology(ontologyCodes, {
        value: computedValue,
        openNodes: (openNodes[ontology.name] ?? []).map((n) => Number(n)),
        filters,
        searchResults,
      })
      setCodes(filtered)
      setIntermediates(_int)

      listRef.current?.resetAfterIndex(0)
      if (showLoader) {
        dispatch(doneAppLoading())
      }
    }, 1)
  }

  useEffect(() => {
    if ((ontologyCodes ?? []).length > 0) {
      filterCodes(true)
    }
  }, [filters, searchResults])

  useEffect(() => {
    if ((ontologyCodes ?? []).length > 0) {
      filterCodes()
    }
  }, [ontology.name, computedValue, openNodes, ontologyCodes])

  const toggleCode = useCallback(
    (code: LocalCode, codelistId: string, checked: boolean, flag: CodeSelectFlag) => {
      let addedCodes: number[] = []
      let descendants = range(code.id + 1, code.last_descendant_id)
      descendants.push(code.last_descendant_id)

      if (searchResults) {
        // filter descendants with the search result
        const filteredBySearch = calculateFilteredCodes(searchResults)
        const filteredIds = new Set(filteredBySearch.map((c) => Number(c.id)))
        descendants = Array.from(new Set(descendants).intersection(filteredIds))
      }

      switch (flag) {
        case CodeSelectFlag.ALL:
          addedCodes = union([code.id], descendants)

          break
        case CodeSelectFlag.SELF:
          addedCodes = [code.id]
          break
        case CodeSelectFlag.CHILDREN:
          addedCodes = [...descendants]
          break
      }

      if (checked) {
        dispatch(
          addCodes({
            ontology: ontology.name,
            codes: addedCodes.filter((c) => !computedValue[codelistId].has(c)).map((c) => `${c}`),
            mcId: codelistId,
          }),
        )
      } else {
        dispatch(
          removeCodes({
            ontology: ontology.name,
            codes: addedCodes.filter((c) => computedValue[codelistId].has(c)).map((c) => `${c}`),
            mcId: codelistId,
          }),
        )
      }
    },
    [searchResults, computedValue],
  )
  const getItemSize = (index: number) => {
    if (codes[index].fd) return 34.84
    const nextCode = codes.at(index + 1)
    const path = codes[index].path.slice(0, -1)
    if (!nextCode) {
      return 26.84 + 8 * path.length
    }
    if (nextCode && nextCode.path.slice(0, -1).length < path.length) {
      const drop = path.length - nextCode.path.slice(0, -1).length
      return 26.84 + 8 * drop
    }
    return 26.84
  }

  return (
    <List
      ref={listRef}
      className="treeview"
      height={height}
      itemCount={codes.length}
      itemSize={getItemSize}
      width={'100%'}>
      {({index, style}) => {
        const code = codes[index]
        return (
          <ListCode
            key={code.id}
            code={code}
            nextCode={codes.at(index + 1)}
            search={search}
            concepts={concepts}
            toggleCode={toggleCode}
            colors={colors}
            animals={animals}
            open={(openNodes[ontology.name] ?? []).includes(code.id)}
            style={style}
            isChecked={(concept, code) => computedValue[concept].has(code)}
            isIntermediate={(concept, code) => computedValue[concept].has(code)}
          />
        )
      }}
    </List>
  )
}

export default Wrapper

type CodeProps = {
  codeId: number
  concepts: Codelist[]
  colors: {[mcId: string]: string}
  animals: {[mcId: string]: IndicatorIndex}
  search: Filter
  toggleCode: (code: LocalCode, codelistId: string, checked: boolean, flag: CodeSelectFlag) => void
  isChecked: (concept: string, code: number) => boolean
  isIntermediate: (concept: string, code: number) => boolean
  open: boolean
}

type ListCodeProps = Omit<CodeProps, 'codeId'> & {code: TreeNode; nextCode?: TreeNode}

export const ListCode: React.FC<ListCodeProps & {style: CSSProperties}> = memo(
  ({code, nextCode, concepts, search, toggleCode, colors, animals, isChecked, style, open}) => {
    const dispatch = useDispatch()
    const handleToggle = () => {
      if (code.children_ids.length > 0)
        dispatch(
          toggleOntologyNode({
            ontology: code.ontology_id,
            code: code.id,
          }),
        )
    }
    const desc = useMemo(() => {
      if (!code) return ''

      let _desc: string = code?.description
      if ((search?.description ?? '').trim() !== '') {
        const regex = new RegExp(search.description, 'gi')
        _desc = _desc.replace(regex, (match) => {
          return `<mark>${match}</mark>`
        })
      }

      return _desc
    }, [code, search])

    const selector = useMemo(() => {
      const path = code.path.slice(0, -1).map((c) => `__c${c}`)
      // path.push(path.join("."))
      return [...path.map((c) => `.${c}`), `.p${path.join('-')}`].join(', ')
    }, [code])

    const align = useMemo(() => {
      const path = code.path.slice(0, -1)
      if (!nextCode || (nextCode && nextCode.path.slice(0, -1).length < path.length)) {
        return 'flex-start'
      }
      return 'flex-end'
    }, [code.path, nextCode?.path])

    const depthDrop = useMemo(() => {
      const path = code.path.slice(0, -1)
      if (!nextCode) {
        return path.length
      }
      if (nextCode && nextCode.path.slice(0, -1).length < path.length) {
        return path.length - nextCode.path.slice(0, -1).length
      }
      return 0
    }, [code.path, nextCode?.path])

    return (
      <CodeWrapper $align={align} style={style}>
        {code.path.slice(0, -1).map((_, i) => (
          <div
            key={i}
            style={{
              width: 4,
              marginLeft: 4,
              height: depthDrop > 1 ? `calc(100% - ${8 * i}px)` : `100%`,
              borderLeft: `1px solid ${grey[1]}`,
            }}
          />
        ))}
        {code.children_ids.length == 0 && <div style={{width: 8, height: '100%'}} />}
        <NodeWrapper
          className={cx(
            '__item',
            `__c${code.id}`,
            `p${code.path
              .slice(0, -1)
              .map((c) => `__c${c}`)
              .join('-')}`,
          )}
          // className={cx('__item', ...code.path.slice(0, -1).map((c) => `__c${c}`))}
          onMouseEnter={(e) => {
            e.stopPropagation()
            document.querySelectorAll(selector)?.forEach((n) => n.classList.add('active'))
            // e.target.closest('ul')?.classList.add('active')
          }}
          onMouseLeave={(e) => {
            e.stopPropagation()
            document.querySelectorAll(selector)?.forEach((n) => n.classList.remove('active'))
            //   ?.classList.remove('active')
            // // e.target.closest('ul')?.classList.remove('active')
          }}
          data-code-id={code.id}>
          {/* {code.path.slice(0, -1).map((_, i) => (
            <div key={i} style={{width: 4, marginLeft: 4, height: '100%', borderLeft: `1px solid ${grey[1]}`}} />
          ))}
          {code.children_ids.length == 0 && <div style={{width: 8, height: '100%'}} />} */}
          {open && code.children_ids.length > 0 && (
            <CaretDownOutlined onClick={handleToggle} style={{marginLeft: 1, color: grey[1], cursor: 'pointer'}} />
          )}
          {!open && code.children_ids.length > 0 && (
            <CaretRightOutlined onClick={handleToggle} style={{marginLeft: 1, color: grey[1], cursor: 'pointer'}} />
          )}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              minWidth: 0,
              flex: 1,
            }}>
            {concepts.map((c, i) => (
              <CodeCheckbox
                codelist={c}
                hasChildren={code.children_ids.length > 0}
                forceContextMenu={code.i[c.id] !== 'NONE'}
                // readonly={(c.children ?? []).length > 0}
                onChange={(checked, flag) => {
                  toggleCode(code, c.id, checked, flag)
                }}
                background={colors[c.id]}
                label={
                  <Space>
                    <ConceptIndicator color={colors[c.id]} index={animals[c.id]} onClick={console.log} />
                    <strong>{c.name}</strong>
                  </Space>
                }
                key={c.id}
                checked={isChecked(c.id, code.id)}
                intermediate={code.i[c.id]}
              />
            ))}

            <Label onClick={handleToggle}>
              {!!code.code && <CodeId>{code.code}</CodeId>}
              <Description dangerouslySetInnerHTML={{__html: desc}} />
            </Label>
          </div>
        </NodeWrapper>
      </CodeWrapper>
    )
  },
  areEqual,
)

const Label = styled.div`
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
`

const Description = styled.p`
  flex: 1;
  margin: 0;
  min-width: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 8px;
  overflow: hidden;
  padding: 4px;
`

const CodeWrapper = styled.div<{$align: 'flex-end' | 'flex-start'}>`
  display: flex;
  align-items: ${(props) => props.$align};
  // background: red;
`

const NodeWrapper = styled.div`
  display: flex;
  background: #fff;
  align-items: center;
  font-size: 12px;
  flex: 1;
  height: 28.64px;
  overflow: hidden;

  .anticon-caret-right,
  .anticon-caret-down {
    font-size: 8px;
  }

  // transition: color 0.1s ease;

  & > * {
    pointer-events: all;
  }

  &:hover,
  &.hover {
    background: #f0f5ff;
    z-index: 2;
    // overflow: visible;

    ${Description} {
      // overflow: visible;
      background: #f0f5ff;
      z-index: 2;
    }
  }
`

const CodeId = styled.span`
  padding: 0 8px;
  text-transform: uppercase;
  border-radius: 2px;
  border: 1px solid #d9d9d9;
  display: inline-block;
  margin-left: 8px;
  font-size: 12px;
  white-space: nowrap;
`
