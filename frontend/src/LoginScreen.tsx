import {useMsal} from '@azure/msal-react'
import {EventType} from '@azure/msal-browser'
import {styled} from '@linaria/react'
import {Button} from 'antd'
import React, {useCallback, useContext, useEffect} from 'react'
import MSALContext from './MSALContext'
import jwt_decode from 'jwt-decode'
import CompanyLogo from '../assets/images/company_logo_color.png'
import localforage from 'localforage'
import {ApplicationConfig} from '..'

type LoginScreenProps = {
  enableDev?: boolean
  config: ApplicationConfig
}
const LoginScreen: React.FC<LoginScreenProps> = ({enableDev = false, config}) => {
  const {instance} = useMsal()
  const {scopes} = useContext(MSALContext)

  useEffect(() => {
    const cb = instance.addEventCallback(async (message: any) => {
      if (message.eventType === EventType.LOGIN_SUCCESS) {
        const info = jwt_decode<any>(message.payload.accessToken)
        const storedSub: string | null = await localforage.getItem('__msal_sub')

        if (storedSub && storedSub !== info.sub) {
          await localforage.removeItem('persist:__MEDCONB__WORKSPACE')
          await localforage.removeItem('persist:__MEDCONB__CHANGES')
          await localforage.removeItem('persist:__MEDCONB__UI')
        }
        await localforage.setItem('__msal_sub', info.sub)
      }
    })

    return () => {
      if (cb) {
        instance.removeEventCallback(cb)
      }
    }
  }, [])

  const handleLogin = useCallback(() => {
    instance.loginPopup({scopes}).catch((e) => {
      console.error(e)
    })
  }, [])

  return (
    <LoginRoot>
      <div>
        <Box>
          <LogoContainer>
            <img height="100%" src={CompanyLogo} />
          </LogoContainer>
          <Button type="primary" onClick={handleLogin}>
            Sign in using your {config.i18n.companyName} account
          </Button>
        </Box>
        {enableDev && (
          <Button block type="text" onClick={() => (document.location.href = '?dev_auth=1')}>
            Sign in using dev token
          </Button>
        )}
      </div>
    </LoginRoot>
  )
}

export default LoginScreen

const LoginRoot = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
`
const Box = styled.div`
  background: #f1f2f5;
  border: 1px solid #f1f2f5;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  padding: 20px;
  justify-content: center;
`

const LogoContainer = styled.div`
  height: 100px;
  text-align: center;
  margin-bottom: 20px;
`
