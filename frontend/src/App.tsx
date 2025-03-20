import React, {createContext, useContext, useEffect, useState} from 'react'
import {App as AntdApp, Button, ConfigProvider, Flex, Progress, Result, Space, Spin, Typography} from 'antd'
import enUSLocale from 'antd/lib/locale/en_US'
import useStorePersist from './useStorePersist'
import {size} from 'lodash'
import {FallbackProps} from 'react-error-boundary'
import * as Sentry from '@sentry/react'
import ErrorHandlerContext from './ErrorHandlerContext'
import {useDispatch, useSelector} from 'react-redux'
import MainLoader from './components/MainLoader'
import {ApolloClient, useApolloClient} from '@apollo/client'
import {FETCH_ONTOLOGY, ONTOLOGIES, SELF} from './graphql'
import Witties from './components/Witties'
import RootWorkspace from './RootWorkspace'
import {RouterProvider, createHashRouter} from 'react-router-dom'
import {CollectionsRoute} from './collections/CollectionDetail'
import {PhenotypeRoute} from './phenotypes/PhenotypeDetail'
import Codesets from './codesets/Codesets'
import HomeScreen from './search/HomeScreen'
import EmptyPane from './collections/Empty'
import {RootState} from './store'
import {useMsal} from '@azure/msal-react'
import asyncTokenLookup from './asyncTokenLookup'
import {ApplicationContext} from './ApplicationProvider'
import syncDB, {DBSyncError} from './syncDB'
import useReset from './useReset'

const {Paragraph} = Typography

type MedConbUserContextValue = {externalId: string; name: string; id: string}
export const MedConbUserContext = createContext<MedConbUserContextValue>({} as MedConbUserContextValue)

export type AppProps = {
  showVersion: boolean
  upgraded: boolean
}

const ErrorFallback: React.FC<FallbackProps> = ({error, resetErrorBoundary}) => {
  const {sessionId} = useContext(ErrorHandlerContext)
  const dispatch = useDispatch()
  return (
    <Result
      status="error"
      title="Something went wrong"
      style={{margin: '0 auto', width: '60%'}}
      extra={
        <>
          <Paragraph>
            <pre>{error.message}</pre>
          </Paragraph>
          <p>Session ID: {sessionId}</p>
          <Button
            type="primary"
            onClick={() => {
              dispatch({
                type: 'medconb/reset',
              })
              resetErrorBoundary()
            }}>
            Reset
          </Button>
        </>
      }
    />
  )
}

const router = createHashRouter([
  {
    path: '/',
    element: <RootWorkspace />,
    children: [
      {
        id: 'home',
        index: true,
        element: <HomeScreen />,
      },
      {
        id: 'collections',
        path: '/collection',
        children: [
          {id: 'collection_blank', index: true, element: <EmptyPane type="collection" />},
          {id: 'collection', path: ':type/:id', element: <CollectionsRoute />},
        ],
      },
      {
        id: 'phenotypes',
        path: '/phenotype',
        children: [
          {id: 'phenotype_blank', index: true, element: <EmptyPane type="phenotype" />},
          {id: 'phenotype', path: ':id', element: <PhenotypeRoute />},
        ],
      },
      {
        id: 'codeset',
        path: '/codeset',
        element: <Codesets />,
      },
      // {
      //   id: 'workspace',
      //   path: '/workspace',
      //   element: <OpenObject />,
      // },
    ],
  },
])

const App: React.FC<AppProps> = ({upgraded}) => {
  const {onError, setupLogger} = useContext(ErrorHandlerContext)
  const {config} = useContext(ApplicationContext)
  const {instance} = useMsal()
  const client = useApolloClient()
  const [loading, setLoading] = useState(true)
  const [dbSyncProgress, setDbSyncProgress] = useState<number>()
  const [appUserData, setAppUserData] = useState<MedConbUserContextValue>({} as MedConbUserContextValue)
  const changeSet = useSelector((state: RootState) => state.changes.changeSet)
  const [dbSyncError, setDbSyncError] = useState<string>()

  const syncing = useSelector((state: RootState) => state.changes.syncing)

  const resetApp = useReset()
  useEffect(() => {
    void (async () => {
      const res = await client.query({query: SELF, fetchPolicy: 'network-only'})

      try {
        await syncDB({
          baseUrl: config.graphql_endpoints[0].replace('graphql/', ''),
          tokenLookup: async () => await asyncTokenLookup(instance, config),
          onProgress: (progress) => setDbSyncProgress(progress),
        })
      } catch (e: any) {
        console.log(e)
        if (e instanceof DBSyncError) {
          setDbSyncError(e.message)
        }
      }

      setupLogger({
        externalId: res.data.self.externalId,
        name: res.data.self.name,
      })
      setAppUserData({
        externalId: res.data.self.externalId,
        name: res.data.self.name,
        id: res.data.self.id,
      })
      setTimeout(() => {
        setLoading(false)
      }, 300)
    })()
  }, [])

  useEffect(() => {
    //https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event#compatibility_notes
    const unloadListener = (e: BeforeUnloadEvent) => {
      e.preventDefault()

      return (e.returnValue = 'Are you sure you want to exit?')
    }
    // addEventListener('beforeunload', unloadListener)

    removeEventListener('beforeunload', unloadListener)
    if (syncing || size(changeSet) > 0) {
      addEventListener('beforeunload', unloadListener)
    }
    return () => {
      removeEventListener('beforeunload', unloadListener)
    }
  }, [changeSet, syncing])

  useStorePersist(5000)
  if (dbSyncError) {
    return (
      <MainLoader>
        <div style={{margin: '0 auto', textAlign: 'center'}}>
          <Flex vertical gap={16} justify="center">
            <Typography.Text>
              There was an error when loading the ontologies. You can try again by resetting the app.
            </Typography.Text>
            <div>
              <Button
                danger
                onClick={() => {
                  void resetApp()
                }}>
                Reset
              </Button>
            </div>
            <Typography.Text type="secondary">If this doesnt work, please contact support.</Typography.Text>
          </Flex>
        </div>
      </MainLoader>
    )
  }
  if (loading) {
    return (
      <MainLoader>
        <Spin size="large" />
        <Witties />
        <br />
        {dbSyncProgress !== undefined && (
          <>
            <div style={{margin: '0 auto', textAlign: 'center'}}>
              We have worked hard to bring you some updates.
              <br />
              Please wait while we load the latest data...
            </div>
            <div style={{width: 200, margin: '0 auto'}}>
              <Progress percent={dbSyncProgress} />
            </div>
          </>
        )}
      </MainLoader>
    )
  }

  return (
    <Sentry.ErrorBoundary
      fallback={ErrorFallback}
      // onError={(error: Error, info: {componentStack: string}) => {
      //   onError(error)
      // }}
    >
      <ConfigProvider
        locale={enUSLocale}
        theme={{
          components: {
            Menu: {
              iconMarginInlineEnd: 0,
              itemActiveBg: '#00BCFF',
              itemMarginInline: 20,
            },
            Dropdown: {
              fontSize: 12,
              controlHeight: 24,
            },
            Typography: {
              titleMarginTop: 1,
            },
            Select: {
              optionPadding: '2px 12px',
              optionHeight: 24,
            },
          },
          // algorithm: theme.compactAlgorithm,
          token: {
            fontSize: 12,
            borderRadius: 2,
            colorPrimary: '#00BCFF',
          },
        }}>
        <AntdApp>
          <MedConbUserContext.Provider value={appUserData}>
            <RouterProvider router={router} />
          </MedConbUserContext.Provider>
        </AntdApp>
      </ConfigProvider>
    </Sentry.ErrorBoundary>
  )
}

export default App
