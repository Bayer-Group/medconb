import { Locator, Page } from "@playwright/test"

export const addPhenotypeCollection = (page: Page) =>
  page.getByText('PHENOTYPE COLLECTIONS .st0{').locator('.ant-btn').first().click()

export const addCodelistCollection = (page: Page) =>
  page.getByText('CODELIST COLLECTIONS .st0{').locator('.ant-btn').first().click()

export const deleteCollection = async (page: Page, collectionLocator: Locator) => {
  await collectionLocator.click({button: 'right'})

  await page.getByRole('menuitem', {name: 'Delete Collection'}).click()

  await page.getByRole('button', {name: 'Delete'}).click()

  await page.getByRole('button', {name: 'Delete'}).waitFor({state: 'detached', timeout: 500})
}

export const addPhenotypeCollectionIfNotExist = async (page: Page, collectionLocator: Locator) => {
  if ((await collectionLocator.count()) === 0) await addPhenotypeCollection(page)
}

export const addCodelistCollectionIfNotExist = async (page: Page, collectionLocator: Locator) => {
  if ((await collectionLocator.count()) === 0) await addCodelistCollection(page)
}
