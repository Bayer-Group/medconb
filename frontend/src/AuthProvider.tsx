import {createContext, PropsWithChildren, useEffect, useMemo, useState} from 'react'

import {ApplicationConfig, getConfig} from './config'
import LoginScreen from './LoginScreen'
import {MsalProvider} from '@azure/msal-react'
import {
  EventType,
  PublicClientApplication,
  InteractionRequiredAuthError,
  IPublicClientApplication,
} from '@azure/msal-browser'
import jwt_decode from 'jwt-decode'
import localforage from 'localforage'
import {get} from 'lodash'
import {createTimer, getTimer} from './utils/timer'

type AuthContextValue = {getTokenAsync: () => Promise<string>; username: string}
export const AuthContext = createContext<AuthContextValue>({} as AuthContextValue)

export type AuthData = {
  msalInstance: PublicClientApplication | null
}

export type AuthProviderProps = PropsWithChildren<{}>

export const AuthProvider: React.FC<AuthProviderProps> = ({children}) => {
  const authProviderTimer = useMemo(() => createTimer('AuthProvider Setup'), [])
  useEffect(() => authProviderTimer.logStep('AuthProvider created'), [])

  const [token, setToken] = useState('')
  const [loginType, setLoginType] = useState('')
  const [passwordLoginFailed, setPasswordLoginFailed] = useState(false)
  const [registrationErrorMsg, setRegistrationErrorMsg] = useState('')

  const config = getConfig()
  const msalInstance = useMemo(() => {
    const instance = setupMsalAuth(config, setToken, setLoginType)
    authProviderTimer.logStep('MSAL instance created')
    return instance
  }, [config])

  const getLoginInfoAsync = async () => {
    if (config.loginOptions.dev && config.dev_token && qd.dev_auth) {
      return {token: config.dev_token, type: 'dev'}
    }

    if (config.loginOptions.msal && msalInstance) {
      if (!config.msal) throw new Error('MSAL auth is enabled but config is not given')
      return {token: await getMsalToken(msalInstance, config.msal.scopes), type: 'msal'}
    }

    if (config.loginOptions.password) {
      return {token, type: 'password'}
    }

    return {token: '', type: ''}
  }

  const getTokenAsync = async () => (await getLoginInfoAsync())?.token

  useEffect(() => {
    // this tries to get a token from the existing state, as there might
    // be an active msal session.
    async function _getToken() {
      const loginInfo = await getLoginInfoAsync()
      authProviderTimer.logStep(`Tried to retrieve token (${loginInfo.type})`)
      if (loginInfo.token) {
        setToken(loginInfo.token)
        setLoginType(loginInfo.type)
      }
    }

    if (!token) _getToken()
  }, [])

  if (!token) {
    const handleMsalLogin = () => {
      if (msalInstance && config.msal)
        msalInstance.loginPopup({scopes: config.msal.scopes}).catch((e) => {
          console.error(e)
        })
      else console.error('MSAL not configured properly')
    }

    const handlePasswordLogin = (email: string, password: string) => {
      const graphql_endpoint = config.graphql_endpoints[0]

      const xmlHttp = new XMLHttpRequest()
      xmlHttp.open('POST', graphql_endpoint, false)
      xmlHttp.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
      xmlHttp.send(
        JSON.stringify({
          operationName: 'login',
          variables: {email, password},
          query:
            'mutation login($email: String!, $password: String!) { login(email: $email, password: $password) { token } }',
        }),
      )

      const response = JSON.parse(xmlHttp.responseText)
      const token = response?.data?.login?.token

      if (token) {
        setToken(token)
        setLoginType('password')
      } else {
        console.error('Login failed', response)
        setPasswordLoginFailed(true)
      }
    }

    const handleRegister = (email: string, password: string, name: string) => {
      const graphql_endpoint = config.graphql_endpoints[0]

      const xmlHttp = new XMLHttpRequest()
      xmlHttp.open('POST', graphql_endpoint, false)
      xmlHttp.setRequestHeader('Content-Type', 'application/json;charset=UTF-8')
      xmlHttp.send(
        JSON.stringify({
          operationName: 'registerUser',
          variables: {email, password, name},
          query:
            'mutation registerUser($email: String!, $password: String!, $name: String!) { registerUser(email: $email, password: $password, name: $name) }',
        }),
      )

      const response = JSON.parse(xmlHttp.responseText)
      if (response?.data?.registerUser) {
        setRegistrationErrorMsg('')
        handlePasswordLogin(email, password)
      } else {
        console.error('Registration failed', response)
        setRegistrationErrorMsg('Registration failed. Please try again.')
      }
    }

    authProviderTimer.logStep('Ending at Login Screen')
    return (
      <LoginScreen
        loginOptions={config.loginOptions}
        i18n={config.i18n}
        handleMsalLogin={handleMsalLogin}
        handlePasswordLogin={handlePasswordLogin}
        passwordLoginMessage={passwordLoginFailed ? 'Login failed. Please check your credentials.' : undefined}
        handleRegister={handleRegister}
        registrationMessage={registrationErrorMsg}
      />
    )
  }

  let username = 'Developer'

  if (['msal', 'password'].includes(loginType)) {
    const decodedToken: any = jwt_decode(token)
    username = decodedToken?.name
  }

  const isDevAuth = loginType == 'dev'
  const isPasswordAuth = loginType == 'password'
  const loggedInWithoutMsal = isDevAuth || isPasswordAuth

  if (loggedInWithoutMsal) {
    authProviderTimer.logTotal()
    return <AuthContext.Provider value={{getTokenAsync, username}}>{children}</AuthContext.Provider>
  }

  if (!msalInstance) throw new Error('MSAL auth is enabled but config is not given')

  authProviderTimer.logTotal()
  getTimer('AppLoad').logStep('AuthProvider mounted')
  return (
    <AuthContext.Provider value={{getTokenAsync, username}}>
      <MsalProvider instance={msalInstance}>{children}</MsalProvider>
    </AuthContext.Provider>
  )
}

const qd = {} as Record<string, string>
if (location.search)
  location.search
    .substring(1)
    .split(`&`)
    .forEach((item) => {
      let [k, v] = item.split(`=`)
      v = v && decodeURIComponent(v)
      ;(qd[k] = qd[k] || []).push(v)
    })

const setupMsalAuth = (
  config: ApplicationConfig,
  setToken: (token: string) => void,
  setLoginType: (type: string) => void,
) => {
  if (!config.loginOptions.msal) return null
  if (!config.msal) throw new Error('MSAL auth is enabled but config is not given')

  let msalInstance = new PublicClientApplication({
    auth: {...config.msal.auth, redirectUri: `${window.location.protocol}//${window.location.host}`},
    cache: {
      cacheLocation: 'sessionStorage',
      storeAuthStateInCookie: false,
    },
  })

  msalInstance.addEventCallback(async (message: any) => {
    if (message.eventType === EventType.LOGIN_SUCCESS) {
      const info = jwt_decode<any>(message.payload.accessToken)
      console.log('MSAL login success', info)
      const storedSub: string | null = await localforage.getItem('__msal_sub')

      // TODO: do this user check for all other login types
      if (storedSub && storedSub !== info.sub) {
        await localforage.removeItem('persist:__MEDCONB__WORKSPACE')
        await localforage.removeItem('persist:__MEDCONB__CHANGES')
        await localforage.removeItem('persist:__MEDCONB__UI')
      }
      await localforage.setItem('__msal_sub', info.sub)

      setToken(message.payload.accessToken)
      setLoginType('msal')
    }
  })

  return msalInstance
}

const getMsalToken = async (instance: IPublicClientApplication, scopes: string[]) => {
  const accounts = instance.getAllAccounts()
  const account = get(accounts, '[0]')

  if (!account) {
    await instance.acquireTokenPopup({scopes})
    return ''
  }
  try {
    const result = await instance.acquireTokenSilent({scopes, account})
    return result.accessToken
  } catch (err) {
    if (err instanceof InteractionRequiredAuthError) {
      // fallback to interaction when silent call fails
      await instance.acquireTokenPopup({scopes})
    }
  }
  return ''
}
