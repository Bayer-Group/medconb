import {InteractionRequiredAuthError} from '@azure/msal-browser'
import {useMsal} from '@azure/msal-react'
import React, {createContext, PropsWithChildren, useCallback, useContext, useEffect, useState} from 'react'
import jwt_decode from 'jwt-decode'
import MSALContext from './MSALContext'
import {styled} from '@linaria/react'
import {Spin, Typography} from 'antd'

import notice from './access_notice.md'
import MarkdownDisplayComponent from './components/MarkdownDisplayComponent'
import {ApplicationConfig} from '..'

type UserContextValue = {token: any}
export const UserContext = createContext<UserContextValue>({} as UserContextValue)

const {Paragraph} = Typography

type UserAccessGateProps = {
  config: ApplicationConfig
}

const UserAccessGate: React.FC<PropsWithChildren<UserAccessGateProps>> = ({children, config}) => {
  const {instance, accounts} = useMsal()
  const {scopes} = useContext(MSALContext)
  const [decoded, setDecoded] = useState<any>(null)
  const name = accounts[0] && accounts[0].name

  useEffect(() => {
    void (async function () {
      const request = {
        scopes,
        account: accounts[0],
      }
      let accessToken
      try {
        const result = await instance.acquireTokenSilent(request)
        accessToken = result.accessToken
      } catch (err) {
        if (err instanceof InteractionRequiredAuthError) {
          // fallback to interaction when silent call fails
          const result = await instance.acquireTokenPopup(request)
          accessToken = result.accessToken
        }
      }

      if (!accessToken) {
        return
      }

      setDecoded(jwt_decode(accessToken))
    })()
  }, [])

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

  // logging the user out redirects to login page automatically
  // useEffect(() => {
  //   if (!decoded) return
  //   if (!(decoded.roles ?? []).includes('User')) {
  //     handleLogout()
  //   }
  // }, [decoded])

  if (!decoded) {
    return (
      <MainLoader>
        <Spin size="large" />
      </MainLoader>
    )
  }

  if (!(decoded.roles ?? []).includes('User')) {
    const Root = styled.div`
      font-size: 1.3em;
      img {
        max-width: 800px;
      }
    `
    return <MarkdownDisplayComponent mdUri={notice} margin={4} rootElem={Root} variables={config.i18n} />
  }

  return <UserContext.Provider value={{token: decoded}}>{children}</UserContext.Provider>
}

export default UserAccessGate

const MainLoader = styled.div`
  height: 100px;
  width: 100px;
  display: flex;
  align-content: center;
  justify-content: center;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translateX(-50px) translateY(-50px);
`
