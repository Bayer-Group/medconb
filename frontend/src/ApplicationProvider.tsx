import {NormalizedCacheObject} from '@apollo/client'
import {CachePersistor} from 'apollo3-cache-persist'
import React, {createContext} from 'react'
import {ApplicationConfig} from '..'
import {Persistor} from 'redux-persist'
type ApplicationContextType = {
  apolloCachePersistor: CachePersistor<NormalizedCacheObject>
  config: ApplicationConfig
  reduxPersistor: Persistor
}

export const ApplicationContext = createContext({} as ApplicationContextType)

const ApplicationProvider: React.FC<ApplicationContextType & React.PropsWithChildren> = ({
  apolloCachePersistor,
  config,
  reduxPersistor,
  children,
}) => {
  return (
    <ApplicationContext.Provider value={{apolloCachePersistor, config, reduxPersistor}}>
      {children}
    </ApplicationContext.Provider>
  )
}

export default ApplicationProvider
