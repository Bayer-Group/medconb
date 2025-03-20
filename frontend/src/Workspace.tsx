import {styled} from '@linaria/react'
import React, {useMemo} from 'react'
import OntologyViewer from './OntologyViewer'
import {useDispatch, useSelector} from 'react-redux'
import {RootState} from './store'
import {addPane, closePane} from './store/workspace'
import {ReflexContainer, ReflexSplitter, ReflexElement} from 'react-reflex'
import {flatMap} from 'lodash'
import RightPanel from './RightPanel'
import {Button, Space} from 'antd'
import {toggleRightPanelItem} from './store/ui'
import Icon from '@ant-design/icons/lib/components/Icon'
import {CollapseIcon} from './customIcons'

type WorkspaceProps = {}

const Workspace: React.FC<WorkspaceProps> = () => {
  const dispatch = useDispatch()
  const panes = useSelector((state: RootState) => state.workspace.panes)
  const numOpenConcepts = useSelector((state: RootState) => state.workspace.openCodelists.length)
  const activeSidePanel = useSelector((state: RootState) => state.ui.activeSidePanel)
  const handleAddPane = () => {
    dispatch(addPane())
  }

  const handlePaneClose = (paneId: string) => {
    dispatch(closePane({paneId}))
  }

  const paneElements = useMemo(() => {
    const elements = panes.map((pane, i) => (
      <ReflexElement
        minSize={
          numOpenConcepts * 32 /* indicator icons */ + 135 /* ontology selector */ + 120 /*search icon and dropdown */
        }
        key={pane.id}>
        <OntologyViewer
          pane={pane}
          key={pane.id}
          onPaneAdd={panes.length === 2 ? undefined : handleAddPane}
          onPaneClose={i > 0 ? () => handlePaneClose(pane.id) : undefined}
        />
      </ReflexElement>
    ))

    const withSplitter = flatMap(elements, (value, index, array) =>
      array.length - 1 !== index // check for the last item
        ? [value, <ReflexSplitter key={`splitter__${index}`} />]
        : value,
    )

    if (activeSidePanel === 'active_concepts') {
      withSplitter.push(
        <ReflexElement maxSize={342} minSize={342} key={'sidebar'}>
          <RightPanel />
        </ReflexElement>,
      )
    }

    withSplitter.push(
      <ReflexElement maxSize={40} key={'toolbar'}>
        <RightToolBar value={activeSidePanel} onChange={(item) => dispatch(toggleRightPanelItem(item))} />
      </ReflexElement>,
    )

    return withSplitter
  }, [panes, activeSidePanel])

  return (
    // <Root>
    <ReflexContainer orientation="vertical">{paneElements}</ReflexContainer>
    // </Root>
  )
}

export default Workspace

type RightToolBarProps = {
  onChange: (type: string) => void
  value?: string
}

const RightToolBar: React.FC<RightToolBarProps> = ({onChange, value}) => {
  return (
    <RightToolBarRoot>
      <Space direction="vertical">
        {/* <Button
          style={{transform: 'rotate(90deg) translateY(-24px)', transformOrigin: 'top left'}}
          size="small"
          type={value === 'active_concepts' ? 'primary' : 'default'}
          onClick={() => onChange('active_concepts')}
          // icon={<UnorderedListOutlined />}
        >
          ACTIVE CONCEPTS
        </Button> */}
        {/* <div
          style={{
            background: '#fff',
            borderTopRightRadius: 3,
            borderBottomRightRadius: 3,
            display: 'inline-block',
            boxShadow: '0px 0px 30px 6px rgba(0,0,0,0.16)',
            position: 'absolute',
          }}> */}
        <Button
          type="link"
          icon={
            <Icon
              component={() => <CollapseIcon />}
              style={{transform: value === 'active_concepts' ? 'rotateY(180deg)' : 'rotateY(0deg)'}}
            />
          }
          onClick={() => onChange('active_concepts')}></Button>
        {/* </div> */}
      </Space>
    </RightToolBarRoot>
  )
}
//style={{transform: 'rotateY(180deg)'}}
const RightToolBarRoot = styled.div`
  padding: 4px;
`
