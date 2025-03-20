import {InteractionRequiredAuthError, IPublicClientApplication} from '@azure/msal-browser'
import {get} from 'lodash'
import {ApplicationConfig} from '..'

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

const asyncTokenLookup = async (instance: IPublicClientApplication, config: ApplicationConfig) => {
  // todo: remove
  if (qd.dev_auth && config.dev_token) return config.dev_token

  const accounts = instance.getAllAccounts()

  const account = get(accounts, '[0]')
  if (account) {
    try {
      const result = await instance.acquireTokenSilent({
        scopes: config.msal.scopes,
        account,
      })

      return result.accessToken
    } catch (err) {
      if (err instanceof InteractionRequiredAuthError) {
        // fallback to interaction when silent call fails
        await instance.acquireTokenPopup({scopes: config.msal.scopes})
        return
      }
    }
  } else {
    await instance.acquireTokenPopup({scopes: config.msal.scopes})
    return
  }
}

export default asyncTokenLookup

export {qd}
