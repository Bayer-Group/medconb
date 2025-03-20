import {CaretDownFilled, CaretRightFilled, MinusCircleFilled, PlusCircleFilled} from '@ant-design/icons'
import {styled} from '@linaria/react'
import {Button, Space, Typography} from 'antd'
import cx from 'classnames'
import {isEmpty, keys, omitBy, xor} from 'lodash'
import React, {useCallback, useMemo, useState} from 'react'
import {useSelector} from 'react-redux'
import {Code, Codelist, Ontology} from '../..'
import {ChangeSetDisplay} from '../SaveCodelist'
import {RootState} from '../store'

export type CommitChangeSet = {
  ontology: {name: Ontology['name']}
  added: Pick<Code, 'id' | 'code' | 'description'>[]
  removed: Pick<Code, 'id' | 'code' | 'description'>[]
}

export type Commit = {
  changesets: CommitChangeSet[]
  author: {id: string; externalId: string; name: string}
  message: string
  createdAt: Date
}

export type HistoryEntry = {
  message: string
  user: string
  date: string
  added: number[]
  removed: number[]
}

const {Text} = Typography

type ChangeHistoryProps = {
  history: Commit[]
  codelistID: Codelist['id']
}

const ChangeHistory: React.FC<ChangeHistoryProps> = ({history, codelistID}) => {
  const transient = useSelector((state: RootState) => state.workspace.transientChangeSet)
  const transientEntry = useMemo(
    () => omitBy(transient[codelistID], (o) => o.added.length === 0 && o.removed.length === 0),
    [transient, codelistID],
  )
  return (
    <>
      {!isEmpty(transientEntry) && <TransientEntry entry={transientEntry} />}
      {history.map((entry, i) => (
        <ChangeEntry entry={entry} key={i} />
      ))}
    </>
  )
}

const TransientEntry: React.FC<{entry: {[ontology: string]: {added: string[]; removed: string[]}}}> = ({entry}) => {
  const [codesExpanded, setCodesExpanded] = useState<string[]>([])
  return (
    <ChangeEntryRoot $transient>
      <div>
        {keys(entry).map((ontology) => (
          <div key={ontology}>
            <Space align="center" style={{fontSize: 10}}>
              <Text>{ontology}</Text>
              {entry[ontology].added.length > 0 && (
                <>
                  <PlusCircleFilled style={{color: '#00BCFF'}} />
                  {entry[ontology].added.length}
                </>
              )}

              {entry[ontology].removed.length > 0 && (
                <>
                  <MinusCircleFilled />
                  {entry[ontology].removed.length}
                </>
              )}

              <Button
                size="small"
                type="text"
                style={{
                  opacity: codesExpanded.includes(ontology) ? 1 : 0.5,
                  fontSize: 12,
                  fontWeight: 'normal',
                }}
                icon={codesExpanded.includes(ontology) ? <CaretDownFilled /> : <CaretRightFilled />}
                onClick={() => setCodesExpanded(xor(codesExpanded, [ontology]))}>
                Show codes
              </Button>
            </Space>
            {codesExpanded.includes(ontology) && (
              <div style={{marginBottom: 6}}>
                <ChangeSetDisplay changeSet={entry[ontology]} />
              </div>
            )}
          </div>
        ))}
      </div>
    </ChangeEntryRoot>
  )
}

const ChangeEntry: React.FC<{entry: Commit}> = ({entry}) => {
  const [collapsible, setCollapsible] = useState<boolean>(false)
  const [open, setOpen] = useState(false)
  const [codesExpanded, setCodesExpanded] = useState<string[]>([])

  const cbRef = useCallback((el: HTMLDivElement) => {
    if (el) setCollapsible(el.scrollHeight > el.clientHeight)
  }, [])

  return (
    <ChangeEntryRoot>
      <div>
        <div ref={cbRef} className={cx('message', {open})}>
          <p>{entry.message}</p>
        </div>
        <div className="userInfo">
          <Space>
            {`${entry.createdAt}, `}
            {entry.author.name}
          </Space>
        </div>

        <div>
          {entry.changesets
            .filter((cs) => !(cs.added.length === 0 && cs.removed.length === 0))
            .map((cs) => (
              <div key={cs.ontology.name}>
                <Space align="center" style={{fontSize: 10}}>
                  <Text>{cs.ontology.name}</Text>
                  {cs.added.length > 0 && (
                    <>
                      <PlusCircleFilled style={{color: '#00BCFF'}} />
                      {cs.added.length}
                    </>
                  )}

                  {cs.removed.length > 0 && (
                    <>
                      <MinusCircleFilled />
                      {cs.removed.length}
                    </>
                  )}

                  <Button
                    size="small"
                    type="text"
                    style={{
                      opacity: codesExpanded.includes(cs.ontology.name) ? 1 : 0.5,
                      fontSize: 12,
                      fontWeight: 'normal',
                    }}
                    icon={codesExpanded.includes(cs.ontology.name) ? <CaretDownFilled /> : <CaretRightFilled />}
                    onClick={() => setCodesExpanded(xor(codesExpanded, [cs.ontology.name]))}>
                    Show codes
                  </Button>
                </Space>
                {codesExpanded.includes(cs.ontology.name) && (
                  <div style={{marginBottom: 6}}>
                    <ChangeSetDisplay
                      changeSet={{added: cs.added.map((c) => c.id), removed: cs.removed.map((c) => c.id)}}
                    />
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </ChangeEntryRoot>
  )
}

export const CodeId = styled.span`
  padding: 0 3px;
  text-transform: uppercase;
  border-radius: 2px;
  border: 1px solid #d9d9d9;
  display: inline-block;
  font-size: 11px;
  white-space: nowrap;
  text-align: right;
  margin-right: 4px;
`

export const Description = styled.p`
  flex: 1;
  margin: 0;
  min-width: 1px;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 8px;
  overflow: hidden;
  padding: 1px;
`
export const ChangeTableRoot = styled.div`
  margin-top: 4px;
  display: grid;
  grid-template-columns: 24px auto 1fr;
  grid-column-gap: 0px;
  grid-row-gap: 0px;
  align-items: center;
`

const ChangeEntryRoot = styled.div<{$transient?: boolean}>`
  font-size: 12px;
  padding: 10px 10px 0 20px;
  /* margin: 6px 0; */
  position: relative;

  &:before {
    position: absolute;
    top: -10px;
    left: 5px;
    bottom: -3px;
    width: 1px;
    background: #000;
    // border-right: 1px solid #000;
    content: '';
  }

  &:after {
    position: absolute;
    content: '';
    height: 7px;
    width: 7px;
    border-radius: 50%;
    top: 14px;
    left: 1px;
    border-width: 1px;
    border-style: ${(props) => (props.$transient ? 'dashed' : 'solid')};
    border-color: #000;
    background: ${(props) => (props.$transient ? '#fff' : '#000')};
  }

  p {
    margin-bottom: 0;
  }

  div.message {
    flex: 1;

    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;

    &.open {
      line-clamp: revert;
      -webkit-line-clamp: revert;
    }
  }

  div.userInfo {
    font-size: 9px;
    color: #595959;
    margin-bottom: 6px;
  }

  .ant-btn-text.ant-btn-sm {
    font-size: 12px;
    font-weight: normal;
  }

  .ant-btn-text.ant-btn-sm .anticon-caret-right,
  .ant-btn-text.ant-btn-sm .anticon-caret-down {
    font-size: 10px;
    margin-right: 0;
  }

  .ant-btn-text.ant-btn-sm > .anticon + span,
  .ant-btn-text.ant-btn-sm > span + .anticon {
    margin-left: 2px;
  }
`

export default ChangeHistory
