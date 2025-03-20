import {test as base, expect} from '@playwright/test'
import {TEST_CONFIG} from './consts'

const test = base.extend({
  page: async ({page}, use) => {
    await page.goto(TEST_CONFIG.BASE_DEV_URL)

    await page.evaluate(() => {
      return new Promise<void>((res) => {
        const timeout = setTimeout(res, 3000)

        const request = window.indexedDB.open('localforage')

        const exit = () => {
          clearTimeout(timeout)
          res()
        }

        request.onsuccess = (event) => {
          const db = request.result

          const tx = db.transaction('keyvaluepairs', 'readwrite')

          const store = tx.objectStore('keyvaluepairs')

          store.delete(['persist:__MEDCONB__CHANGES', 'persist:__MEDCONB__UI', 'persist:__MEDCONB__WORKSPACE'])

          tx.oncomplete = exit
          tx.onerror = exit
        }
      })
    })

    await page.getByRole('button', {name: 'Sign in using dev token'}).click()

    await page.evaluate('window.__E2E = true')

    use(page)

    return page
  },
})

export {test, expect}
