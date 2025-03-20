import {CaretDownFilled, CaretRightFilled, EllipsisOutlined} from '@ant-design/icons'
import {styled} from '@linaria/react'
import {Button, Space} from 'antd'
import React, {useCallback, useState} from 'react'
import {IndicatorIndex, Codelist} from '..'
import ConceptIndicator from './components/ConceptIndicator'
import {ChangedCount, Count, Title} from './scratch'
import Editor from '@broncha/rich-markdown-editor'
import {useDebouncedCallback} from 'use-debounce'
import {useMutation} from '@apollo/client'
import {FETCH_CODE_LIST, UPDATE_CODE_LIST} from './graphql'
import CodeListChangeHistory from './CodeListChangeHistory'
import {useSelector} from 'react-redux'
import {RootState} from './store'
import {ReadMode} from './store/workspace'
import Icon from '@ant-design/icons/lib/components/Icon'
import {GoIcon} from './customIcons'
import {readonlyMapSelector} from './store/selectors'

type CodeListDetailsProps = {
  initialContent?: 'description' | 'history'
  collectionID: string
  codelist: Codelist
  onMinimize: () => void
  indicator: {
    animal: IndicatorIndex
    color: string
  }
  codeSetSummary: {
    ontology: string
    codes: number
    changed: boolean
  }[]
}
const CodeListDetails: React.FC<CodeListDetailsProps> = ({
  indicator,
  collectionID,
  codelist,
  onMinimize,
  codeSetSummary,
  initialContent = 'description',
}) => {
  const [descOpen, setDescOpen] = useState(initialContent == 'description')
  const [historyOpen, setHistoryOpen] = useState(initialContent == 'history')
  const [updateConcept, __] = useMutation(UPDATE_CODE_LIST, {
    refetchQueries: [{query: FETCH_CODE_LIST, variables: {collectionID, codelistID: codelist.id}}],
  })
  const readonlyMap = useSelector((state: RootState) => readonlyMapSelector(state))

  const debouncedOnEditorChange = useDebouncedCallback((getCotent) => {
    updateConcept({
      variables: {
        collectionID,
        codelistID: codelist.id,
        name: codelist.name,
        description: getCotent(),
      },
    })
  }, 400)

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
  return (
    <Root>
      <div style={{position: 'sticky', top: 0, background: '#fff', zIndex: 2}}>
        <Header>
          <ConceptIndicator color={indicator.color} index={indicator.animal} onClick={() => {}} />
          <div style={{flex: 1, marginRight: 10, marginLeft: 10}}>
            <Title>{codelist.name}</Title>
            <Space size={'middle'}>
              {codeSetSummary.map((codeset) => (
                <Indicator key={codeset.ontology}>
                  <span>{codeset.ontology}</span>
                  {codeset.changed && <ChangedCount>{codeset.codes}</ChangedCount>}
                  {!codeset.changed && <Count>{codeset.codes}</Count>}
                </Indicator>
              ))}
            </Space>
          </div>

          <Space style={{marginLeft: 10}}>
            <Button size="small" type="text" icon={<EllipsisOutlined />} onClick={console.log} />
            <Button
              size="small"
              type="text"
              icon={<Icon component={() => <GoIcon />} style={{rotate: '90deg'}} />}
              onClick={onMinimize}
            />
          </Space>
        </Header>
        <Content>
          <Space>
            <Button
              size="small"
              type="text"
              icon={descOpen ? <CaretDownFilled /> : <CaretRightFilled />}
              style={{opacity: descOpen ? 1 : 0.5, letterSpacing: 1}}
              onClick={handleDescToggle}>
              DESCRIPTION
            </Button>

            <Button
              size="small"
              type="text"
              icon={historyOpen ? <CaretDownFilled /> : <CaretRightFilled />}
              style={{opacity: historyOpen ? 1 : 0.5, letterSpacing: 1}}
              onClick={handleHistoryToggle}>
              CHANGE HISTORY
            </Button>
          </Space>
        </Content>
      </div>
      <Content>
        <div>
          {descOpen && (
            <div style={{overflowY: 'auto'}}>
              <Editor
                readOnly={readonlyMap[codelist.id] === ReadMode.READONLY}
                disableExtensions={['checkbox_item', 'checkbox_list', 'container_notice']}
                defaultValue={codelist.description}
                onChange={debouncedOnEditorChange}
              />
            </div>
          )}
          {historyOpen && (
            <CodeListChangeHistory collectionID={collectionID} key={codelist.id} codelistID={codelist.id} />
          )}
        </div>
      </Content>
    </Root>
  )
}

export default CodeListDetails

const Root = styled.div`
  position: relative;
  .ant-btn.ant-btn-sm {
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

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  align-items: flex-start;
  padding: 24px 24px 0 24px;
`

const Indicator = styled.div`
  font-size: 9px;
  color: #8c8c8c;
`

const Content = styled.div`
  padding: 10px 60px;
`
