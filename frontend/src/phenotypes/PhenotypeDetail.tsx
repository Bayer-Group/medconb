import {CaretDownFilled, LinkOutlined} from '@ant-design/icons'
import {ActionType} from '@ant-design/pro-components'
import {Button, Typography, Row, Col, Skeleton, Space, Result, Flex, Dropdown} from 'antd'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {EditableTitle, MyBadge, ToggleButton} from '../scratch'
import {styled} from '@linaria/react'
import {useNavigate} from 'react-router-dom'
import {setOpenPhenotype, updateOntologiesByConcept} from '../store/ui'
import {useDispatch, useSelector} from 'react-redux'
import {RootState} from '../store'
import {find, isEmpty, isNil, omit} from 'lodash'
import {ReadMode, closeObject, openCodelist, openObject, startLoadingConcept} from '../store/workspace'
import {useApolloClient, useLazyQuery, useMutation, useQuery} from '@apollo/client'
import {
  CLONE_CODE_LIST,
  FETCH_CODE_LIST,
  FETCH_COLLECTION,
  FETCH_PHENOTYPE,
  FETCH_PROPERTIES_DEF,
  PropertyClass,
  UPDATE_PHENOTYPE,
} from '../graphql'
import {Property, PropertyValue} from '../..'
import withRouteParam from '../withRouteParam'
import {PropertiesEditor} from '../components/properties'
import CodelistTable from './CodelistTable'
import Icon from '@ant-design/icons/lib/components/Icon'
import {CloseIcon, PinIcon, PrivateIcon, UnpinIcon} from '../customIcons'
import Editor from '../components/Editor'
import BreadCrumbs, {BreadCrumbItem} from '../components/BreadCrumbs'
import {containerHierarchyToBreadcrumbItems} from '../utils'
import Visibility from '../components/Visibility'
import {PhenotypeDisplay} from '../EntityDisplay'
import usePhenotypeActions from './usePhenotypeActions'
import {openCodelistIdSelector} from '../store/selectors'

const {Paragraph} = Typography

type PhenotypeDetailProps = {
  id: string
  readOnly?: boolean
  navigateEntity?: (type: string, id: string) => void
  onClose?: () => void
}

const PhenotypeDetail: React.FC<PhenotypeDetailProps> = ({id, navigateEntity, readOnly = false, onClose}) => {
  const dispatch = useDispatch()
  const client = useApolloClient()
  const openObjects = useSelector((state: RootState) => state.workspace.openObjects)
  const searchParams = useSelector((state: RootState) => state.ui.searchParams)

  const {data: phenoTypeData, error: phenotypeDataError} = useQuery(FETCH_PHENOTYPE, {
    variables: {
      phenotypeID: id,
    },
    fetchPolicy: 'cache-and-network',
  })

  const {data: collectionData, error: collectionDataError} = useQuery(FETCH_COLLECTION, {
    variables: {
      collectionID: phenoTypeData?.phenotype.containerHierarchy[0]?.id,
    },
    skip: !phenoTypeData,
    fetchPolicy: 'cache-and-network',
  })

  const {data: propData} = useQuery(FETCH_PROPERTIES_DEF, {
    variables: {
      clazz: PropertyClass.Phenotype,
    },
    fetchPolicy: 'cache-and-network',
  })

  const [updatePhenotype, _] = useMutation(UPDATE_PHENOTYPE)

  const handlePhenotypeUpdate = (property: string) => async (value: any) => {
    handlePin()
    await updatePhenotype({
      variables: {
        phenotypeID: id,
        [property]: value,
      },
    })

    // if (property === 'name') {
    //   dispatch(renameObject({id: id, name: value}))
    // }
  }

  const handlePropertiesUpdate = (properties: PropertyValue[]) => {
    handlePhenotypeUpdate('properties')(
      properties.filter((propertyValue) => {
        if (!propertyValue.propertyID) return true

        const _prop = find(propData.properties, {id: propertyValue.propertyID}) as Property
        return !_prop.readOnly
      }),
    )
  }

  useEffect(() => {
    dispatch(setOpenPhenotype(id))
  }, [id])
  const actionRef = useRef<ActionType>()
  const navigate = useNavigate()
  const [opDescOpen, setOpDescOpen] = useState(true)
  const [mDescOpen, setMedicalDescOpen] = useState(true)
  const [propertiesOpen, setPropertiesOpen] = useState(true)

  const openMedicalConcepts = useSelector((state: RootState) => openCodelistIdSelector(state))

  const [loadCodelist, {loading, error, data}] = useLazyQuery(FETCH_CODE_LIST)

  const handleCodelistClick = useCallback(
    async (id: string) => {
      if (navigateEntity) {
        navigateEntity('Codelist', id)
        return
      }
      if (openMedicalConcepts.includes(id)) {
        navigate('/codeset')
        return
      }

      // dispatch(startLoadingConcept(id))
      // const res = await loadCodelist({
      //   variables: {codelistID: id},
      // })

      dispatch(
        openCodelist({
          // collection: res.data.codelist.container.id,
          codelistId: id,
          path: [],
          mode:
            phenoTypeData?.phenotype?.containerHierarchy[0]?.visibility == 'Private'
              ? ReadMode.READWRITE
              : ReadMode.READONLY,
        }),
      )
      // dispatch(updateOntologiesByConcept(res.data.codelist))
      navigate('/codeset')
    },
    [data, openMedicalConcepts],
  )

  const handleBulkAddCodelist = async (codelistIDs: string[], containerID: string) => {
    for (let i = 0; i < codelistIDs.length; i++) {
      const res = await client.mutate({
        mutation: CLONE_CODE_LIST,
        variables: {
          codelistID: codelistIDs[i],
          position: {
            containerID,
          },
        },
      })
      console.log(res)
    }
  }
  const {menuItems, handleMenuClick, addCodelist} = usePhenotypeActions(
    phenoTypeData?.phenotype,
    phenoTypeData?.phenotype?.containerHierarchy[0]?.visibility !== 'Private',
  )

  const isPinned = useMemo(() => {
    const _op = find(openObjects, {id})
    return !isNil(_op)
  }, [data, openObjects])

  const handlePin = () => {
    if (!phenoTypeData?.phenotype) {
      return
    }
    if (isPinned) {
      dispatch(closeObject(id))
    } else {
      dispatch(
        openObject({
          type: 'Phenotype',
          label: phenoTypeData.phenotype.name,
          id,
          mode:
            phenoTypeData?.phenotype?.containerHierarchy[0]?.visibility == 'Private'
              ? ReadMode.READWRITE
              : ReadMode.READONLY,
        }),
      )
    }
  }

  if (phenotypeDataError) {
    return (
      <Root>
        <Result
          status="error"
          title="Something went wrong"
          style={{margin: '0 auto', width: '60%'}}
          extra={
            <>
              <Paragraph>{phenotypeDataError.message}</Paragraph>
              {onClose && (
                <Button type="primary" onClick={onClose}>
                  Go back
                </Button>
              )}
            </>
          }
        />
      </Root>
    )
  }

  if (!phenoTypeData || !propData || !collectionData) {
    return (
      <Root>
        <Skeleton />
      </Root>
    )
  }

  const isReadOnly = readOnly || phenoTypeData?.phenotype?.containerHierarchy[0]?.visibility !== 'Private'

  const handleBreadCrumbClick = (item: BreadCrumbItem) => {
    const itemType = ['PhenotypeCollection', 'CodelistCollection'].includes(item.type) ? 'Collection' : item.type
    if (navigateEntity) {
      navigateEntity(itemType, item.id)
    } else if (item.type == 'PhenotypeCollection') {
      navigate(`/collection/Phenotype/${item.id}`)
    } else if (item.type == 'CodelistCollection') {
      navigate(`/collection/Codelist/${item.id}`)
    }
  }
  const goToSearch = () => {
    handlePin()
    let url = '/'
    if (!isEmpty(searchParams)) {
      const params = new URLSearchParams()
      for (const key in searchParams) {
        params.append(key, searchParams[key])
      }
      url = `${url}?${params.toString()}`
    }
    navigate(url)
  }
  return (
    <Root key={id} data-tour-target="__phenotype-detail__">
      {phenoTypeData?.phenotype?.containerHierarchy[0]?.visibility === 'Public' && (
        <div className="alert">
          <Flex gap={8} align="center">
            <Icon component={() => <PrivateIcon fill="#fff" />} />
            You are viewing a locked phenotype
          </Flex>
        </div>
      )}
      <Row justify={'space-between'}>
        <Col>
          <Flex align="center" gap={8} style={{marginBottom: 4}}>
            <span style={{width: 14}}>
              <Visibility visibility={phenoTypeData.phenotype.containerHierarchy[0].visibility} />
            </span>
            <EditableTitle
              style={{marginBottom: 0}}
              readOnly={isReadOnly}
              editStyle={{background: '#f0f0f0'}}
              onSave={handlePhenotypeUpdate('name')}
              level={4}
              value={phenoTypeData.phenotype.name}
              editableDefault
            />
          </Flex>
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
            <Button
              size="small"
              type="text"
              icon={<Icon component={() => (isPinned ? <UnpinIcon /> : <PinIcon />)} />}
              onClick={handlePin}
            />

            {onClose && (
              <Button size="small" type="text" icon={<Icon component={() => <CloseIcon />} />} onClick={onClose} />
            )}
          </Flex>
        </Col>
      </Row>
      <Row>
        <Col>
          <BreadCrumbs
            onClick={handleBreadCrumbClick}
            items={containerHierarchyToBreadcrumbItems('Phenotype', phenoTypeData.phenotype.containerHierarchy)}
          />
        </Col>
      </Row>
      {phenoTypeData.phenotype.referenceID && (
        <Row>
          <Col>
            <Space>
              <LinkOutlined style={{marginRight: 2}} />
              <PhenotypeDisplay
                onClick={() => {
                  if (navigateEntity) {
                    navigateEntity('Phenotype', phenoTypeData.phenotype.referenceID)
                  } else {
                    navigate(`/phenotype/${phenoTypeData.phenotype.referenceID}`)
                  }
                }}
                phenotypeID={phenoTypeData.phenotype.referenceID}
              />
            </Space>
          </Col>
        </Row>
      )}

      <Row style={{marginTop: 20}}>
        <Col span={12} data-tour-target="__phenotype-desc__">
          <div style={{marginBottom: 20}}>
            <MyBadge isValid={phenoTypeData.phenotype.medicalDescription ?? '' !== ''}>
              <ToggleButton isOpen={mDescOpen} onClick={() => setMedicalDescOpen(!mDescOpen)}>
                MEDICAL DESCRIPTION
              </ToggleButton>
            </MyBadge>

            {mDescOpen && (
              <div style={{maxHeight: 300, marginLeft: 24, minHeight: 150, overflowY: 'auto'}}>
                <Editor
                  defaultValue={phenoTypeData.phenotype.medicalDescription ?? ''}
                  onChange={(getContent) => handlePhenotypeUpdate('medicalDescription')(getContent())}
                  readOnly={isReadOnly}
                />
              </div>
            )}
          </div>
          <div>
            <MyBadge isValid={phenoTypeData.phenotype.operationalDescription ?? '' !== ''}>
              <ToggleButton isOpen={opDescOpen} onClick={() => setOpDescOpen(!opDescOpen)}>
                OPERATIONAL DESCRIPTION
              </ToggleButton>
            </MyBadge>

            {opDescOpen && (
              <div style={{maxHeight: 300, marginLeft: 24, minHeight: 150, overflowY: 'auto'}}>
                <Editor
                  defaultValue={phenoTypeData.phenotype.operationalDescription ?? ''}
                  onChange={(getContent) => handlePhenotypeUpdate('operationalDescription')(getContent())}
                  readOnly={isReadOnly}
                />
              </div>
            )}
          </div>
        </Col>
        <Col span={12}>
          <div data-tour-target="__phenotype-properties__">
            <ToggleButton isOpen={propertiesOpen} onClick={() => setPropertiesOpen(!propertiesOpen)}>
              PROPERTIES
            </ToggleButton>
            {/* //  extra={<Button type="primary">Edit</Button>} */}
            {propertiesOpen && (
              <div style={{marginBottom: 10}}>
                <PropertiesEditor
                  owner={collectionData.collection.ownerID}
                  onChange={isReadOnly ? undefined : handlePropertiesUpdate}
                  properties={propData.properties.filter((p: Property) => p.class === 'Phenotype')}
                  propertyValues={phenoTypeData.phenotype.properties.map((p: PropertyValue) => omit(p, ['__typename']))}
                />
              </div>
            )}
          </div>
        </Col>
      </Row>
      <div data-tour-target="__phenotype-content__">
        <CodelistTable
          key={id}
          readOnly={isReadOnly}
          containers={openObjects
            .filter(
              (o) => ['CodelistCollection', 'Phenotype'].includes(o.type) && o.id !== id && o.mode != ReadMode.READONLY,
            )
            .map((o) => ({id: o.id, name: o.label}))}
          onBulkAdd={handleBulkAddCodelist}
          onCodelistClick={handleCodelistClick}
          codelists={phenoTypeData.phenotype.codelists}
          onNavigateToSearch={goToSearch}
          onAddCodelist={addCodelist}
        />
      </div>
    </Root>
  )
}

export default PhenotypeDetail

const PhenotypeRoute = withRouteParam(PhenotypeDetail)

export {PhenotypeRoute}

const Root = styled.div`
  padding: 16px;
  .alert {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);

    border-bottom-left-radius: 4px;
    border-bottom-right-radius: 4px;
    padding: 2px 12px;
    background: #ff7875;
    color: #fff;
  }
`
