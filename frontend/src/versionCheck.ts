import localforage from 'localforage'

import {getConfig} from './config'
import {db} from './db'

type StoredVersion = {
  b: string
  f: string
}

export const versionCheck = async () => {
  let upgraded = false
  await localforage.removeItem('__welcome__tour_seen')
  const xmlHttp = new XMLHttpRequest()
  xmlHttp.open('GET', (getConfig().graphql_endpoints[0] as string).replace('/graphql/', ''), false)
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
