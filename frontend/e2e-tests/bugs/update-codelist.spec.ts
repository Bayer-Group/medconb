import {test, expect} from '../fixtures'

test.describe('Check if changes is being reported properly', () => {
  test('Check if change is being shown when number of selected codelist is changed', async ({page}) => {
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

    await page.getByLabel('toggle viewer options').click()
    await page.getByRole('menuitem', {name: 'Show only selected'}).getByRole('switch').click()
    await page.getByText('Diseases of the circulatory').click()
    await page.getByText('Ischemic heart diseases (I20-').click()
    await page.getByText('Angina pectoris').click()
    await page
      .locator('li')
      .filter({hasText: /^I20\.0Unstable angina$/})
      .locator('div')
      .nth(2)
      .click()

    await expect(page.locator('[data-codelist-state]')).toBeVisible({timeout: 200})
  })
})
