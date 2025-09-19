import localforage from 'localforage'

import {getConfig} from './config'
import {db} from './db'
import {getTimer} from './utils/timer'

type StoredVersion = {
  b: string
  f: string
}

export const versionCheck = async (updateLoadingScreen: (msg: string) => void) => {
  const versionTimer = getTimer('Init').createSubTimer('VersionCheck')
  versionTimer.logStep('Starting version check')

  let upgraded = false

  // usage of '__welcome__tour_seen' removed in 2023-12-20 08:14:12
  // this is simply for cleanup. by now (2025), probably nobody has
  // it in their localstorage anymore. could be removed.
  localforage.removeItem('__welcome__tour_seen').catch(console.error)

  // Run backend request and local storage retrieval in parallel
  const [statusResponse, currVersions] = await Promise.all([
    (async () => {
      const backendTimer = versionTimer.createSubTimer('BackendRequest')
      const response = await fetch((getConfig().graphql_endpoints[0] as string).replace('/graphql/', ''))
      const result = await response.json()
      backendTimer.logStep('Backend version request completed')
      return result
    })(),
    (async () => {
      const storageTimer = versionTimer.createSubTimer('LocalStorageRetrieval')
      const result: StoredVersion = (await localforage.getItem('__v')) || {b: '', f: ''}
      storageTimer.logStep('Local storage retrieval completed')
      return result
    })(),
  ])

  versionTimer.logStep('Parallel operations completed')

  if (statusResponse.status === 'ok') {
    const backendVersion = statusResponse.version
    const frontendVersion = COMMIT_HASH.trim()

    const versionSuffix = versionSuffixOf(backendVersion)
    const storedVersionSuffix = versionSuffixOf(currVersions.b)

    console.log(`Backend version was ${currVersions.b} and is now ${backendVersion}`)
    console.log(`Frontend version was ${currVersions.f} and is now ${frontendVersion}`)
    versionTimer.logStep('Version comparison completed')

    if (!currVersions.b || !currVersions.f || currVersions.b !== backendVersion || currVersions.f !== frontendVersion) {
      updateLoadingScreen('Upgrading to new version, please wait...')
      console.log('Clearing local cache')
      console.time('Clearing local cache')
      upgraded = true
      await localforage.clear()
      await localforage.setItem('__v', {b: backendVersion, f: frontendVersion})
      console.timeEnd('Clearing local cache')
      versionTimer.logStep('Local cache cleared')

      if (versionSuffix != storedVersionSuffix) {
        updateLoadingScreen(
          'Upgrading to new version, please wait...</br>Ontologies have changed, clearing local ontology cache (can take up to a minute)...',
        )
        console.log('Clearing local ontology cache')
        console.time('Clearing local ontology cache')
        await db.codes.clear()
        await db.ontologies.clear()
        console.timeEnd('Clearing local ontology cache')
        versionTimer.logStep('Ontology cache cleared')
      }
    } else {
      versionTimer.logStep('No version upgrade needed')
    }
  } else {
    // currently not implemened in backend
  }

  versionTimer.logTotal()
  return upgraded
}

const versionSuffixOf = (version: string) => {
  const dashIndex = version.indexOf('-')
  return dashIndex !== -1 ? version.substring(dashIndex + 1) : ''
}
