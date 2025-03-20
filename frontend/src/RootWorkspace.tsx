import React, {createRef, useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {styled} from '@linaria/react'
import {ExclamationCircleOutlined, MenuOutlined} from '@ant-design/icons'
import {App, Button, Dropdown, Modal, Progress, Space, Spin} from 'antd'
import {Outlet, useNavigate, useLocation, useParams, useSearchParams} from 'react-router-dom'
import Sidebar from './Sidebar'
import {findIndex, isEmpty, isNil, startsWith} from 'lodash'
import {UserContext} from './UserAccessGate'
import {MenuInfo} from 'rc-menu/lib/interface'
import Icon from '@ant-design/icons/lib/components/Icon'
import {useIsAuthenticated, useMsal} from '@azure/msal-react'
import {useDispatch, useSelector} from 'react-redux'
import {RootState} from './store'
import {toggleInfoBubbles} from './store/ui'
import {ItemType} from 'antd/lib/menu/hooks/useItems'
import Scrollbars from 'react-custom-scrollbars-2'
import {UserIcon} from './customIcons'
import {ReadMode, closeObject, openObject} from './store/workspace'
import OverflowTabs, {TabItem, TabsHandleType} from './components/OverflowTabs'
import {useApolloClient, useQuery} from '@apollo/client'
import {FETCH_COLLECTION, FETCH_PHENOTYPE} from './graphql'
import Feedback from './Feedback'
import about from './about.md'
import MarkdownDisplayComponent from './components/MarkdownDisplayComponent'
import MedconbTour from './tours/MedconbTour'
import Settings from './Settings'
import AppResetModal from './AppResetModal'
import localforage from 'localforage'
import {ApplicationContext} from './ApplicationProvider'
import useReset from './useReset'

const RootWorkspace = () => {
  const {instance} = useMsal()
  const {modal} = App.useApp()
  const {id, type} = useParams()
  const client = useApolloClient()
  const {config, reduxPersistor} = useContext(ApplicationContext)
  const dispatch = useDispatch()
  const isAUthenticated = useIsAuthenticated()
  const navigate = useNavigate()
  const resetApp = useReset()
  const [aboutOpen, setAboutOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const enableInfoBubbles = useSelector((state: RootState) => state.ui.enableInfoBubbles)
  const openObjects = useSelector((state: RootState) => state.workspace.openObjects)
  const sideBarOpen = useSelector((state: RootState) => state.ui.sideBarOpen)
  const searchParams = useSelector((state: RootState) => state.ui.searchParams)

  const [queryParams, setSearchParams] = useSearchParams()

  const location = useLocation()
  const {token} = useContext(UserContext)
  // const [tourOpen, setTourOpen] = useState(false)
  const tabsRef = createRef<TabsHandleType>()

  const current = useMemo(() => {
    if (startsWith(location.pathname, '/collection')) {
      return 'collection'
    }
    if (startsWith(location.pathname, '/phenotype')) {
      return 'phenotype'
    }
    if (startsWith(location.pathname, '/codeset')) {
      return 'codeset'
    }
    if (startsWith(location.pathname, '/workspace')) {
      return 'workspace'
    }
    if (location.pathname == '/') {
      return 'search'
    }
    return 'something'
  }, [location.pathname])

  useEffect(() => {
    if (current === 'search' && queryParams.size == 0 && !isEmpty(searchParams)) {
      let url = '/'
      const params = new URLSearchParams()
      for (const key in searchParams) {
        // omit query
        if (key !== 'query') {
          params.append(key, searchParams[key])
        }
      }
      url = `${url}?${params.toString()}`
      navigate(url)
    }
  }, [current, queryParams.size, searchParams])

  const handleLogout = useCallback(() => {
    // Skip the server sign-out WARNING!!!
    // https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/logout.md#skipping-the-server-sign-out
    instance
      .logoutRedirect({
        onRedirectNavigate: (url) => {
          // Return false if you would like to stop navigation after local logout
          return false
        },
      })
      .catch((e) => {
        console.error(e)
      })
  }, [])

  const handleMenuClick = useCallback(async (info: MenuInfo) => {
    switch (info.key) {
      case 'help_text':
        dispatch(toggleInfoBubbles())
        break
      case 'logout':
        handleLogout()
        break
      case 'reset_app_state': {
        await modal.confirm({
          title: 'Are you sure that you want to reset the application state?',
          icon: <ExclamationCircleOutlined />,
          content: <AppResetModal />,
          okText: 'Reset',
          cancelText: 'Cancel',
          onOk: async () => {
            await resetApp()
            return
          },
        })

        break
      }
      case 'about':
        setAboutOpen(true)
        break
      case 'settings':
        setSettingsOpen(true)
        break
    }
  }, [])

  const goToSearch = () => {
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

  const handleObjectClick = (object: any) => {
    if (object.type === 'PhenotypeCollection') {
      navigate(`/collection/Phenotype/${object.id}`)
    } else if (object.type === 'CodelistCollection') {
      navigate(`/collection/Codelist/${object.id}`)
    } else if (object.type === 'Phenotype') {
      navigate(`/phenotype/${object.id}`)
    }
  }

  const menuItems: ItemType[] = useMemo(() => {
    const items: ItemType[] = [
      {label: 'Application Settings', key: 'settings'},
      {label: 'Reset App State', key: 'reset_app_state'},
      {label: 'About', key: 'about'},
    ]

    if (isAUthenticated) {
      items.push({type: 'divider'})
      items.push({label: 'Logout', key: 'logout'})
    }

    return items
  }, [isAUthenticated, enableInfoBubbles])

  const tabs: TabItem[] = useMemo(() => {
    const _tabs = openObjects
      .filter((obj) => obj.type !== 'Codelist')
      .map(
        (obj) =>
          ({
            id: obj.id,
            type: obj.type,
            transient: false,
            label: obj.label,
          } as TabItem),
      )

    if (!isNil(id) && ['collection', 'phenotype'].includes(current)) {
      const open = openObjects.find((obj) => obj.id == id)
      if (!open) {
        _tabs.push({
          id,
          type:
            current == 'collection'
              ? type == 'Codelist'
                ? 'CodelistCollection'
                : 'PhenotypeCollection'
              : current == 'phenotype'
              ? 'Phenotype'
              : 'Codelist',
          transient: true,
          label: undefined,
        } as TabItem)
      }
    }

    return _tabs
  }, [openObjects, id, current])

  const handleObjectClose = (object: any) => {
    const lastItem = tabs.length == 1 && current !== 'search'
    let nextObject

    if (!lastItem && !isNil(id) && object.id === id) {
      // closing active tab, open next tab
      const index = findIndex(openObjects, {id: object.id})
      nextObject = openObjects[index + 1] ?? openObjects[index - 1]
    }
    dispatch(closeObject(object.id))

    if (nextObject) {
      handleObjectClick(nextObject)
    } else if (lastItem) {
      goToSearch()
    }
  }

  const handleObjectDblClick = async (item: TabItem) => {
    const isCollection = ['CodelistCollection', 'PhenotypeCollection'].includes(item.type)
    const {data} = await client.query({
      query: isCollection ? FETCH_COLLECTION : FETCH_PHENOTYPE,
      variables: {
        ...(isCollection && {collectionID: item.id}),
        ...(item.type === 'Phenotype' && {phenotypeID: item.id}),
      },
      fetchPolicy: 'cache-first',
    })
    const visibility = isCollection ? data.collection.visibility : data.phenotype.containerHierarchy[0]?.visibility
    dispatch(
      openObject({
        type: item.type,
        label: isCollection ? data?.collection?.name : data?.phenotype?.name,
        id: item.id,
        mode: visibility == 'Private' ? ReadMode.READWRITE : ReadMode.READONLY,
      }),
    )
  }

  return (
    <Main collapsed={!sideBarOpen}>
      <MedconbTour onStart={() => setSettingsOpen(false)} />

      <Modal open={aboutOpen} footer={null} onCancel={() => setAboutOpen(false)}>
        <MarkdownDisplayComponent mdUri={about} variables={config.i18n} />
      </Modal>
      {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}
      {/* {resetModalOpen && <AppResetModal onClose={() => setResetModalOpen(false)} />} */}

      <Sidebar showVersion={true} current={current} />
      <Header>
        <div style={{flex: 1}}>
          <OverflowTabs
            active={!isNil(id) ? (tabs.find((obj) => obj.id == id) as TabItem) : undefined}
            onTabClick={handleObjectClick}
            onTabDblClick={handleObjectDblClick}
            onTabClose={handleObjectClose}
            tabs={tabs}
            renderLabel={(item) => <TabLabel item={item} />}
          />
        </div>
        <Toolbar>
          {/* <Button onClick={() => navigate('codeset')}>ONTOLOGY VIEWER</Button> */}
          <Space align="center">
            {token && (
              <Space align="center">
                <Icon component={() => <UserIcon fill={'#262626'} />} style={{fontSize: 16, marginTop: 4}} />
                {token.name}
              </Space>
            )}
            <Dropdown menu={{onClick: handleMenuClick, items: menuItems}} trigger={['click']}>
              <Button onClick={(e) => e.stopPropagation()} size="small" type="text" icon={<MenuOutlined />}></Button>
            </Dropdown>
          </Space>
        </Toolbar>
      </Header>

      <Content collapsed={!sideBarOpen} data-tour-target="__object-detail__">
        <Scrollbars style={{flex: 1}}>
          <Outlet />
        </Scrollbars>
      </Content>
      <Feedback />
      <AppLoading />
    </Main>
  )
}

const AppLoading = () => {
  const appLoading = useSelector((state: RootState) => state.ui.appLoading)
  if (!appLoading) return null
  return (
    <ViewerBusy>
      {/* <div style={{width: 200}}> */}
      <Spin />
      {/* <Progress percent={codelistLoadProgress} /> */}
      {/* </div> */}
    </ViewerBusy>
  )
}

const TabLabel: React.FC<{item: TabItem}> = ({item}) => {
  const isCollection = ['CodelistCollection', 'PhenotypeCollection'].includes(item.type)
  const {data} = useQuery(isCollection ? FETCH_COLLECTION : FETCH_PHENOTYPE, {
    variables: {
      ...(isCollection && {collectionID: item.id}),
      ...(item.type === 'Phenotype' && {phenotypeID: item.id}),
    },
    fetchPolicy: 'cache-first',
  })

  if (isCollection) {
    return <span>{data?.collection?.name ?? 'Loading...'}</span>
  }

  if (item.type === 'Phenotype') {
    return <span>{data?.phenotype?.name ?? 'Loading...'}</span>
  }
}

export default RootWorkspace

const Content = styled.div<{collapsed: boolean}>`
  /* padding: 16px; */
  height: calc(100vh - 32px);
  max-height: calc(100vh - 32px);
  background: #fff;
  max-width: ${(props) => (props.collapsed ? 'calc(100vw - 52px)' : 'calc(100vw - 240px)')};
  width: ${(props) => (props.collapsed ? 'calc(100vw - 52px)' : 'calc(100vw - 240px)')};
`

const Header = styled.div`
  grid-area: header;
  height: 32px;
  display: flex;
  background: #f0f2f5;
  flex-direction: row;
  width: 100%;
`

const Main = styled.div<{collapsed: boolean}>`
  height: 100vh;
  width: 100vw;
  max-height: 100vh;
  /* display: flex;
  position: relative; */

  display: grid;
  grid-template-columns: ${(props) => (props.collapsed ? '52px 1fr' : '240px 1fr')};

  grid-template-areas:
    'sidebar  header'
    'sidebar content'
    'sidebar  content';
  /* grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(2, 1fr);
  grid-column-gap: 0px;
  grid-row-gap: 0px; */
`

const Toolbar = styled.div`
  display: flex;
  padding-right: 12px;
  border-bottom: 1px solid #f0f0f0;
  align-items: center;
  justify-content: space-between;
`

const ViewerBusy = styled.div`
  position: absolute;
  inset: 0;
  z-index: 8;
  background: rgba(241, 242, 245, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
`
