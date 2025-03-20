import {test, expect} from '../fixtures'

test.describe('Check if treeview items can be edited', () => {
  test('Navigation through dropdown', async ({page}) => {
    await page
      .locator('li')
      .filter({hasText: /Pacific AF \[Sample\]/})
      .getByRole('button')
      .click()

    await page.getByText('Coronary Artery Disease').click()
    await page
      .locator('div')
      .filter({hasText: /^A00-B99Certain infectious and parasitic diseases \(A00-B99\)$/})
      .first()
      .click()

    await page.locator('.__list-loading').waitFor({state: 'hidden'})

    await page.getByText('A00-A09Intestinal infectious').click()

    await page.locator('.__list-loading').waitFor({state: 'hidden'})

    await page.getByText('A00Cholera').click()

    await page
      .locator('li')
      .filter({hasText: /^A00\.0Cholera due to Vibrio cholerae 01, biovar cholerae$/})
      .locator('div')
      .nth(2)
      .click()

    await expect(page.getByText('66', {exact: true})).toBeVisible({timeout: 200})
  })

  test('Navigate through buttons', async ({page}) => {
    await page.getByText('Pacific AF [Sample]').click()
    await page.getByText('Coronary Artery Disease').click()
    await page
      .locator('div')
      .filter({hasText: /^A00-B99Certain infectious and parasitic diseases \(A00-B99\)$/})
      .first()
      .click()
    await page.getByText('A00-A09Intestinal infectious').click()
    await page.getByText('A00Cholera').click()

    await page
      .locator('li')
      .filter({hasText: /^A00\.0Cholera due to Vibrio cholerae 01, biovar cholerae$/})
      .locator('div')
      .nth(2)
      .click()

    await expect(page.getByText('66', {exact: true})).toBeVisible({timeout: 200})
  })
})
