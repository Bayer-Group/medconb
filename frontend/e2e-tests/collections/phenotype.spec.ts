import {Locator, Page} from '@playwright/test'
import {expect, test} from '../fixtures'
import { addPhenotypeCollectionIfNotExist } from '../utils'

const deletePhenotype = async (page: Page, collectionLocator: Locator) => {
  await collectionLocator.click({button: 'right'})

  await page.getByRole('menuitem', {name: 'Delete Phenotype'}).click()

  await page.getByRole('button', {name: 'Delete'}).click()

  await page.getByRole('button', {name: 'Delete'}).waitFor({state: 'detached', timeout: 500})
}

test.describe('Check features of collection detail page', () => {
  test('Check if Navigation to phenotype collection works.', async ({page}) => {
    await page.getByText('Phenotype Collection', {exact: true}).click()

    await expect(page.getByRole('cell', {name: 'CKD'})).toBeVisible()
  })

  test('Check if rename phenotype collection works.', async ({page}) => {
    await page.getByText('Phenotype Collection', {exact: true}).click()

    await page.getByRole('heading', {name: 'Phenotype Collection'}).fill('Test Collection')
    await page.getByRole('heading', {name: 'Test Collection'}).pressSequentially('\n')

    await expect(page.getByText('Test Collection')).toHaveCount(3)

    await page.getByRole('heading', {name: 'Test Collection'}).fill('Phenotype Collection')
    await page.getByRole('heading', {name: 'Phenotype Collection'}).pressSequentially('\n')
  })

  test('Check if add/delete phenotype to collection works.', async ({page}) => {
    await page.getByText('Phenotype Collection', {exact: true}).click()

    await page.getByRole('button', {name: 'Create new phenotype'}).click()

    await expect(page.getByRole('cell', {name: 'Untitled Phenotype'})).toBeVisible()

    await deletePhenotype(page, page.getByRole('cell', {name: 'Untitled Phenotype'}))

    await expect(page.getByRole('cell', {name: 'Untitled Phenotype'})).not.toBeVisible()
  })

  test('Check if delete phenotype collection action works', async ({page}) => {
    const locator = page.getByText('Untitled Collection')
    addPhenotypeCollectionIfNotExist(page, locator)

    await page.getByText('Untitled Collection', {exact: true}).click()

    await page.getByRole('button', {name: 'Actions caret-down'}).click()

    await page.getByRole('menuitem', {name: 'Delete Collection'}).click()

    await page.getByRole('button', {name: 'Delete'}).click()

    await page.getByRole('button', {name: 'Delete'}).waitFor({state: 'detached', timeout: 500})

    await expect(page.locator('[data-tour-target=__private-phenotype-collection__]').getByText('Untitled Collection')).not.toBeVisible()
  })
})
