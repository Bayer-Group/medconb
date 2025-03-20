import {expect, test} from '../fixtures'
import {
  addPhenotypeCollection,
  addCodelistCollection,
  addCodelistCollectionIfNotExist,
  addPhenotypeCollectionIfNotExist,
  deleteCollection,
} from '../utils'

test.describe('Check if CRUD for phenotype collection works', () => {
  test('Check if you can add new phenotype collection', async ({page}) => {
    await addPhenotypeCollection(page)
    await expect(page.getByText('Untitled Collection')).toBeVisible()
  })

  test('Check if you can delete phenotype collection', async ({page}) => {
    const locator = page.getByText('Untitled Collection')

    await deleteCollection(page, locator)

    await expect(page.getByText('Untitled Collection')).not.toBeVisible()
  })

  test('Check if you can rename phenotype collection by double clicking', async ({page}) => {
    const locator = page.getByText('Untitled Collection')

    addPhenotypeCollectionIfNotExist(page, locator)

    await locator.dblclick()
    await locator.fill('Example Collection')

    await page.getByText('SEARCHONTOLOGY VIEWERPHENOTYPE COLLECTIONS .st0{fill:#8C8C8C;} Example').click()

    await expect(page.getByText('Example Collection')).toBeVisible()

    await deleteCollection(page, page.getByText('Example Collection'))
  })

  test('Check if you can rename phenotype collection by right clicking', async ({page}) => {
    const locator = page.getByText('Untitled Collection')

    addPhenotypeCollectionIfNotExist(page, locator)

    await locator.click({button: 'right'})

    await page.getByRole('menuitem', {name: 'Rename Collection'}).click()
    await page.getByText('Untitled Collection').fill('Example Collection')

    await page.getByText('SEARCHONTOLOGY VIEWERPHENOTYPE COLLECTIONS .st0{fill:#8C8C8C;} Example').click()

    await expect(page.getByText('Example Collection')).toBeVisible()

    await deleteCollection(page, page.getByText('Example Collection'))
  })
})

test.describe('Check if CRUD for codelist collection works', () => {
  test('Check if you can add new codelist collection', async ({page}) => {
    await addCodelistCollection(page)
    await expect(page.getByText('Untitled Collection')).toBeVisible()
  })

  test('Check if you can delete codelist collection', async ({page}) => {
    const locator = page.getByText('Untitled Collection')

    await deleteCollection(page, locator)

    await expect(page.getByText('Untitled Collection')).not.toBeVisible()
  })

  test('Check if you can rename codelist collection by double clicking', async ({page}) => {
    const locator = page.getByText('Untitled Collection')

    addCodelistCollectionIfNotExist(page, locator)

    await locator.dblclick()
    await locator.fill('Example Collection')

    await page.getByText('SEARCHONTOLOGY VIEWERPHENOTYPE COLLECTIONS .st0{fill:#8C8C8C;}').click()

    await expect(page.getByText('Example Collection')).toBeVisible()

    await deleteCollection(page, page.getByText('Example Collection'))
  })

  test('Check if you can rename codelist collection by right clicking', async ({page}) => {
    const locator = page.getByText('Untitled Collection')

    addCodelistCollectionIfNotExist(page, locator)

    await locator.click({button: 'right'})

    await page.getByRole('menuitem', {name: 'Rename Collection'}).click()
    await page.getByText('Untitled Collection').fill('Example Collection')

    await page.getByText('SEARCHONTOLOGY VIEWERPHENOTYPE COLLECTIONS .st0{fill:#8C8C8C;}').click()

    await expect(page.getByText('Example Collection')).toBeVisible()

    await deleteCollection(page, page.getByText('Example Collection'))
  })
})
