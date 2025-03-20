import {CaretDownFilled, LinkOutlined} from '@ant-design/icons'
import {Button, Typography, Row, Col, Divider, Skeleton, Space, Result, Flex, Dropdown} from 'antd'
import {useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {EditableTitle, MyBadge, ToggleButton} from '../scratch'
import {styled} from '@linaria/react'
import {useNavigate} from 'react-router-dom'
import {setOpenStudy, updateOntologiesByConcept} from '../store/ui'
import {useDispatch, useSelector} from 'react-redux'
import {useApolloClient, useLazyQuery, useMutation, useQuery} from '@apollo/client'
import {
  CLONE_CODE_LIST,
  CLONE_PHENOTYPE,
  CREATE_PHENOTYPE,
  FETCH_CODE_LIST,
  FETCH_COLLECTION,
  FETCH_PROPERTIES_DEF,
  SELF,
  UPDATE_COLLECTION,
} from '../graphql'
import withRouteParam from '../withRouteParam'
import {Property, PropertyValue} from '../..'
import {PropertiesEditor} from '../components/properties'
import {find, isEmpty, isNil, omit} from 'lodash'
import CodelistTable from '../phenotypes/CodelistTable'
import PhenotypeTable from './PhenotypeTable'
import {RootState} from '../store'
import {ReadMode, closeObject, openCodelist, openObject, startLoadingConcept} from '../store/workspace'
import Icon from '@ant-design/icons/lib/components/Icon'
import {CloseIcon, PinIcon, PrivateIcon, UnpinIcon} from '../customIcons'
import Editor from '../components/Editor'
import {MedConbUserContext} from '../App'
import Visibility from '../components/Visibility'
import {CollectionDisplay} from '../EntityDisplay'
import useCollectionActions from './useCollectionActions'
import {openCodelistIdSelector} from '../store/selectors'
const {Paragraph} = Typography

type CollectionDetailProps = {
  id: string
  readOnly?: boolean
  navigateEntity?: (type: string, id: string) => void
  onClose?: () => void
}

const CollectionDetail: React.FC<CollectionDetailProps> = ({id, navigateEntity, readOnly = false, onClose}) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const client = useApolloClient()
  const [descOpen, setDescOpen] = useState(true)
  const [propertiesOpen, setPropertiesOpen] = useState(true)
  const openMedicalConcepts = useSelector((state: RootState) => openCodelistIdSelector(state))
  const openObjects = useSelector((state: RootState) => state.workspace.openObjects)
  const [loadCodelist, {loading, error, data: codelistData}] = useLazyQuery(FETCH_CODE_LIST)
  const searchParams = useSelector((state: RootState) => state.ui.searchParams)
  const {id: userId} = useContext(MedConbUserContext)

  const {data, error: collDataError} = useQuery(FETCH_COLLECTION, {
    variables: {
      collectionID: id,
    },
    fetchPolicy: 'cache-first',
  })

  const [createPhenotype] = useMutation(CREATE_PHENOTYPE, {
    refetchQueries: [
      SELF,
      {
        query: FETCH_COLLECTION,
        variables: {
          collectionID: id,
        },
      },
    ],
  })

  const {data: propData} = useQuery(FETCH_PROPERTIES_DEF, {
    fetchPolicy: 'cache-and-network',
  })

  const [updateCollection, _] = useMutation(UPDATE_COLLECTION)

  const isReadOnly = readOnly || data?.collection?.visibility !== 'Private'

  const {collectionMenu, handleMenuClick, actionsDom, addPhenotype, addCodelist} = useCollectionActions(
    data?.collection,
    data?.collection?.visibility !== 'Private',
  )

  const handleCollectionUpdate = (property: string) => async (value: any) => {
    handlePin()
    await updateCollection({
      variables: {
        collectionID: id,
        [property]: value,
      },
    })

    // if (property === 'name') {
    //   dispatch(renameObject({id: id, name: value}))
    // }
  }

  const handlePropertiesUpdate = async (properties: PropertyValue[]) => {
    await handleCollectionUpdate('properties')(
      properties.filter((propertyValue) => {
        if (!propertyValue.propertyID) return true

        const _prop = find(propData.properties, {id: propertyValue.propertyID}) as Property
        return !_prop.readOnly
      }),
    )
  }

  const isPinned = useMemo(() => {
    const _op = find(openObjects, {id})
    return !isNil(_op)
  }, [data, openObjects])

  useEffect(() => {
    dispatch(setOpenStudy(id))
  }, [id])

  // todo: define columns depending on available properties
  // define default columns and rest hidden where users can toggle

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

      dispatch(
        openCodelist({
          // collection: res.data.codelist.container.id,
          codelistId: id,
          path: [],
          mode: isReadOnly ? ReadMode.READONLY : ReadMode.READWRITE,
        }),
      )
      navigate('/codeset')
    },
    [codelistData, openMedicalConcepts, isReadOnly],
  )

  const handleBulkAddPhenotype = async (phenotypeIds: string[], collectionId: string) => {
    for (let i = 0; i < phenotypeIds.length; i++) {
      const res = await client.mutate({
        mutation: CLONE_PHENOTYPE,
        variables: {
          phenotypeID: phenotypeIds[i],
          position: {
            containerID: collectionId,
          },
        },
      })
      console.log(res)
    }
  }

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

  const handlePin = () => {
    if (!data?.collection) {
      return
    }
    if (isPinned) {
      dispatch(closeObject(id))
    } else {
      dispatch(
        openObject({
          type: data.collection.itemType == 'Codelist' ? 'CodelistCollection' : 'PhenotypeCollection',
          label: data.collection.name,
          id,
          mode: data.collection.visibility == 'Private' ? ReadMode.READWRITE : ReadMode.READONLY,
        }),
      )
    }
  }

  if (collDataError) {
    return (
      <Root>
        <Result
          status="error"
          title="Something went wrong"
          style={{margin: '0 auto', width: '60%'}}
          extra={
            <>
              <Paragraph>{collDataError.message}</Paragraph>
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

  if (!data || !propData) {
    return (
      <Root>
        <Skeleton />
      </Root>
    )
  }
  return (
    <Root key={id}>
      {actionsDom}
      {data.collection.visibility === 'Public' && (
        <div className="alert">
          <Flex gap={8} align="center">
            <Icon component={() => <PrivateIcon fill="#fff" />} />
            You are viewing a locked collection
          </Flex>
        </div>
      )}
      <Row justify={'space-between'}>
        <Col>
          <Flex align="center" gap={8} style={{marginBottom: 4}}>
            <span style={{width: 14}}>
              <Visibility visibility={data.collection.visibility} />
            </span>
            <EditableTitle
              data-tour-target="__collection-name__"
              style={{marginBottom: 0}}
              readOnly={isReadOnly}
              editStyle={{background: '#f0f0f0'}}
              onSave={handleCollectionUpdate('name')}
              level={4}
              editableDefault
              value={data.collection.name}
            />
          </Flex>
        </Col>
        <Col flex={1}>
          <Flex justify="flex-end" gap={8}>
            <Dropdown
              menu={{items: collectionMenu, onClick: handleMenuClick}}
              placement="bottomRight"
              trigger={['click']}>
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

      {data.collection.referenceID && (
        <Row>
          <Col>
            <Space>
              <LinkOutlined style={{marginRight: 2}} />
              <CollectionDisplay
                onClick={() => {
                  if (navigateEntity) {
                    navigateEntity('Collection', data.collection.referenceID)
                  } else {
                    navigate(`/collection//${data.collection.referenceID}`)
                  }
                }}
                collectionID={data.collection.referenceID}
              />
            </Space>
          </Col>
        </Row>
      )}

      <Row>
        <Col span={12}>
          <MyBadge isValid={data.collection.description ?? '' !== ''}>
            <ToggleButton isOpen={descOpen} onClick={() => setDescOpen(!descOpen)}>
              DESCRIPTION
            </ToggleButton>
          </MyBadge>

          {descOpen && (
            <div
              data-tour-target="__collection-desc__"
              style={{maxHeight: 300, marginLeft: 24, minHeight: 150, overflowY: 'auto'}}>
              <Editor
                defaultValue={data.collection.description ?? ''}
                onChange={(getContent) => handleCollectionUpdate('description')(getContent())}
                readOnly={isReadOnly}
              />
            </div>
          )}
        </Col>
        <Col span={1}>
          <Divider type="vertical" />
        </Col>

        <Col span={11}>
          {data.collection.itemType === 'Phenotype' && (
            <div data-tour-target="__collection-properties__">
              <ToggleButton isOpen={propertiesOpen} onClick={() => setPropertiesOpen(!propertiesOpen)}>
                PROPERTIES
              </ToggleButton>
              {propertiesOpen && (
                <PropertiesEditor
                  owner={data.collection.ownerID}
                  onChange={isReadOnly ? undefined : handlePropertiesUpdate}
                  properties={propData.properties.filter((p: Property) => p.class === 'Collection')}
                  propertyValues={data.collection.properties.map((p: PropertyValue) => omit(p, ['__typename']))}
                />
              )}
            </div>
          )}
        </Col>
      </Row>
      {data.collection.itemType === 'Codelist' && (
        <div data-tour-target="__collection-content__">
          <CodelistTable
            readOnly={data?.collection?.visibility !== 'Private'}
            containers={openObjects
              .filter(
                (o) =>
                  ['CodelistCollection', 'Phenotype'].includes(o.type) && o.id !== id && o.mode != ReadMode.READONLY,
              )
              .map((o) => ({id: o.id, name: o.label}))}
            onCodelistClick={handleCodelistClick}
            onBulkAdd={handleBulkAddCodelist}
            codelists={data.collection.items}
            onNavigateToSearch={goToSearch}
            onAddCodelist={addCodelist}
          />
        </div>
      )}
      {data.collection.itemType === 'Phenotype' && (
        <div data-tour-target="__collection-content__">
          <PhenotypeTable
            readOnly={data?.collection?.visibility !== 'Private'}
            collections={openObjects
              .filter((o) => o.type === 'PhenotypeCollection' && o.id !== id && o.mode != ReadMode.READONLY)
              .map((o) => ({id: o.id, name: o.label}))}
            navigateEntity={navigateEntity}
            onAddPhenotype={addPhenotype}
            onBulkAdd={handleBulkAddPhenotype}
            phenotypes={data.collection.items}
            onNavigateToSearch={goToSearch}
          />
        </div>
      )}
    </Root>
  )
}

const CollectionsRoute = withRouteParam(CollectionDetail)

export default CollectionDetail
export {CollectionsRoute}

const Root = styled.div`
  padding: 16px;
  position: relative;

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
