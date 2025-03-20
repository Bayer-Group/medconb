import Icon, {
  CaretDownFilled,
  CaretRightFilled,
  EllipsisOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  CheckOutlined,
  CloudSyncOutlined,
} from '@ant-design/icons'
import {styled} from '@linaria/react'
import {Button, Checkbox, Dropdown, Modal, Space, Typography, Spin} from 'antd'
import ConceptIndicator from './components/ConceptIndicator'
import {ChangedCount, Count, SubTitle, Title} from './scratch'
import {IndicatorIndex, Codelist} from '..'
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import Editor from '@broncha/rich-markdown-editor'
import {useDispatch, useSelector} from 'react-redux'
import {RootState} from './store'
import {isEqual, keys, mapKeys, mapValues, omitBy, some, union, xor} from 'lodash'
import {useDebouncedCallback} from 'use-debounce'
import {useMutation} from '@apollo/client'
import {DISCARD_TRANSIENT_CHANGES, FETCH_CODE_LIST, UPDATE_CODE_LIST} from './graphql'
import MedicalConceptDetails from './CodeListDetails'
import {ReadMode, toggleAllPaneBusy} from './store/workspace'
import SaveCodelist from './SaveCodelist'
import CodelistChangeHistory from './CodeListChangeHistory'
import useChangeSet from './useChangeSet'
import withCodelist from './withCodelist'
import {CloseIcon, GoIcon} from './customIcons'
import {SaveState, clearChangeSet} from './store/changes'
import {MenuInfo} from 'rc-menu/lib/interface'

import {readonlyMapSelector} from './store/selectors'
import DiscardDialog, {SUPRESS_DISCARD_WARNING_STATE, useSupressDiscardWarning} from './DiscardDialog'

type CodeListSummaryProps = {
  collectionID: string
  codelistID: Codelist['id']
  codelist: Codelist
  onClose: () => void
  indicator: {
    animal: IndicatorIndex
    color: string
  }
}

const CodeListSummary: React.FC<CodeListSummaryProps> = ({indicator, collectionID, codelist, onClose}) => {
  const dispatch = useDispatch()
  const isComparisionMode = useSelector((state: RootState) => state.workspace.isComparisionMode)
  const path = useSelector((state: RootState) => state.workspace.pathById[codelist.id])
  const readonlyMap = useSelector((state: RootState) => readonlyMapSelector(state))
  const codelistSaveState = useSelector((state: RootState) => state.changes.codelistSaveState)
  const transient = useSelector((state: RootState) => state.workspace.transientChangeSet)
  const [supress] = useSupressDiscardWarning()

  const [descOpen, setDescOpen] = useState(!isComparisionMode)
  useEffect(() => {
    if (isComparisionMode) {
      setDescOpen(false)
    }
  }, [isComparisionMode])
  const [detailOpen, setDetailOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  // Key used to reset editor state, when coming back from the modal
  const [editorKey, setEditorKey] = useState(0)
  const [modal, contextHolder] = Modal.useModal()

  const changeSetMap = useChangeSet()
  const changeSet = useMemo(() => {
    const _changeset = changeSetMap[codelist.id]
    return omitBy(_changeset, (t) => (t.added ?? []).length === 0 && (t.removed ?? []).length === 0)
  }, [changeSetMap, codelist.id])
  const transientChangeSet = useMemo(() => {
    const _transient = transient[codelist.id]
    return omitBy(_transient, (t) => (t.added ?? []).length === 0 && (t.removed ?? []).length === 0)
  }, [transient, codelist.id])

  const [updateConcept] = useMutation(UPDATE_CODE_LIST, {
    refetchQueries: [{query: FETCH_CODE_LIST, variables: {collectionID, codelistID: codelist.id}}],
  })
  const [discardTransientChanges] = useMutation(DISCARD_TRANSIENT_CHANGES, {
    refetchQueries: [{query: FETCH_CODE_LIST, variables: {collectionID, codelistID: codelist.id}}],
  })

  const counts = useMemo(
    () => mapValues(changeSet, (change) => change.added.length - change.removed.length),
    [changeSet],
  )

  const changed = useMemo(
    () => mapValues(changeSet, (change) => change.added.length > 0 || change.removed.length > 0),
    [changeSet],
  )

  const unsavedChanges = useMemo(() => {
    const baseOntologies = keys(changeSet)
    const transientOntologies = keys(transientChangeSet)

    return union(baseOntologies, transientOntologies).reduce((a, c) => {
      a[c] = !isEqual(changeSet?.[c], transientChangeSet?.[c])
      return a
    }, {} as {[key: string]: boolean})
  }, [changeSet, transientChangeSet])
  const computedCodeSet = useMemo(() => {
    const originalOntologies = codelist.codesets.map((cs) => cs.ontology.name)
    // merge transient codeset
    const transientFromNewOntologies = keys(changeSet)
      .filter((ontology) => !originalOntologies.includes(ontology))
      .map((ontology) => ({
        ontology,
        codes: changeSet[ontology].added.length - changeSet[ontology].removed.length,
        changed: true,
        hasUnsaved: unsavedChanges[ontology],
      }))
      .filter((cs) => cs.codes !== 0)
    return codelist.codesets
      .map((codeset) => ({
        ontology: codeset.ontology.name,
        codes: codeset.codes.length + (counts[codeset.ontology.name] ?? 0),
        changed: changed[codeset.ontology.name] ?? false,
        hasUnsaved: unsavedChanges[codeset.ontology.name],
      }))
      .concat(transientFromNewOntologies)
  }, [counts, changeSet, changed, codelist.codesets, unsavedChanges])

  const hasChanges = useMemo(() => some(computedCodeSet, (c) => c.changed === true), [computedCodeSet])
  const hasUnsavedChanges = useMemo(() => some(computedCodeSet, (c) => c.hasUnsaved === true), [computedCodeSet])

  const debouncedOnEditorChange = useDebouncedCallback((getContent) => {
    void updateConcept({
      variables: {
        collectionID,
        codelistID: codelist.id,
        name: codelist.name,
        description: getContent(),
      },
    })
  }, 400)

  const doDiscardChanges = useCallback(async () => {
    dispatch(toggleAllPaneBusy(true))
    await discardTransientChanges({
      variables: {
        collectionID,
        codelistID: codelist.id,
      },
      onCompleted: () => {
        dispatch(clearChangeSet(codelist.id))
        dispatch(toggleAllPaneBusy(false))
      },
      awaitRefetchQueries: true,
    })
  }, [])

  const handleDiscardChanges = useCallback(async () => {
    if (supress === SUPRESS_DISCARD_WARNING_STATE.true) {
      await doDiscardChanges()
      return
    }

    await modal.confirm({
      title: 'Confirm',
      icon: <ExclamationCircleOutlined />,
      content: <DiscardDialog changeSet={changeSet} codelist={codelist} />,
      okText: 'Discard',
      cancelText: 'Cancel',
      onOk: async () => {
        await doDiscardChanges()
      },
      width: 600,
    })
  }, [codelist])

  const handleDescToggle = useCallback(() => {
    if (descOpen) {
      setDescOpen(false)
    } else {
      setDescOpen(true)
      setHistoryOpen(false)
    }
  }, [descOpen])

  const handleHistoryToggle = useCallback(() => {
    if (historyOpen) {
      setHistoryOpen(false)
    } else {
      setHistoryOpen(true)
      setDescOpen(false)
    }
  }, [historyOpen])

  const menuItems = useMemo(() => {
    if (hasChanges) {
      return [
        {label: 'Create Checkpoint', key: 'save'},
        {label: 'Revert to Checkpoint', key: 'discard', danger: true},
      ]
    }
    return []
  }, [hasChanges])

  const handleMenuClick = (info: MenuInfo) => {
    if (info.key === 'discard') {
      void handleDiscardChanges()
    } else if (info.key === 'save') {
      setSaving(true)
    }
  }

  return (
    <Root data-codelist-summary data-codelist-summary-id={codelist.id}>
      {contextHolder}
      <Modal
        style={{top: 20}}
        width={800}
        styles={{
          body: {height: 'calc(100vh - 50px)', padding: 0, maxHeight: 'calc(100vh - 50px)', overflowY: 'auto'},
        }}
        closable={false}
        open={detailOpen}
        onCancel={() => {
          setEditorKey(editorKey + 1)
          setDetailOpen(false)
        }}
        footer={null}>
        <MedicalConceptDetails
          initialContent={historyOpen ? 'history' : undefined}
          key={`detail-${editorKey}`}
          collectionID={collectionID}
          codelist={codelist}
          indicator={indicator}
          onMinimize={() => {
            setEditorKey(editorKey + 1)
            setDetailOpen(false)
          }}
          codeSetSummary={computedCodeSet}
        />
      </Modal>
      {saving && (
        <SaveCodelist
          onClose={() => setSaving(false)}
          collectionID={collectionID}
          key={codelist.id}
          codelist={codelist}
        />
      )}

      <Header>
        <Space>
          <ConceptIndicator color={indicator.color} index={indicator.animal} onClick={() => {}} />
          {codelistSaveState[codelist.id] === SaveState.SAVING && (
            <Spin indicator={<LoadingOutlined style={{fontSize: 24}} spin />} />
          )}
          {!hasUnsavedChanges && codelistSaveState[codelist.id] === SaveState.SAVED && (
            <Icon component={() => <CheckOutlined />} />
          )}
          {hasUnsavedChanges && codelistSaveState[codelist.id] !== SaveState.SAVING && (
            <Icon component={() => <CloudSyncOutlined />} />
          )}
        </Space>
        <Space>
          <Button
            size="small"
            type="text"
            icon={<Icon component={() => <GoIcon />} />}
            onClick={() => setDetailOpen(true)}
          />
          {menuItems.length > 0 && (
            <Dropdown menu={{items: menuItems, onClick: handleMenuClick}} trigger={['click']}>
              <Button
                onClick={(e) => e.stopPropagation()}
                size="small"
                type="text"
                icon={<EllipsisOutlined />}></Button>
            </Dropdown>
          )}
          <Button size="small" type="text" icon={<Icon component={() => <CloseIcon />} />} onClick={() => onClose()} />
        </Space>
      </Header>
      <Title>{codelist.name}</Title>
      {path?.length > 0 && <SubTitle>{path.join(' / ')}</SubTitle>}
      <div>
        <Space size={'middle'}>
          {computedCodeSet.map((codeset) => (
            <Indicator key={codeset.ontology}>
              <span>{codeset.ontology}</span>
              {codeset.hasUnsaved && <ChangedCount data-codelist-state="changed">{codeset.codes}</ChangedCount>}
              {!codeset.hasUnsaved && <Count>{codeset.codes}</Count>}
            </Indicator>
          ))}
        </Space>
      </div>
      <Space>
        <Button
          size="small"
          type="text"
          icon={descOpen ? <CaretDownFilled /> : <CaretRightFilled />}
          style={{opacity: descOpen ? 1 : 0.5, fontSize: 10, letterSpacing: 1}}
          onClick={handleDescToggle}>
          DESCRIPTION
        </Button>

        <Button
          size="small"
          type="text"
          icon={historyOpen ? <CaretDownFilled /> : <CaretRightFilled />}
          style={{opacity: historyOpen ? 1 : 0.5, fontSize: 10, letterSpacing: 1}}
          onClick={handleHistoryToggle}>
          CHANGE HISTORY
        </Button>
      </Space>
      {(descOpen || historyOpen) && (
        <div style={{maxHeight: 300, minHeight: 300, overflowY: 'auto'}}>
          {descOpen && (
            <Editor
              readOnly={readonlyMap[codelist.id] === ReadMode.READONLY}
              key={`editor-${editorKey}`}
              disableExtensions={['checkbox_item', 'checkbox_list', 'container_notice']}
              defaultValue={codelist.description}
              onChange={debouncedOnEditorChange}
            />
          )}
          {historyOpen && (
            <CodelistChangeHistory collectionID={collectionID} key={codelist.id} codelistID={codelist.id} />
          )}
        </div>
      )}
      {detailOpen && <Overlay />}
    </Root>
  )
}

export default withCodelist(CodeListSummary)

const Root = styled.div`
  background: #fff;
  padding: 8px 12px;
  margin-bottom: 12px;
  position: relative;
  border-radius: 3px;
  box-shadow: 0px 0px 12px rgba(100, 139, 216, 0.05);
  border: 1px solid #f5f5f5;

  &.highlighted {
    box-shadow: 0px 0px 52px rgba(0, 0, 0, 0.16);
    border: 1px solid #00bcff;
  }

  .ant-btn.ant-btn-sm {
    font-size: 12px;
  }

  .ant-btn.ant-btn-sm .anticon-caret-right {
    font-size: 10px;
  }

  .ant-btn-text.ant-btn-sm {
    font-size: 10px;
    font-weight: bold;
    color: #262626;
    opacity: 0.5;
    padding-left: 0;
  }

  .ant-btn-text.ant-btn-sm .anticon-caret-right {
    font-size: 10px;
  }

  .ProseMirror {
    h1 {
      font-size: 14px;
      font-weight: 600;
      line-height: 22px;
      letter-spacing: 0em;
      text-align: left;
      margin-bottom: 0;
    }

    h2 {
      font-size: 13px;
      font-weight: 600;
      line-height: 22px;
      letter-spacing: 0em;
      text-align: left;
      margin-bottom: 0;
    }

    h3 {
      font-size: 11px;
      font-weight: 600;
      line-height: 20px;
      letter-spacing: 0em;
      text-align: left;
      margin-bottom: 0;
    }
  }
`

const Overlay = styled.div`
  position: absolute;
  inset: 0;
  background: #fff;
`

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
`

// const Title = styled.h2`
//   font-size: 12px;
//   font-weight: 600;
// `

const Indicator = styled.div`
  font-size: 9px;
  color: #8c8c8c;
`
