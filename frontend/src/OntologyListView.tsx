import {styled} from '@linaria/react'
import {Space} from 'antd'
import {difference, intersection, range, union, values} from 'lodash'
import {memo, useCallback, useEffect, useMemo, useState} from 'react'
import {useDispatch} from 'react-redux'
import {Codelist, CodeTreeDataSet, IndicatorIndex, LocalCode, LocalOntology} from '..'
import CodeCheckbox, {CodeSelectFlag} from './components/CodeCheckbox'
import ConceptIndicator from './components/ConceptIndicator'
import {Filter} from './FilterComponent'
import {addCodes, removeCodes} from './store/changes'
import {PaneFilter, SearchResultState} from './store/workspace'
import {areEqual, FixedSizeList as List} from 'react-window'
import useMeasure from 'react-use-measure'
import {doneAppLoading, startAppLoading} from './store/ui'

type OntologyListViewProps = {
  ontology: LocalOntology
  ontologyCodes: LocalCode[]
  search: Filter
  codelists: Codelist[]
  codelistsCodeIds: CodeTreeDataSet
  filters: PaneFilter
  colors: {[mcId: string]: string}
  animals: {[mcId: string]: IndicatorIndex}
  filteredCodes: SearchResultState[] | null
}

const Wrapper: React.FC<OntologyListViewProps> = (props) => {
  const [ref, bounds] = useMeasure()
  return (
    <div style={{height: '100%'}} ref={ref}>
      <OntologyListView {...props} height={bounds.height} />
    </div>
  )
}

const OntologyListView: React.FC<OntologyListViewProps & {height: number}> = ({
  ontology,
  codelists,
  codelistsCodeIds,
  colors,
  animals,
  filters,
  ontologyCodes,
  filteredCodes,
  search,
  height,
}) => {
  const dispatch = useDispatch()
  const [_codes, setCodes] = useState<LocalCode[]>([])

  const codes = useMemo<Set<number>>(() => {
    const unfilteredCodes = union(...values(codelistsCodeIds).map((set) => Array.from(set)))
    let _filteredCodes = unfilteredCodes

    if (filteredCodes) {
      const filteredCodeIds_ = filteredCodes.map((c) => c.id)
      _filteredCodes = _filteredCodes.sort().filter((code) => filteredCodeIds_.includes(code))
    }

    if (filters.showOnlyOverlapping) {
      _filteredCodes = intersection(...values(codelistsCodeIds).map((set) => Array.from(set)))
    }

    if (filters.showDiffering) {
      const valuesV = values(codelistsCodeIds)
      _filteredCodes = difference(
        union(...valuesV.map((set) => Array.from(set))),
        intersection(...valuesV.map((set) => Array.from(set))),
      )
    }

    // Set is not ordered but internally it will keep the order of insertion
    return new Set(_filteredCodes.sort())
  }, [codelistsCodeIds, codelists, filteredCodes, filters])

  useEffect(() => {
    if ((ontologyCodes ?? []).length > 0) {
      console.log('startAppLoading - OntologyListView useEffect')
      dispatch(startAppLoading())
      const __codes = ontologyCodes.filter(({id}) => codes.has(id))
      setCodes(__codes)
      dispatch(doneAppLoading())
    }
  }, [codes])

  const toggleCode = useCallback(
    (code: LocalCode, codelistId: string, checked: boolean, flag: CodeSelectFlag) => {
      let codes = [code.id]
      if (flag === CodeSelectFlag.ALL) codes = union(codes, range(code.id, code.last_descendant_id))
      if (checked) {
        dispatch(
          addCodes({
            ontology: ontology.name,
            codes: codes.filter((c) => !codelistsCodeIds[codelistId].has(c)).map(String),
            mcId: codelistId,
          }),
        )
      } else {
        dispatch(
          removeCodes({
            ontology: ontology.name,
            codes: codes.filter((c) => codelistsCodeIds[codelistId].has(c)).map(String),
            mcId: codelistId,
          }),
        )
      }
    },
    [ontology.name, codelistsCodeIds],
  )
  return (
    <List height={height} itemCount={_codes.length} itemSize={26.85} width={'100%'}>
      {({index, style}) => {
        const code = _codes[index]
        return (
          <ListCode
            key={code.id}
            code={code}
            search={search}
            codelists={codelists}
            toggleCode={toggleCode}
            colors={colors}
            animals={animals}
            style={style}
            isChecked={(concept, code) => codelistsCodeIds[concept].has(code)}
          />
        )
      }}
    </List>
  )
}

type CodeProps = {
  codeId: number
  codelists: Codelist[]
  colors: {[mcId: string]: string}
  animals: {[mcId: string]: IndicatorIndex}
  search: Filter
  toggleCode: (code: LocalCode, codelistId: string, checked: boolean, flag: CodeSelectFlag) => void
  isChecked: (concept: string, code: number) => boolean
}

type ListCodeProps = Omit<CodeProps, 'codeId'> & {code: LocalCode}

export const ListCode: React.FC<ListCodeProps & {style: any}> = memo(
  ({code, codelists, search, toggleCode, colors, animals, isChecked, style}) => {
    // const {isIntersecting, ref} = useIntersectionObserver({
    //   threshold: [0, 0.5],
    // })
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

    return (
      <NodeWrapper style={style}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            minWidth: 0,
            flex: 1,
          }}>
          {codelists.map((c, i) => (
            <CodeCheckbox
              codelist={c}
              hasChildren={code.children_ids.length > 0}
              forceContextMenu={code.children_ids.length > 0}
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
            />
          ))}

          <Label>
            {!!code.code && <CodeId>{code.code}</CodeId>}
            <Description dangerouslySetInnerHTML={{__html: desc}} />
          </Label>
        </div>
      </NodeWrapper>
    )
  },
  areEqual,
)

export default Wrapper

const Root = styled.ul`
  list-style-type: none;
  margin: 0;
  padding: 0;

  ul {
    list-style-type: none;
    margin: 0;
    padding: 0;
  }

  &.treeview {
    ul {
      padding-left: 8px;
      padding-top: 8px;
      padding-bottom: 8px;
      list-style-type: none;

      position: relative;

      &:before {
        position: absolute;
        top: 0;
        left: 4px;
        bottom: 22px;
        border-right: 1px solid #595959;
        content: '';
      }

      &:after {
        position: absolute;
        bottom: 22px;
        left: 5px;
        border-top: 1px solid #595959;
        content: '';
        width: 3px;
      }

      li {
        position: relative;
        &:not(:last-child):after {
          position: absolute;
          top: 14px;
          left: -4px;
          border-top: 1px solid #595959;
          content: '';
          width: 4px;
          transform: translateY(-1px);
        }
      }
    }
  }
`

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

const NodeWrapper = styled.div`
  display: flex;
  align-items: center;
  font-size: 12px;
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
