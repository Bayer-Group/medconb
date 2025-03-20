import React from 'react'
import {styled} from '@linaria/react'
import Icon from '@ant-design/icons'
import {useDispatch, useSelector} from 'react-redux'
import {RootState} from './store'
import {Button, Divider, Flex} from 'antd'

import LogoImage1 from '../assets/images/MCBLogo.png'
import LogoImage2 from '../assets/images/MCBLogo@2x.png'
import LogoImage3 from '../assets/images/MCBLogo@3x.png'

import SmallLogoImage1 from '../assets/images/Logo.png'
import SmallLogoImage2 from '../assets/images/Logo@2x.png'
import SmallLogoImage3 from '../assets/images/Logo@3x.png'
import PrivateCollectionMenu from './PrivateCollectionMenu'
import {toggleSidebar} from './store/ui'
import {useQuery} from '@apollo/client'
import {SELF} from './graphql'
import SharedCollections from './SharedCollections'
import {AppProps} from './App'
import {CollapseIcon, OpenMenuIcon} from './customIcons'
import {isEmpty} from 'lodash'
import {useNavigate} from 'react-router-dom'

type SidebarProps = {
  current: string
}

export type SidebarHandleType = {
  getPrivatePhenotypeCollectionRef: () => HTMLDivElement | null
  getPrivateCodelistCollectionRef: () => HTMLDivElement | null
  getContainerRef: () => HTMLDivElement | null
}

const Sidebar: React.FC<SidebarProps & Pick<AppProps, 'showVersion'>> = ({showVersion, current}, ref) => {
  const sideBarOpen = useSelector((state: RootState) => state.ui.sideBarOpen)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const searchParams = useSelector((state: RootState) => state.ui.searchParams)

  const {loading: workSpaceLoading, error: wsError, data: wsData} = useQuery(SELF)

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

  return (
    <Container data-tour-target="__sidebar__" collapsed={!sideBarOpen}>
      <Logo border={sideBarOpen}>
        <img
          // src={sideBarOpen ? LogoImage1 : SmallLogoImage1}
          srcSet={
            sideBarOpen
              ? `${LogoImage1} 1x, ${LogoImage2} 2x, ${LogoImage3} 3x`
              : `${SmallLogoImage1} 1x, ${SmallLogoImage2} 2x, ${SmallLogoImage3} 3x`
          }
        />
      </Logo>

      {!sideBarOpen && (
        <div
          style={{
            background: '#fff',
            borderTopRightRadius: 3,
            borderBottomRightRadius: 3,
            display: 'inline-block',
            boxShadow: '0px 0px 30px 6px rgba(0,0,0,0.16)',
            top: 58,
            position: 'absolute',
          }}>
          <Button
            type="link"
            icon={<Icon component={() => <CollapseIcon fill="none" />} style={{transform: 'rotateY(180deg)'}} />}
            onClick={() => dispatch(toggleSidebar())}></Button>
        </div>
      )}

      {sideBarOpen && (
        <SideMenu>
          <Flex vertical gap={8} style={{marginTop: 32, paddingRight: 10, marginBottom: 24}}>
            <MenuButton
              onClick={goToSearch}
              style={{fontSize: 10}}
              size="small"
              block
              type={current === 'search' ? 'primary' : 'default'}>
              SEARCH
            </MenuButton>
            <MenuButton
              style={{fontSize: 10}}
              onClick={() => navigate('/codeset')}
              size="small"
              block
              type={current === 'codeset' ? 'primary' : 'default'}>
              ONTOLOGY VIEWER
            </MenuButton>
          </Flex>

          {wsData && (
            <>
              <PrivateCollectionMenu
                data-tour-target="__private-phenotype-collection__"
                collectionType="Phenotype"
                desc="Phenotype Collections I own"
                title="PHENOTYPE COLLECTIONS"
                sectionKey="private_phenotype_collection"
                collections={wsData.self.workspace.collections.filter((col: any) => col.itemType === 'Phenotype')}
              />
              <PrivateCollectionMenu
                data-tour-target="__private-codelist-collection__"
                collectionType="Codelist"
                desc="Codelist Collections I own"
                title="CODELIST COLLECTIONS"
                sectionKey="private_codelist_collection"
                help={
                  'Phenotypes and Codelists are organized into Collections.' +
                  " To add a new Collection use the '+' button to the right." +
                  ' To add a Phenotype or Codelist to a Collection hover over its title and' +
                  " click on the '+' button that appears to the right." +
                  ' Click on a Codelist to activate/view it.'
                }
                collections={wsData.self.workspace.collections.filter((col: any) => col.itemType === 'Codelist')}
              />

              <Divider style={{margin: 0}} />
              <SharedCollections
                desc="Phenotype Collections shared with me"
                sectionKey="shared_phenotype_collection"
                title="PHENOTYPE COLLECTIONS"
                collections={wsData.self.workspace.shared.filter((col: any) => col.itemType === 'Phenotype')}
              />
              <SharedCollections
                desc="Codelist Collections shared with me"
                sectionKey="shared_codelist_collection"
                help={'The codelists listed here are shared with you.' + ' You have read only access to them.'}
                title="CODELIST COLLECTIONS"
                collections={wsData.self.workspace.shared.filter((col: any) => col.itemType === 'Codelist')}
              />

              {/* <Divider style={{margin: 0}} /> */}
            </>
          )}

          {/* <PublicLibraries /> */}
          {showVersion && (
            <div
              style={{
                fontStyle: 'italic',
                marginTop: 'auto',
                color: '#8C8C8C',
                textAlign: 'right',
                padding: '0 5px',
              }}>
              {COMMIT_HASH}
            </div>
          )}
          <Button
            type="text"
            style={{
              position: 'absolute',
              right: 0,
            }}
            icon={
              <Icon component={() => (sideBarOpen ? <CollapseIcon fill="none" /> : <OpenMenuIcon fill="none" />)} />
            }
            onClick={(e) => {
              e.stopPropagation()
              dispatch(toggleSidebar())
            }}
          />
        </SideMenu>
      )}
    </Container>
  )
}

const Logo = styled.div<{border: boolean}>`
  padding: 8px 10px;
  // border-bottom: ${({border}) => (border ? '2px solid #000' : 'none')};

  /* img {
    height: 32px;
    max-width: 100%;
  } */
`

const SideMenu = styled.div`
  padding-left: 10px;
  /* padding-top: 10px; */
  height: calc(100vh - 55px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
`

const Container = styled.div<{collapsed: boolean}>`
  width: ${(props) => (props.collapsed ? 'auto' : '240px')};
  //padding-right: ${(props) => (props.collapsed ? '0' : '6px')};
  background-color: ${(props) => (props.collapsed ? '#fff' : 'inherit')};
  height: 100vh;

  grid-area: sidebar;
`

const Header = styled.div`
  display: flex;
  padding: 4px 0;
  align-items: center;
`

const MenuButton = styled(Button)`
  border: none;
  box-shadow: none;
  text-transform: uppercase;
  font-weight: bold;
  font-size: 10px;
  letter-spacing: 1px;
`

export default Sidebar
