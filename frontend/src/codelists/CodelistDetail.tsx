import {CaretDownFilled} from '@ant-design/icons'
import Icon from '@ant-design/icons/lib/components/Icon'
import {useQuery} from '@apollo/client'
import Editor from '@broncha/rich-markdown-editor'
import {styled} from '@linaria/react'
import {Button, Col, Dropdown, Flex, Row, Skeleton, Space, Typography} from 'antd'
import {first} from 'lodash'
import React, {useEffect, useMemo, useState} from 'react'
import Scrollbars from 'react-custom-scrollbars-2'
import {useSelector} from 'react-redux'
import useMeasure from 'react-use-measure'
import {FixedSizeList as List} from 'react-window'
import {CodeSet, LocalCode} from '../..'
import BreadCrumbs, {BreadCrumbItem} from '../components/BreadCrumbs'
import SelectOntology from '../components/SelectOntology'
import Visibility from '../components/Visibility'
import {CloseIcon} from '../customIcons'
import {FETCH_CODE_LIST} from '../graphql'
import {Count, ToggleButton} from '../scratch'
import {RootState} from '../store'
import {containerHierarchyToBreadcrumbItems} from '../utils'
import useCodelistActions from './useCodelistActions'
import {db} from '../db'

type CodelistDetailProps = {
  id: string
  navigateEntity: (type: string, id: string) => void
  onClose?: () => void
}

const CodelistDetail: React.FC<CodelistDetailProps> = ({id, navigateEntity, onClose}) => {
  const [descOpen, setDescOpen] = useState(true)
  const [codes, setCodes] = useState<LocalCode[]>()
  // const client = useApolloClient()
  // const {ontologies} = client.readQuery({query: ONTOLOGIES})
  const allowComparision = useSelector((state: RootState) => state.workspace.openCodelists.length > 0)
  const {loading, error, data} = useQuery(FETCH_CODE_LIST, {
    variables: {
      codelistID: id,
    },
    fetchPolicy: 'network-only',
  })

  const ontologies = useMemo(() => {
    if (!data) return []
    return data.codelist.codesets.map((codeset: CodeSet) => codeset.ontology)
  }, [data])

  const [ontology, setOntology] = useState(ontologies[0])

  useEffect(() => {
    setOntology(ontologies[0])
  }, [ontologies])

  const codeset: CodeSet | undefined =
    first(data?.codelist.codesets.filter((c: CodeSet) => c.ontology.name === ontology?.name)) ?? undefined

  useEffect(() => {
    const codeset = first(data?.codelist.codesets.filter((c: CodeSet) => c.ontology.name === ontology?.name))

    if (codeset) {
      db.codes.bulkGet(codeset.codes.map((c) => Number(c.id))).then((_codes) => {
        setCodes(_codes)
      })
    }
  }, [ontology?.name])

  const {menuItems, handleMenuClick} = useCodelistActions(
    data?.codelist,
    data?.codelist.containerHierarchy[0]?.visibility !== 'Private',
    allowComparision,
  )

  if (!data) {
    return (
      <Root>
        <Skeleton />
      </Root>
    )
  }

  const handleBreadCrumbClick = (item: BreadCrumbItem) => {
    const itemType = ['PhenotypeCollection', 'CodelistCollection'].includes(item.type) ? 'Collection' : item.type
    if (navigateEntity) {
      navigateEntity(itemType, item.id)
    }
  }

  return (
    <Root>
      <Row style={{marginBottom: 20}} justify={'space-between'}>
        <Col>
          <Flex align="center" gap={8} style={{marginBottom: 4}}>
            <Visibility visibility={data.codelist.containerHierarchy[0].visibility} />
            <Typography.Title style={{marginBottom: 0}} level={4}>
              {data.codelist.name}
            </Typography.Title>
          </Flex>
          <BreadCrumbs
            // visibility={data.codelist.containerHierarchy[0]?.visibility}
            onClick={handleBreadCrumbClick}
            items={containerHierarchyToBreadcrumbItems('Codelist', data.codelist.containerHierarchy)}
          />
          {/* {data.codelist.referenceID && (
            <div>
              <Space>
                <LinkOutlined />
                <CollectionDisplay
                  onClick={() => {
                    navigateEntity('Phenotype', data.codelist.referenceID)
                  }}
                  collectionID={data.codelist.referenceID}
                />
              </Space>
            </div>
          )} */}
          <div>
            <Space size={'middle'}>
              {(data.codelist.codesets ?? []).map((codeset: CodeSet) => (
                <Indicator key={codeset.ontology.name}>
                  <span>{codeset.ontology.name}</span>
                  <Count>{codeset.codes.length}</Count>
                </Indicator>
              ))}
            </Space>
          </div>
        </Col>
        <Col flex={1}>
          <Flex justify="flex-end" gap={8}>
            <Dropdown menu={{items: menuItems, onClick: handleMenuClick}} placement="bottomRight" trigger={['click']}>
              <Button onClick={(e) => e.stopPropagation()} size="small" type="default">
                <Space>
                  Actions
                  <CaretDownFilled />
                </Space>
              </Button>
            </Dropdown>

            {onClose && (
              <Button size="small" type="text" icon={<Icon component={() => <CloseIcon />} />} onClick={onClose} />
            )}
          </Flex>
        </Col>
      </Row>

      <Row>
        <Col>
          <ToggleButton isOpen={descOpen} onClick={() => setDescOpen(!descOpen)}>
            DESCRIPTION
          </ToggleButton>

          {descOpen && (
            <div style={{marginLeft: 30}}>
              <Editor
                disableExtensions={['checkbox_item', 'checkbox_list', 'container_notice']}
                defaultValue={data.codelist.description ?? ''}
                readOnly
              />
            </div>
          )}
        </Col>
      </Row>
      <Row>
        <Col span={24}>
          <Toolbar>
            <Space>
              <SelectOntology onChange={(onto) => setOntology(onto)} value={ontology} ontologies={ontologies} />
            </Space>
          </Toolbar>
        </Col>
      </Row>
      <Row style={{flex: 1}}>
        <Col span={24}>
          <Scrollbars style={{flex: 1}}>{codes && <CodesList codes={codes} />}</Scrollbars>
        </Col>
      </Row>

      {/*<Summary>
        <p>Here goes summary</p>
      </Summary> */}
    </Root>
  )
}

const CodesList = ({codes}: {codes: LocalCode[]}) => {
  const [ref, bounds] = useMeasure()
  return (
    <div style={{height: 'calc(100% - 30px)', marginTop: 30}} ref={ref}>
      <List height={bounds.height} itemCount={codes.length} itemSize={26.85} width={'100%'}>
        {({index, style}) => {
          const code = codes[index]
          return <Code key={code.id} code={code} style={style} />
        }}
      </List>
    </div>
  )
}

const Code = ({code, style}: {code: LocalCode; style: any}) => {
  return (
    <NodeWrapper style={style}>
      {' '}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          minWidth: 0,
          flex: 1,
        }}>
        <Label>
          {!!code.code && <CodeId>{code.code}</CodeId>}
          <Description>{code.description}</Description>
        </Label>
      </div>
    </NodeWrapper>
  )
}

export default CodelistDetail

const Root = styled.div`
  padding: 16px;
  height: calc(100% - 32px);
  display: flex;
  flex-direction: column;
  /* display: flex; */
`
const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
`

const ListRoot = styled.ul`
  list-style-type: none;
  margin: 0;
  padding: 0;
  width: 100%;
  margin-top: 30px;
`

const Indicator = styled.div`
  font-size: 9px;
  color: #8c8c8c;
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
