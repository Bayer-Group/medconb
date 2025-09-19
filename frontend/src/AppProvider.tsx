import {Spin, notification} from 'antd'
import * as Sentry from '@sentry/react'
import {createContext, useCallback, useContext, useEffect, useMemo, useState} from 'react'
import {getConfig} from './config'
import {ErrorResponse, onError} from '@apollo/client/link/error'
import {
  ApolloClient,
  ApolloError,
  ApolloLink,
  ApolloProvider as _ApolloProvider,
  InMemoryCache,
  InMemoryCacheConfig,
  NormalizedCacheObject,
  createHttpLink,
  from,
  ApolloCache,
} from '@apollo/client'
import localforage from 'localforage'
import MainLoader from './components/MainLoader'
import Witties from './components/Witties'
import {AuthContext, AuthData, AuthProvider} from './AuthProvider'
import {CachePersistor, LocalForageWrapper} from 'apollo3-cache-persist'
import {setContext} from '@apollo/client/link/context'
import CodeBatchingLink from './apollo/CodeBatchingLink'
import ErrorHandlerContext from './ErrorHandlerContext'
import {Provider} from 'react-redux'
import {PersistGate} from 'redux-persist/integration/react'
import App from './App'
import store from './store'
import {Persistor, persistStore} from 'redux-persist'
import {getTimer} from './utils/timer'

export type AppContextType = {
  apolloCachePersistor: CachePersistor<NormalizedCacheObject>
  reduxPersistor: Persistor
}

export const AppContext = createContext({} as AppContextType)

export const AppProvider: React.FC<{sessionId: string}> = ({sessionId}) => {
  const appProviderTimer = useMemo(() => getTimer('AppProvider'), [])

  const [apolloClient, setApolloClient] = useState<ApolloClient<NormalizedCacheObject>>()
  const [apolloCachePersistor, setApolloCachePersistor] = useState<CachePersistor<NormalizedCacheObject>>()

  const {getTokenAsync} = useContext(AuthContext)
  const config = getConfig()

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
      })
    } else if (err.networkError) {
      messages.push(err.networkError)
      Sentry.captureException(err.networkError)
      console.log(`[Network error]: ${err.networkError}`)
    } else {
      messages.push(err)
      Sentry.captureException(err)
      console.log(`[Other error]: ${err}`)
    }

    if (notify && messages.length > 0) {
      notification.error({
        message: 'Error',
        // description: messages.join('\n'),
        description: `There was an error while saving data. Please contact support.`,
      })
    }
  }

  useEffect(() => {
    async function initApollo() {
      appProviderTimer.logStep('Start initialization of Apollo cache')

      const apolloCache = createApolloCache()
      const newPersistor = createApolloCachePersistor(apolloCache)
      const apolloLinks = createApolloLinks(errorHandler, [...config.graphql_endpoints], getTokenAsync)
      appProviderTimer.logStep('Apollo cache objects created')

      await newPersistor.restore()
      appProviderTimer.logStep('Apollo cache restored from storage')

      setApolloCachePersistor(newPersistor)
      appProviderTimer.logStep('Apollo cache persitor assigned')

      const _client = new ApolloClient({
        connectToDevTools: true,
        link: from(apolloLinks),
        cache: apolloCache,
      })
      appProviderTimer.logStep('Apollo client created')

      setApolloClient(_client)
    }
    initApollo().catch(console.error)
  }, [])

  const clearCache = useCallback(() => {
    if (!apolloCachePersistor) {
      return
    }
    apolloCachePersistor.purge()
  }, [apolloCachePersistor])

  if (!apolloClient || !apolloCachePersistor) {
    return (
      <MainLoader>
        <Spin size="large" />
        <Witties />
      </MainLoader>
    )
  }

  const reduxPersistor = persistStore(store)

  getTimer('AppLoad').logStep('apollo client & redux store initialized')
  return (
    <_ApolloProvider client={apolloClient}>
      <ErrorHandlerContext.Provider value={{onError: uiErrorHandler, sessionId}}>
        <AppContext.Provider value={{apolloCachePersistor, reduxPersistor}}>
          <Provider store={store}>
            <PersistGate loading={null} persistor={reduxPersistor}>
              <App showVersion={config.show_version} />
            </PersistGate>
          </Provider>
        </AppContext.Provider>
      </ErrorHandlerContext.Provider>
    </_ApolloProvider>
  )
}

export default AppProvider

const createApolloLinks = (
  errorHandler: (err: ErrorResponse | ApolloError, notify: boolean) => void,
  graphql_endpoints: string[],
  getTokenAsync: () => Promise<string>,
) => {
  const errorLink = onError((err) => errorHandler(err, true))
  const uriRotator = createUriRotatorApolloLink([...graphql_endpoints])
  const codeBatchingLink = new CodeBatchingLink()
  const httpLink = createHttpLink({uri: graphql_endpoints[0]})

  const withToken = setContext(async (_, {headers}) => {
    const token = await getTokenAsync()
    return {
      headers: {
        ...headers,
        Authorization: token ? `Bearer ${token}` : null,
      },
    }
  })

  return [
    errorLink,
    uriRotator,
    // FixtureLink,
    withToken.concat(codeBatchingLink),
    withToken.concat(httpLink),
  ]
}

const createApolloCache = () =>
  new InMemoryCache({
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

const createApolloCachePersistor = (apolloCache: ApolloCache<any>) =>
  new CachePersistor({
    cache: apolloCache,
    storage: new LocalForageWrapper(localforage),
    debug: true,
    trigger: 'write',
    maxSize: false,
  })

const createUriRotatorApolloLink = (uriPool: string[]) =>
  new ApolloLink((operation, forward) => {
    const nextUri = uriPool.shift()
    operation.setContext({
      uri: nextUri,
    })
    uriPool.push(nextUri)
    return forward(operation)
  })
