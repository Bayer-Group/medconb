import {test, expect} from './fixtures'

test.describe('Check the functionalities for compare codelist for 2 codelists', () => {
  test('Check if comparing 2 codelists works', async ({page}) => {
    await page
      .locator('li')
      .filter({hasText: /Pacific AF \[Sample\]/})
      .getByRole('button')
      .click()

    await page.getByText('Coronary Artery Disease').click()

    await page.locator('.__item').first().waitFor({state: 'visible'})

    await page.locator('li').filter({hasText: 'Flieder [Sample] .st0{fill:#'}).getByRole('button').click()
    await page
      .locator('p')
      .filter({hasText: /^Angina$/})
      .click({
        button: 'right',
      })
    await page.getByText('Compare Codelist').click()

    // assert both checkboxes are visible
    await expect(page.locator('li').filter({hasText: 'I00-I99Diseases of the'}).locator('div').nth(2)).toBeVisible()
    await expect(page.locator('li').filter({hasText: 'I00-I99Diseases of the'}).locator('div').nth(3)).toBeVisible()

    await expect(page.locator('li').filter({hasText: 'I00-I99Diseases of the'}).locator('div').nth(2)).toHaveCSS(
      'background-color',
      'rgb(191, 191, 191)',
    )
    await expect(page.locator('li').filter({hasText: 'I00-I99Diseases of the'}).locator('div').nth(3)).toHaveCSS(
      'background-color',
      'rgb(191, 191, 191)',
    )

    // assert both checkboxes are visible
    await page
      .locator('li')
      .filter({hasText: 'Z00-Z99Factors influencing'})
      .locator('div')
      .nth(2)
      .waitFor({timeout: 10000, state: 'visible'})

    await expect(page.locator('li').filter({hasText: 'Z00-Z99Factors influencing'}).locator('div').nth(2)).toHaveCSS(
      'background-color',
      'rgb(191, 191, 191)',
    )
    await expect(page.locator('li').filter({hasText: 'Z00-Z99Factors influencing'}).locator('div').nth(3)).toHaveCSS(
      'background-color',
      'rgb(255, 255, 255)',
    )
  })

  test('Check if show only overlapping works', async ({page}) => {
    await page
      .locator('li')
      .filter({hasText: /Pacific AF \[Sample\]/})
      .getByRole('button')
      .click()

    await page.getByText('Coronary Artery Disease').click()

    await page.locator('.__item').first().waitFor({state: 'visible'})

    await page.locator('li').filter({hasText: 'Flieder [Sample] .st0{fill:#'}).getByRole('button').click()
    await page
      .locator('p')
      .filter({hasText: /^Angina$/})
      .click({
        button: 'right',
      })
    await page.getByText('Compare Codelist').click()

    await page.getByLabel('toggle viewer options').click()

    await page.getByRole('menuitem', {name: 'Show only overlapping'}).getByRole('switch').click()
    await page.getByText('Expand all selected').click()

    await page.locator('.treeview li').nth(6).waitFor({state: 'visible', timeout: 10000})
    await expect(page.locator('.treeview > li')).toHaveCount(1)
    await expect(page.locator('.treeview li')).toHaveCount(7)
  })

  test('Check if show differing works', async ({page}) => {
    await page
      .locator('li')
      .filter({hasText: /Pacific AF \[Sample\]/})
      .getByRole('button')
      .click()

    await page.getByText('Coronary Artery Disease').click()

    await page.locator('.__item').first().waitFor({state: 'visible'})

    await page.locator('li').filter({hasText: 'Flieder [Sample] .st0{fill:#'}).getByRole('button').click()
    await page
      .locator('p')
      .filter({hasText: /^Angina$/})
      .click({
        button: 'right',
      })
    await page.getByText('Compare Codelist').click()

    await page.getByLabel('toggle viewer options').click()

    await page.getByRole('menuitem', {name: 'Show differing'}).getByRole('switch').click()

    await expect(page.locator('.treeview > li')).toHaveCount(2)
  })

  test("Check if show only selected works", async ({page}) => {
    await page
      .locator('li')
      .filter({hasText: /Pacific AF \[Sample\]/})
      .getByRole('button')
      .click()

    await page.getByText('Coronary Artery Disease').click()

    await page.locator('.__item').first().waitFor({state: 'visible'})

    await page.locator('li').filter({hasText: 'Flieder [Sample] .st0{fill:#'}).getByRole('button').click()
    await page
      .locator('p')
      .filter({hasText: /^Angina$/})
      .click({
        button: 'right',
      })
    await page.getByText('Compare Codelist').click()

    await page.getByLabel('toggle viewer options').click()

    await page.locator('.treeview > li').nth(21).waitFor({state: 'visible'})

    await page.getByRole('menuitem', {name: 'Show only selected'}).getByRole('switch').click()

    await expect(page.locator('.treeview > li')).toHaveCount(2)
  })

  test("Check if list view works", async ({page}) => {
    await page
      .locator('li')
      .filter({hasText: /Pacific AF \[Sample\]/})
      .getByRole('button')
      .click()

    await page.getByText('Coronary Artery Disease').click()

    await page.locator('.__item').first().waitFor({state: 'visible'})

    await page.locator('li').filter({hasText: 'Flieder [Sample] .st0{fill:#'}).getByRole('button').click()
    await page
      .locator('p')
      .filter({hasText: /^Angina$/})
      .click({
        button: 'right',
      })
    await page.getByText('Compare Codelist').click()

    await page.getByLabel('toggle viewer options').click()

    await page.locator('.treeview > li').nth(21).waitFor({state: 'visible'})

    await page.getByRole('menuitem', {name: 'List view'}).getByRole('switch').click()

    await expect(page.locator('.__item')).toHaveCount(65)
  })
})
