import Icon, {
  CaretDownFilled,
  CaretRightFilled,
  LoadingOutlined,
  MinusCircleFilled,
  PlusCircleFilled,
} from '@ant-design/icons'
import {useMutation} from '@apollo/client'
import {styled} from '@linaria/react'
import {Button, Flex, Input, Modal, Space, Spin, Typography} from 'antd'
import {keys, xor} from 'lodash'
import React, {CSSProperties, memo, useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {useDispatch} from 'react-redux'
import {areEqual, FixedSizeList as List} from 'react-window'
import {Codelist, LocalCode} from '..'
import ErrorHandlerContext from './ErrorHandlerContext'
import {CodeId, Description} from './components/ChangeHistory'
import Checkbox from './components/Checkbox'
import {CloseIcon} from './customIcons'
import {db} from './db'
import {COMMIT_CODELIST_CHANGES, FETCH_CODE_LIST_CHANGE_SET} from './graphql'
import {Title} from './scratch'
import {clearChangeSet} from './store/changes'
import {endSave, startSave} from './store/ui'
import {ChangeSet} from './store/workspace'
import useChangeSet from './useChangeSet'

type SaveCodelistProps = {
  codelist: Codelist
  collectionID: string
  onClose: () => void
}

const {Text} = Typography
const {TextArea} = Input

const SaveCodelist: React.FC<SaveCodelistProps> = ({codelist, onClose, collectionID}) => {
  const [working, setWorking] = useState(false)
  const dispatch = useDispatch()
  const {onError} = useContext(ErrorHandlerContext)
  const changes = useChangeSet()
  const changeSet = changes[codelist.id]
  const [checked, setChecked] = useState<string[]>([])
  const [commitMessage, setCommitMessage] = useState<string>('')
  const [codesExpanded, setCodesExpanded] = useState<string[]>([])

  const [commitChanges] = useMutation(COMMIT_CODELIST_CHANGES, {
    refetchQueries: [{query: FETCH_CODE_LIST_CHANGE_SET, variables: {codelistID: codelist.id}}],
  })

  useEffect(() => {
    setChecked(
      keys(changeSet).filter(
        (ontology) => !(changeSet[ontology].added.length === 0 && changeSet[ontology].removed.length === 0),
      ),
    )
  }, [changeSet])

  const allSelected = useMemo(() => checked.length === keys(changeSet).length, [checked, changeSet])
  const indeterminate = useMemo(
    () => checked.length > 0 && checked.length < keys(changeSet).length,
    [checked, changeSet],
  )

  const handleSelectAll = useCallback(() => {
    //() => setChecked(checked.length ? keys(changeSet) : [])
    if (allSelected) {
      setChecked([])
    } else {
      setChecked(keys(changeSet))
    }
  }, [checked])

  const valid = useMemo(() => {
    return commitMessage.trim() !== ''
  }, [commitMessage])

  const handleCommit = useCallback(async () => {
    if (!valid) {
      return
    }
    const changes = []
    setWorking(true)
    dispatch(startSave())
    for (const ontology in changeSet) {
      if (!checked.includes(ontology)) {
        continue
      }
      if (changeSet[ontology].added.length === 0 && changeSet[ontology].removed.length === 0) continue
      changes.push({
        ontologyID: ontology,
        added: changeSet[ontology].added ?? [],
        removed: changeSet[ontology].removed ?? [],
      })
    }
    try {
      await commitChanges({
        variables: {
          codelistID: codelist.id,
          commit: {
            message: commitMessage,
            changes,
          },
        },
        awaitRefetchQueries: true,
      })
      dispatch(clearChangeSet(codelist.id))
      onClose()
    } catch (error) {
      onError(error as Error)
    } finally {
      dispatch(endSave())
      setWorking(false)
    }
  }, [checked, commitMessage, changeSet, collectionID])

  return (
    <>
      <Modal
        footer={false}
        title={false}
        open={true}
        onCancel={onClose}
        closeIcon={<Icon component={() => <CloseIcon />} />}>
        <>
          <Title>{`Create Checkpoint`}</Title>
          <Summary>
            <Checkbox checked={allSelected} indeterminate={indeterminate} onChange={handleSelectAll} />
            <Title>{codelist.name}</Title>

            <span />
            <div>
              <MyTextArea
                value={commitMessage}
                status={!valid ? 'error' : undefined}
                onChange={(e) => setCommitMessage(e.target.value)}
                rows={2}
                placeholder="Add a change comment"
              />
              {!valid && <span style={{color: '#ff4d4f'}}>Commit message is required!</span>}
            </div>

            {keys(changeSet)
              .filter(
                (ontology) => !(changeSet[ontology].added.length === 0 && changeSet[ontology].removed.length === 0),
              )
              .map((ontology) => (
                <React.Fragment key={ontology}>
                  <span></span>
                  <div>
                    <Space align="center">
                      <Checkbox
                        checked={checked.includes(ontology) ?? false}
                        onChange={() => setChecked(xor(checked, [ontology]))}
                      />
                      <Text>{ontology}</Text>
                      {changeSet[ontology].added.length > 0 && (
                        <>
                          <PlusCircleFilled style={{color: '#00BCFF'}} />
                          {changeSet[ontology].added.length}
                        </>
                      )}
                      {changeSet[ontology].removed.length > 0 && (
                        <>
                          <MinusCircleFilled />
                          {changeSet[ontology].removed.length}
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
                      <ChangeSetDisplay style={{paddingLeft: 25}} changeSet={changeSet[ontology]} />
                    )}
                  </div>
                </React.Fragment>
              ))}
          </Summary>
          <div style={{textAlign: 'right', marginTop: 20}}>
            <Space>
              <Button size="small" onClick={onClose}>
                Cancel
              </Button>
              <Button
                loading={working}
                disabled={!valid || working || checked.length === 0}
                size="small"
                type="primary"
                onClick={handleCommit}>
                Save
              </Button>
            </Space>
          </div>
        </>
      </Modal>
      {/* <Button size="small" type="primary" onClick={() => setVisible(true)}>
        Save
      </Button> */}
    </>
  )
}

export const ChangeSetDisplay = ({changeSet, style}: {changeSet: ChangeSet['string']; style?: CSSProperties}) => {
  const [_codes, setCodes] = useState<{code: LocalCode; op: 'added' | 'removed'}[]>()
  useEffect(() => {
    setTimeout(() => {
      void (async function () {
        let _added, _removed
        if ((changeSet.added ?? []).length > 0) {
          _added = (await db.codes.bulkGet(changeSet.added.map((c) => Number(c)))) as LocalCode[]
        } else {
          _added = [] as LocalCode[]
        }
        if ((changeSet.removed ?? []).length > 0) {
          _removed = (await db.codes.bulkGet(changeSet.removed.map((c) => Number(c)))) as LocalCode[]
        } else {
          _removed = [] as LocalCode[]
        }
        setCodes(
          _added.map((a) => ({code: a, op: 'added'})).concat(_removed.map((a) => ({code: a, op: 'removed'}))) as {
            code: LocalCode
            op: 'added' | 'removed'
          }[],
        )
      })()
    }, 1)
  }, [changeSet])
  return (
    <div style={style}>
      {!_codes && <Spin indicator={<LoadingOutlined style={{fontSize: 14}} spin />} />}
      {_codes && (
        <List
          height={_codes.length > 13 ? 300 : _codes.length * 22}
          itemCount={_codes.length}
          itemSize={22}
          width={'100%'}>
          {({index, style}) => {
            const code = _codes[index]
            return <VCodeDisplay style={style} op={code.op} code={code.code} key={code.code.id} />
          }}
        </List>
      )}
    </div>
  )
}

type CodeDisplayProps = {
  code: LocalCode
  op: 'added' | 'removed'
  style?: CSSProperties
}

const VCodeDisplay: React.FC<CodeDisplayProps> = memo(({code, op, style}) => {
  return (
    <CodeRoot gap={4} style={style} align="center">
      {op === 'added' ? <PlusCircleFilled style={{color: '#00BCFF'}} /> : <MinusCircleFilled />}

      <CodeId>{code.code}</CodeId>
      <Description>{code.description}</Description>
    </CodeRoot>
  )
}, areEqual)

export default SaveCodelist

const CodeRoot = styled(Flex)``

const Summary = styled.div`
  display: grid;
  grid-template-columns: 20px 1fr;
  grid-template-rows: repeat(auto-fill, auto);
  grid-column-gap: 10px;
  grid-row-gap: 20px;
  margin-top: 20px;
`

const MyTextArea = styled(TextArea)`
  /* border: 1px solid transparent; */
`
