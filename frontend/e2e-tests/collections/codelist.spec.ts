import {Locator, Page} from '@playwright/test'
import {expect, test} from '../fixtures'
import {addCodelistCollectionIfNotExist} from '../utils'

const deleteCodelist = async (page: Page, collectionLocator: Locator) => {
  await collectionLocator.click({button: 'right'})

  await page.getByRole('menuitem', {name: 'Delete Codelist'}).click()

  await page.getByRole('button', {name: 'Delete'}).click()

  await page.getByRole('button', {name: 'Delete'}).waitFor({state: 'detached', timeout: 500})
}

test.describe('Check features of codelist collection detail page', () => {
  test('Check if Navigation to codelist collection works.', async ({page}) => {
    await page.getByText('Pacific AF [Sample]', {exact: true}).click()

    await expect(page.getByRole('cell', {name: 'Coronary Artery Disease'})).toBeVisible()
  })

  test('Check if rename codelist collection works.', async ({page}) => {
    await page.getByText('Pacific AF [Sample]', {exact: true}).click()

    await page.getByRole('heading', {name: 'Pacific AF [Sample]'}).fill('Pacific AF [Sample] Test')
    await page.getByRole('heading', {name: 'Pacific AF [Sample]'}).pressSequentially('\n')

    await expect(page.getByText('Pacific AF [Sample] Test')).toHaveCount(3)

    await page.getByRole('heading', {name: 'Pacific AF [Sample] Test'}).fill('Pacific AF [Sample]')
    await page.getByRole('heading', {name: 'Pacific AF [Sample]'}).pressSequentially('\n')
  })

  test('Check if add/delete codelist to collection works.', async ({page}) => {
    await page.getByText('Pacific AF [Sample]', {exact: true}).click()

    await page.getByRole('button', {name: 'Create new codelist'}).click()

    await expect(page.getByRole('cell', {name: 'Untitled Codelist'})).toBeVisible()

    await deleteCodelist(page, page.getByRole('cell', {name: 'Untitled Codelist'}))

    await expect(page.getByRole('cell', {name: 'Untitled Codelist'})).not.toBeVisible()
  })

  test('Check if delete codelist collection action works', async ({page}) => {
    const locator = page.getByText('Untitled Collection')
    addCodelistCollectionIfNotExist(page, locator)

    await page.getByText('Untitled Collection', {exact: true}).click()

    await page.getByRole('button', {name: 'Actions caret-down'}).click()

    await page.getByRole('menuitem', {name: 'Delete Collection'}).click()

    await page.getByRole('button', {name: 'Delete'}).click()

    await page.getByRole('button', {name: 'Delete'}).waitFor({state: 'detached', timeout: 500})

    await expect(
      page.locator('[data-tour-target=__private-phenotype-collection__]').getByText('Untitled Collection'),
    ).not.toBeVisible()
  })
})
