import {InfoCircleOutlined} from '@ant-design/icons'
import {styled} from '@linaria/react'
import {Button, Col, Flex, Modal, Row, Switch} from 'antd'
import React, {useMemo, useState} from 'react'
import {Title} from './scratch'
import classNames from 'classnames'
import {useDispatch, useSelector} from 'react-redux'
import {RootState} from './store'
import {toggleInfoBubbles} from './store/ui'
import useTourState from './useTourState'
import Checkbox from './components/Checkbox'
import { omit, some} from 'lodash'

type SettingsProps = {
  onClose: () => void
}

const Settings: React.FC<SettingsProps> = ({onClose}) => {
  const [current, setCurrent] = useState('pref')

  return (
    <Modal open width={600} footer={null} onCancel={onClose}>
      <Content>
        <Flex gap={16}>
          <Nav>
            <ul>
              <li className={classNames({active: current == 'pref'})}>
                <a
                  onClick={(e) => {
                    e.preventDefault()
                    setCurrent('pref')
                  }}
                  href="">
                  <Title>Preference</Title>
                </a>
              </li>
              <li className={classNames({active: current == 'tutorial'})}>
                <a
                  onClick={(e) => {
                    e.preventDefault()
                    setCurrent('medconb')
                  }}
                  href="">
                  <Title>Tutorial</Title>
                </a>
                <ul>
                  <li className={classNames({active: current == 'medconb'})}>
                    <a
                      onClick={(e) => {
                        e.preventDefault()
                        setCurrent('medconb')
                      }}
                      href="">
                      Medical Concept Builder
                    </a>
                  </li>
                  <li className={classNames({active: current == 'ontology'})}>
                    <a
                      onClick={(e) => {
                        e.preventDefault()
                        setCurrent('ontology')
                      }}
                      href="">
                      Ontology Viewer
                    </a>
                  </li>
                </ul>
              </li>
            </ul>
          </Nav>
          <Panel>
            {current === 'pref' && <PreferencePane />}
            {current === 'medconb' && <TutorialConceptBuilder />}
            {current === 'ontology' && <OntologyTutorialConceptBuilder />}
            {/*  */}
          </Panel>
        </Flex>
      </Content>
    </Modal>
  )
}

export default Settings

const PreferencePane = () => {
  const dispatch = useDispatch()
  const enableInfoBubbles = useSelector((state: RootState) => state.ui.enableInfoBubbles)
  return (
    <div>
      <Row>
        <Col flex={1}>
          <Title>General Preferences</Title>
          <span>
            Info bubbles (<InfoCircleOutlined style={{color: '#8c8c8c'}} />) give some guidance on the tools features.
          </span>
        </Col>
        <Col flex={1}>
          <strong>Show info bubbles</strong>
        </Col>
        <Col>
          <Switch
            onChange={() => dispatch(toggleInfoBubbles())}
            style={{marginLeft: 20}}
            size="small"
            checked={enableInfoBubbles}
          />
        </Col>
      </Row>
    </div>
  )
}

const medconbUnits = [
  {text: 'Introduction & Key Features', key: 'welcome'},
  {text: 'Open Objects', key: 'open_objects'},
  {text: 'Collection View', key: 'collection_view'},
  {text: 'Phenotype View', key: 'phenotype_view'},
  {text: 'Search', key: 'search'},
]

const TutorialConceptBuilder = () => {
  const {tutorialState, updateTourState} = useTourState()
  const [checkChanging, setCheckChanging] = useState('')
  const someChecked = useMemo(() => {
    return some(medconbUnits, (unit) => tutorialState?.[unit.key]?.complete === true)
  }, [tutorialState])

  const handleCheckAll = async () => {
    setCheckChanging('all')
    await updateTourState(
      omit(
        tutorialState,
        medconbUnits.map((u) => u.key),
      ),
    )
    setCheckChanging('')
  }
  const handleCheckChange = async (checked: boolean, key: string) => {
    if (!checked) {
      await updateTourState(omit(tutorialState, key))
    } else {
      await updateTourState({
        ...tutorialState,
        [key]: {
          ...tutorialState[key],
          complete: true,
        },
      })
    }
  }
  return (
    <div>
      <Title>Tutorial | Platform how-to</Title>
      <span>In order to watch the unit again, mark as "not learned" by unchecking the checkbox</span>

      <div style={{textAlign: 'right', minHeight: 24}}>
        {someChecked && (
          <Button
            onClick={handleCheckAll}
            disabled={checkChanging === 'all'}
            loading={checkChanging === 'all'}
            ghost
            type="link"
            size="small">
            Uncheck all
          </Button>
        )}
      </div>
      <Flex vertical gap={8}>
        {medconbUnits.map((unit) => (
          <Flex
            key={unit.key}
            gap={8}
            align="center"
            style={{cursor: 'pointer'}}
            onClick={() => handleCheckChange(!tutorialState?.[unit.key]?.complete, unit.key)}>
            <Checkbox
              checked={tutorialState?.[unit.key]?.complete}
              onChange={(checked) => handleCheckChange(checked, unit.key)}
            />
            {unit.text}
          </Flex>
        ))}
      </Flex>
    </div>
  )
}

const ontologyViewerUnits = [{text: 'The Ontology Viewer', key: 'ontology_viewer'}]

const OntologyTutorialConceptBuilder = () => {
  const {tutorialState, updateTourState} = useTourState()

  const someChecked = useMemo(() => {
    return some(ontologyViewerUnits, (unit) => tutorialState?.[unit.key]?.complete === true)
  }, [tutorialState])

  const [checkChanging, setCheckChanging] = useState('')
  const handleUncheckAll = async () => {
    setCheckChanging('all')
    await updateTourState(
      omit(
        tutorialState,
        ontologyViewerUnits.map((u) => u.key),
      ),
    )
    setCheckChanging('')
  }
  const handleCheckChange = async (checked: boolean, key: string) => {
    if (!checked) {
      await updateTourState(omit(tutorialState, key))
    } else {
      await updateTourState({
        ...tutorialState,
        [key]: {
          ...tutorialState[key],
          complete: true,
        },
      })
    }
  }
  return (
    <div>
      <Title>Tutorial | Ontology Viewer how-to</Title>
      <span>In order to watch the unit again, mark as "not learned" by unchecking the checkbox</span>

      <div style={{textAlign: 'right', minHeight: 24}}>
        {someChecked && (
          <Button
            onClick={handleUncheckAll}
            disabled={checkChanging === 'all'}
            loading={checkChanging === 'all'}
            ghost
            type="link"
            size="small">
            Uncheck all
          </Button>
        )}
      </div>
      <Flex vertical gap={8}>
        {ontologyViewerUnits.map((unit) => (
          <Flex
            key={unit.key}
            gap={8}
            align="center"
            style={{cursor: 'pointer'}}
            onClick={() => handleCheckChange(!tutorialState?.[unit.key]?.complete, unit.key)}>
            <Checkbox
              checked={tutorialState?.[unit.key]?.complete}
              onChange={(checked) => handleCheckChange(checked, unit.key)}
            />
            {unit.text}
          </Flex>
        ))}
      </Flex>
    </div>
  )
}

const Content = styled.div`
  padding: 16px;
`

const Nav = styled.div`
  width: 200px;

  ul {
    padding: 0;
    margin: 0;
    position: relative;
    list-style-type: none;
    list-style-image: none;

    &::before {
      content: ' ';
      position: absolute;
      width: 3px;
      top: 0;
      bottom: 0;
      left: -3px;
      background: #d9d9d9;
    }

    li {
      position: relative;
      a {
        padding: 4px 4px 4px 8px;
        color: #262626;
        display: block;

        &:hover {
          background: #f0f0f0;
        }
      }

      &.active::before {
        content: ' ';
        position: absolute;
        width: 3px;
        top: 0;
        bottom: 0;
        left: -3px;
        background: #00bcff;
      }

      & > ul {
        li {
          a {
            padding-left: 16px;
          }
        }
      }
    }
  }
`
const Panel = styled.div`
  flex: 1;
`
