import React, {useCallback, useEffect, useState} from 'react'
// import 'antd/dist/antd.less'
import {createRoot} from 'react-dom/client'
import {Provider} from 'react-redux'
import store from './store'
import {persistStore} from 'redux-persist'
import MSALContext from './MSALContext'
import * as Sentry from '@sentry/react'

import {
  ApolloClient,
  createHttpLink,
  InMemoryCache,
  ApolloProvider,
  NormalizedCacheObject,
  from,
  ApolloError,
  ApolloLink,
  InMemoryCacheConfig,
} from '@apollo/client'
import {setContext} from '@apollo/client/link/context'
import {ErrorResponse, onError} from '@apollo/client/link/error'
import App from './App'
import 'react-reflex/styles.css'
import './app.less'

import {InteractionRequiredAuthError, PublicClientApplication} from '@azure/msal-browser'
import {MsalProvider, AuthenticatedTemplate, UnauthenticatedTemplate, useMsal} from '@azure/msal-react'
import LoginScreen from './LoginScreen'
import {chunk, get} from 'lodash'
import {CachePersistor, LocalForageWrapper} from 'apollo3-cache-persist'
import localforage from 'localforage'
import {Spin, Result, notification} from 'antd'
import {PersistGate} from 'redux-persist/integration/react'
import ErrorHandlerContext from './ErrorHandlerContext'
import {v4 as uuidv4} from 'uuid'

import {InstallOptions, Logger} from 'cloudwatch-front-logger'
import MainLoader from './components/MainLoader'
import Witties from './components/Witties'
import UserAccessGate from './UserAccessGate'
import CodeBatchingLink from './apollo/CodeBatchingLink'
import {ApplicationConfig, LocalCode, LocalOntology} from '..'
import {cacheSizes} from '@apollo/client/utilities'
import ApplicationProvider from './ApplicationProvider'
import asyncTokenLookup, {qd} from './asyncTokenLookup'
import {db} from './db'

cacheSizes['inMemoryCache.executeSelectionSet'] = 1_000_000
cacheSizes['inMemoryCache.executeSubSelectedArray'] = 500_000

const container = window.document.getElementById('root')
const root = createRoot(container!)

const config: ApplicationConfig = (() => {
  const xmlHttp = new XMLHttpRequest()
  xmlHttp.open('GET', 'config/config.json', false)
  xmlHttp.send(null)
  return JSON.parse(xmlHttp.responseText) as ApplicationConfig
})()

const init = (upgraded: boolean) => {
  const sessionId = uuidv4()

  const logger = new Logger(
    config.aws.accessKeyId,
    config.aws.secretAccessKey,
    config.aws.region,
    config.aws.logGroupName,
  )

  // logger.onError(new Error('This is a test loggggggg'))
  Sentry.init({
    dsn: config.glitchtipDSN,
    initialScope: {
      sessionId,
    },
  })
  Sentry.setTag('sessionId', sessionId)

  const msalInstance = new PublicClientApplication({
    auth: {...config.msal.auth, redirectUri: `${window.location.protocol}//${window.location.host}`},
    cache: {
      cacheLocation: 'sessionStorage',
      storeAuthStateInCookie: false,
    },
  })

  const httpLink = createHttpLink({
    uri: config.graphql_endpoints[0],
  })

  const codeBatchingLink = new CodeBatchingLink()

  const uriPool = [...config.graphql_endpoints] as string[]

  const uriRotator = new ApolloLink((operation, forward) => {
    const nextUri = uriPool.shift()
    operation.setContext({
      uri: nextUri,
    })
    uriPool.push(nextUri)
    return forward(operation)
  })

  const cache = new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          searchEntities: {
            keyArgs: ['entityType', 'query'],
            merge(existing, incoming, {readField, args}) {
              const items = existing ? {...existing.items} : {}
              incoming.items.forEach((item: any) => {
                items[readField('id', item) as string] = item
              })
              return {
                total: incoming.total,
                items,
              }
            },
            read(existing) {
              if (existing) {
                return {
                  total: existing.total,
                  items: Object.values(existing.items),
                }
              }
            },
          },
        },
      },
      Code: {
        keyFields: false,
      },
      Ontology: {
        keyFields: ['name'],
      },
    },
  } as InMemoryCacheConfig)
  const newPersistor = new CachePersistor({
    cache,
    storage: new LocalForageWrapper(localforage),
    debug: true,
    trigger: 'write',
    maxSize: false,
  })

  const reduxPersistor = persistStore(store)

  const Inner = () => {
    const {instance} = useMsal()
    const [client, setClient] = useState<ApolloClient<NormalizedCacheObject>>()
    const [persistor, setPersistor] = useState<CachePersistor<NormalizedCacheObject>>()

    const withToken = setContext(async (_, {headers}) => {
      const token = await asyncTokenLookup(instance, config)
      return {
        headers: {
          ...headers,
          Authorization: token ? `Bearer ${token}` : null,
        },
      }
    })

    const uiErrorHandler = (err: Error) => {
      if (err instanceof ApolloError) {
        errorHandler(err, true)
      }
    }

    const errorHandler = (err: ErrorResponse | ApolloError, notify: boolean) => {
      const messages = []
      if (err.graphQLErrors) {
        err.graphQLErrors.forEach((err) => {
          messages.push(err.message)
          console.log(`[GraphQL error]: Message: ${err.message}, Location: ${err.locations}, Path: ${err.path}`)
          Sentry.captureMessage(err.message)
          logger.onError(err)
        })
      }
      if (err.networkError) {
        messages.push(err.networkError)
        Sentry.captureException(err.networkError)
        logger.onError(err.networkError)
        console.log(`[Network error]: ${err.networkError}`)
      }

      if (notify && messages.length > 0) {
        notification.error({
          message: 'Error',
          // description: messages.join('\n'),
          description: `There was an error while saving data. Please contact support.`,
        })
      }
    }

    const errorLink = onError((err) => errorHandler(err, true))

    const setupLogger = useCallback((extraparams?: any) => {
      const options: InstallOptions = {
        async logStreamNameResolver() {
          return `${config.logStreamPrefix}-${sessionId}`
        },
      }
      if (extraparams) {
        options.messageFormatter = async (e, info = {type: 'unknown'}) => {
          if (!e.message) {
            return null
          }

          return JSON.stringify({
            message: e.message,
            timestamp: new Date().getTime(),
            userAgent: window.navigator.userAgent,
            host: window.location.host,
            version: COMMIT_HASH.trim(),
            ...info,
            ...extraparams,
          })
        }
      }

      logger.install(options)
    }, [])

    useEffect(() => {
      async function initApp() {
        setupLogger()
        await newPersistor.restore()
        setPersistor(newPersistor)
        const _client = new ApolloClient({
          connectToDevTools: true,
          link: from([
            errorLink,
            uriRotator,
            // FixtureLink,
            withToken.concat(codeBatchingLink),
            withToken.concat(httpLink),
          ]),
          cache,
        })

        setClient(_client)
      }
      initApp().catch(console.error)
    }, [])

    const clearCache = useCallback(() => {
      if (!persistor) {
        return
      }
      persistor.purge()
    }, [persistor])

    if (!client || !persistor) {
      return (
        <MainLoader>
          <Spin size="large" />
          <Witties />
        </MainLoader>
      )
    }

    return (
      <ApolloProvider client={client}>
        <ErrorHandlerContext.Provider value={{onError: uiErrorHandler, setupLogger, sessionId}}>
          {!!qd.dev_auth && (config.dev_token ?? null !== null) && (
            <ApplicationProvider config={config} apolloCachePersistor={persistor} reduxPersistor={reduxPersistor}>
              <Provider store={store}>
                <PersistGate loading={null} persistor={reduxPersistor}>
                  <App upgraded={upgraded} showVersion={config.show_version || false} />
                </PersistGate>
              </Provider>
            </ApplicationProvider>
          )}
          {(!qd.dev_auth || !config.dev_token) && (
            <>
              <AuthenticatedTemplate>
                <UserAccessGate config={config}>
                  <ApplicationProvider config={config} apolloCachePersistor={persistor} reduxPersistor={reduxPersistor}>
                    <Provider store={store}>
                      <PersistGate loading={null} persistor={reduxPersistor}>
                        <App upgraded={upgraded} showVersion={config.show_version || false} />
                      </PersistGate>
                    </Provider>
                  </ApplicationProvider>
                </UserAccessGate>
              </AuthenticatedTemplate>
              <UnauthenticatedTemplate>
                <LoginScreen enableDev={!!config.dev_token} config={config} />
              </UnauthenticatedTemplate>
            </>
          )}
        </ErrorHandlerContext.Provider>
      </ApolloProvider>
    )
  }

  root.render(
    // <React.StrictMode>
    <MSALContext.Provider
      value={{
        ...config.msal,
        auth: {...config.msal.auth, redirectUri: `${window.location.protocol}//${window.location.host}`},
      }}>
      <MsalProvider instance={msalInstance}>
        <Inner />
      </MsalProvider>
    </MSALContext.Provider>,
    // </React.StrictMode>,
  )
}

type StoredVersion = {
  b: string
  f: string
}

const versionCheck = async () => {
  let upgraded = false
  await localforage.removeItem('__welcome__tour_seen')
  const xmlHttp = new XMLHttpRequest()
  xmlHttp.open('GET', (config.graphql_endpoints[0] as string).replace('/graphql/', ''), false)
  xmlHttp.send(null)
  const response = JSON.parse(xmlHttp.responseText)
  if (response.status === 'ok') {
    const storedVersions: StoredVersion | null = await localforage.getItem('__v')
    const backendVersion = response.version
    const frontendVersion = COMMIT_HASH.trim()

    console.log(`Backend version was ${storedVersions?.b} and is now ${backendVersion}`)
    console.log(`Frontend version was ${storedVersions?.f} and is now ${frontendVersion}`)

    if (!storedVersions || storedVersions.b !== backendVersion || storedVersions.f !== frontendVersion) {
      console.log('Clearing local cache')
      upgraded = true
      await localforage.clear()
      await db.codes.clear()
      await db.ontologies.clear()
      await localforage.setItem('__v', {b: backendVersion, f: frontendVersion})
    }
  }

  return upgraded
}

document.getElementById('preloader-wrap')?.remove()
if ((config.maintenance_mode ?? false) === true) {
  root.render(<Result status="info" title="I'm currently under maintenance" style={{margin: '0 auto', width: '60%'}} />)
} else {
  void versionCheck().then((upgraded: boolean) => {
    init(upgraded)
  })
}
