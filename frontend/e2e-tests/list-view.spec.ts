import {test, expect} from './fixtures'

test.describe('Check if toolbar viewer options works as expected.', () => {
  const CAD_SELECTED_CODELISTS = {
    ICD_9_CM: 24,
    ICD_10_CM: 65,
  }

  test(`Check if the number of selected items in ICD-10-CM is ${CAD_SELECTED_CODELISTS.ICD_10_CM} (List View)`, async ({
    page,
  }) => {
    await page.getByText('Pacific AF [Sample]').click()
    await page.getByText('Coronary Artery Disease').click()

    // wait for the first list item to be rendered so we can toggle dropdown in the toolbar
    await page.locator('.__item').first().waitFor({state: 'attached'})
    // get the toolbar dropdown button and click it, not ideal but works
    await page.getByLabel('toggle viewer options').click()

    await page.getByRole('menuitem', {name: 'List view'}).getByRole('switch').click()

    await expect(page.locator('.__item')).toHaveCount(CAD_SELECTED_CODELISTS.ICD_10_CM)
  })

  test(`Check if the number of selected items in ICD-9-CM is ${CAD_SELECTED_CODELISTS.ICD_9_CM} (List View)`, async ({
    page,
  }) => {
    await page.getByText('Pacific AF [Sample]').click()
    await page.getByText('Coronary Artery Disease').click()

    await page.locator('.__item').first().waitFor({state: 'attached'})
    await page.getByLabel('toggle viewer options').click()

    await page.getByRole('menuitem', {name: 'List view'}).getByRole('switch').click()

    await page.getByRole('button', {name: 'ICD-10-CM caret-down'}).click()
    await page.getByRole('menu').getByText('ICD-9-CM').click()

    await expect(page.locator('.__item')).toHaveCount(CAD_SELECTED_CODELISTS.ICD_9_CM)
  })

  test('Check if show only selected works', async ({page}) => {
    await page.getByText('Pacific AF [Sample]').click()
    await page.getByText('Coronary Artery Disease').click()

    await page.locator('.__item').first().waitFor({state: 'attached'})
    await page.getByLabel('toggle viewer options').click()

    await page.locator('.__list-loading').last().waitFor({state: 'hidden', timeout: 1500})
    await page.locator('.__item').nth(21).waitFor({state: 'attached'})

    await page.getByRole('menuitem', {name: 'Show only selected'}).getByRole('switch').click()

    await expect(page.locator('.treeview > li')).toHaveCount(2, {timeout: 2000})
  })

  test('Check if all collapsed items are being rendered', async ({page}) => {
    await page.getByText('Pacific AF [Sample]').click()
    await page.getByText('Coronary Artery Disease').click()

    await page.locator('.__item').first().waitFor({state: 'attached'})
    await page.getByLabel('toggle viewer options').click()

    await page.getByText('Collapse all tiers').click()

    await page.locator('.__list-loading').last().waitFor({state: 'hidden', timeout: 1500})

    await page.locator('li').filter({hasText: 'Z00-Z99Factors influencing'}).first().waitFor({state: 'visible'})

    await expect(page.locator('.treeview li')).toHaveCount(22)
  })
})

test.describe('Check if search works', () => {
  test('Check if search code works', async ({page}) => {
    await page.getByText('Pacific AF [Sample]').click()
    await page.getByText('Coronary Artery Disease').click()

    await page.locator('.ant-input').first().pressSequentially('A00\n')

    await page.locator('.__item').first().waitFor({state: 'visible'})

    // there should only be 1 item at that point in the list
    await expect(page.locator('.treeview > li')).toHaveCount(1)
  })

  test('Check if search description works', async ({page}) => {
    await page.getByText('Pacific AF [Sample]').click()
    await page.getByText('Coronary Artery Disease').click()

    await page.locator('.__item').first().waitFor({state: 'attached'})
    await page.getByLabel('toggle viewer options').click()

    await page.getByText('Collapse all tiers').click()

    await page.getByPlaceholder('Search Description').pressSequentially('Cholera\n')

    await expect(page.locator('.treeview > li')).toHaveCount(1)
    await expect(page.locator('.treeview li')).toHaveCount(3)
  })

  test('Check if regex search code works', async ({page}) => {
    await page.getByText('Pacific AF [Sample]').click()
    await page.getByText('Coronary Artery Disease').click()

    await page.locator('.__item').first().waitFor({state: 'attached'})
    await page.getByLabel('toggle viewer options').click()

    await page.getByText('Collapse all tiers').click()

    await page.getByLabel('toggle regex mode').click()

    await page.locator('.ant-input').first().fill('^[A-C]00')
    await page.locator('.ant-input').first().pressSequentially('$\n')

    await expect(page.locator('.treeview > li')).toHaveCount(2)
    await expect(page.locator('.treeview li')).toHaveCount(8)
  })
})

test('Check if visibility toggle works', async ({page}) => {
  await page.getByText('Pacific AF [Sample]').click()
  await page.getByText('Coronary Artery Disease').click()

  await page.getByLabel('Toggle Code List visibility').click()

  await page.locator('.__item').first().waitFor({state: 'attached'})
  await page.getByLabel('toggle viewer options').click()

  await page.locator('.__item').nth(21).waitFor({state: 'attached'})

  await page.getByRole('menuitem', {name: 'Show only selected'}).getByRole('switch').click()

  await page.keyboard.press('Escape')

  await expect(page.getByText("The currently active filters don't match any codes in this ontology.")).toBeVisible()

  await page.getByLabel('Toggle Code List visibility').click()

  await expect(page.locator('.treeview > li')).toHaveCount(2, {timeout: 200})
})
