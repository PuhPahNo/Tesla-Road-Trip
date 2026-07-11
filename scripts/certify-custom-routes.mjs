import puppeteer from 'puppeteer-core'

const chromePath =
  process.env.CHROME_PATH ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const appUrl = process.env.APP_URL ?? 'http://localhost:5173'
const originalName = 'UI Certification Route'
const updatedName = 'UI Certification Route Updated'

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})

try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 1 })
  await page.goto(appUrl, { waitUntil: 'networkidle2', timeout: 60_000 })
  await page.waitForSelector('button[aria-label="Choose route"]', { timeout: 90_000 })
  await page.waitForFunction(
    () => {
      const text = document.body.textContent ?? ''
      return (
        !text.includes('Charting the 2026 Americas competition') &&
        !document.querySelector('.animate-spin') &&
        text.includes('DAY ')
      )
    },
    { timeout: 120_000 },
  )

  await page.click('button[aria-label="Choose route"]')
  await page.waitForFunction(
    () =>
      Array.from(document.querySelectorAll('button')).some(
        (button) => button.textContent?.trim() === 'Create Custom Route',
      ),
    { timeout: 30_000 },
  )
  await clickButtonByText(page, 'Create Custom Route')

  await page.waitForSelector('#custom-route-name', { timeout: 30_000 })
  await page.type('#custom-route-name', originalName)
  await setInputValue(page, '#custom-route-days', '70')
  const firstAddedLabel = await page.$eval(
    'button[aria-label^="Add "][aria-label$=" to custom route"]',
    (button) => {
      const label = button.getAttribute('aria-label') ?? ''
      button.click()
      return label.replace(/^Add /, '').replace(/ to custom route$/, '')
    },
  )
  await clickButtonByText(page, 'Save and optimize')

  await page.waitForSelector(`button[aria-label^="Select route ${originalName},"]`, {
    timeout: 120_000,
  })
  const createdText = await page.$eval(
    `button[aria-label^="Select route ${originalName},"]`,
    (button) => button.textContent ?? '',
  )
  if (!createdText.includes('70 days')) {
    throw new Error('Created custom route did not use its 70-day target.')
  }

  await page.click(`button[aria-label="Edit ${originalName}"]`)
  await page.waitForSelector('#custom-route-name', { timeout: 30_000 })
  await setInputValue(page, '#custom-route-name', updatedName)
  await setInputValue(page, '#custom-route-days', '71')
  await page.$eval(
    'button[aria-label^="Add "][aria-label$=" to custom route"]',
    (button) => button.click(),
  )
  await page.click(`button[aria-label="Remove ${firstAddedLabel}"]`)
  await clickButtonByText(page, 'Update and optimize')

  await page.waitForSelector(`button[aria-label^="Select route ${updatedName},"]`, {
    timeout: 120_000,
  })
  const updatedText = await page.$eval(
    `button[aria-label^="Select route ${updatedName},"]`,
    (button) => button.textContent ?? '',
  )
  if (!updatedText.includes('71 days')) {
    throw new Error('Edited custom route did not use its 71-day target.')
  }

  await page.click(`button[aria-label="Delete ${updatedName}"]`)
  await page.click(`button[aria-label="Confirm delete ${updatedName}"]`)
  await page.waitForFunction(
    (name) =>
      !Array.from(document.querySelectorAll('button')).some((button) =>
        button.getAttribute('aria-label')?.startsWith(`Select route ${name},`),
      ),
    { timeout: 120_000 },
    updatedName,
  )

  const savedRoutes = await page.evaluate(async () => {
    const response = await fetch('/api/custom-routes')
    return (await response.json()).routes
  })
  if (savedRoutes.some((route) => route.name === originalName || route.name === updatedName)) {
    throw new Error('Certification route remained after delete.')
  }

  console.log(
    JSON.stringify({
      createDays: 70,
      editDays: 71,
      addedAndRemovedLocations: true,
      renamed: true,
      deleted: true,
    }),
  )
} finally {
  await browser.close()
}

async function clickButtonByText(page, text) {
  const clicked = await page.evaluate((label) => {
    const button = Array.from(document.querySelectorAll('button')).find(
      (candidate) => candidate.textContent?.trim() === label,
    )
    if (!(button instanceof HTMLButtonElement)) return false
    button.click()
    return true
  }, text)
  if (!clicked) throw new Error(`Button not found: ${text}`)
}

async function setInputValue(page, selector, value) {
  await page.$eval(
    selector,
    (input, nextValue) => {
      if (!(input instanceof HTMLInputElement)) {
        throw new Error(`Input not found: ${input}`)
      }
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      )?.set
      setter?.call(input, nextValue)
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    },
    value,
  )
}
