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
import syncDB, {DBSyncError} from './syncDB'
import useReset from './useReset'
import {AuthContext} from './AuthProvider'
import {getConfig} from './config'
import {DBSyncProgress} from './syncTypes'

const {Paragraph} = Typography

type MedConbUserContextValue = {externalId: string; name: string; id: string}
export const MedConbUserContext = createContext<MedConbUserContextValue>({} as MedConbUserContextValue)

export type AppProps = {
  showVersion: boolean
}

const ErrorFallback: Sentry.FallbackRender = ({error, resetError}) => {
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
              resetError()
            }}>
            Reset the app
          </Button>
        </>
      }
    />
  )
}

const router = createHashRouter([
  {
    path: '/',
    element: (
      <Sentry.ErrorBoundary fallback={(props) => React.createElement(ErrorFallback, props)}>
        <RootWorkspace />
      </Sentry.ErrorBoundary>
    ),
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

const App: React.FC<AppProps> = () => {
  const {onError} = useContext(ErrorHandlerContext)
  const client = useApolloClient()
  const [loading, setLoading] = useState(true)
  const [dbSyncProgress, setDbSyncProgress] = useState<DBSyncProgress>()
  const [appUserData, setAppUserData] = useState<MedConbUserContextValue>({} as MedConbUserContextValue)
  const changeSet = useSelector((state: RootState) => state.changes.changeSet)
  const [dbSyncError, setDbSyncError] = useState<string>()

  const config = getConfig()

  const {getTokenAsync} = useContext(AuthContext)

  const syncing = useSelector((state: RootState) => state.changes.syncing)

  const resetApp = useReset()
  useEffect(() => {
    void (async () => {
      const res = await client.query({query: SELF, fetchPolicy: 'network-only'})

      try {
        await syncDB({
          baseUrl: config.graphql_endpoints[0].replace('graphql/', ''),
          tokenLookup: async () => await getTokenAsync(),
          onProgress: (progress) => setDbSyncProgress(progress),
        })
      } catch (e: any) {
        console.log(e)
        if (e instanceof DBSyncError) {
          setDbSyncError(e.message)
        }
      }

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
            <div style={{width: 300, margin: '10px auto'}}>
              {/* Overall progress */}
              <div style={{marginBottom: 16}}>
                <div style={{fontSize: 12, marginBottom: 4, fontWeight: 500}}>Overall Progress</div>
                <Progress
                  percent={Math.round(
                    (dbSyncProgress.reduce((sum, o) => sum + o.countLoaded, 0) /
                      dbSyncProgress.reduce((sum, o) => sum + o.countTotal, 0)) *
                      100,
                  )}
                  strokeColor="#00BCFF"
                />
              </div>

              {/* Individual ontology progress */}
              {dbSyncProgress.map((ontology) => (
                <div key={ontology.name} style={{marginBottom: 5}}>
                  <div style={{fontSize: 11, marginBottom: '-0.5em', color: '#666'}}>
                    {ontology.name} ({ontology.countLoaded} / {ontology.countTotal})
                  </div>
                  <Progress percent={ontology.percent} size="small" showInfo={false} strokeColor="#52c41a" />
                </div>
              ))}
            </div>
          </>
        )}
      </MainLoader>
    )
  }

  return (
    <Sentry.ErrorBoundary
      fallback={(props) => React.createElement(ErrorFallback, props)}
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
