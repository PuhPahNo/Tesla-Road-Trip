import fs from 'node:fs/promises'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const chromePath =
  process.env.CHROME_PATH ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const appUrl = process.env.APP_URL ?? 'http://localhost:5173'
const screenshotDir = path.resolve('docs/screenshots')

await fs.mkdir(screenshotDir, { recursive: true })

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})

try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 960, deviceScaleFactor: 1 })
  await page.goto(appUrl, { waitUntil: 'networkidle2', timeout: 60_000 })
  await page.waitForFunction(
    () =>
      document.body.textContent?.includes('Supercharger Quest Planner') &&
      Array.from(document.querySelectorAll('button')).some((button) =>
        button.textContent?.includes('Configure'),
      ),
    { timeout: 30_000 },
  )
  await page.evaluate(() => {
    const button = Array.from(document.querySelectorAll('button')).find((item) =>
      item.textContent?.includes('Configure'),
    )
    if (!(button instanceof HTMLButtonElement)) {
      throw new Error('Configure button was not found.')
    }
    button.click()
  })
  await page.waitForFunction(
    () =>
      Array.from(document.querySelectorAll('[role="dialog"]')).some((dialog) =>
        dialog.textContent?.includes('Configure optimization'),
      ),
    { timeout: 30_000 },
  )
  await page.screenshot({
    path: path.join(screenshotDir, 'config-modal.png'),
    fullPage: false,
  })

  await page.evaluate(() => {
    const setRangeByLabel = (labelText, value) => {
      const input = Array.from(
        document.querySelectorAll('input[type="range"]'),
      ).find((item) => item.getAttribute('aria-label') === labelText)
      if (!(input instanceof HTMLInputElement)) {
        throw new Error(`${labelText} input was not found.`)
      }
      const valueSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      )?.set
      valueSetter?.call(input, String(value))
      input.dispatchEvent(new Event('input', { bubbles: true }))
      input.dispatchEvent(new Event('change', { bubbles: true }))
    }

    const setSwitchByLabel = (labelText, checked) => {
      const button = Array.from(
        document.querySelectorAll('button[role="switch"]'),
      ).find((item) => item.getAttribute('aria-label') === labelText)
      if (!(button instanceof HTMLButtonElement)) {
        throw new Error(`${labelText} switch was not found.`)
      }
      const isChecked = button.getAttribute('aria-checked') === 'true'
      if (isChecked !== checked) {
        button.click()
      }
    }

    setRangeByLabel('Target stations', 700)
    setSwitchByLabel('Long-day optimization', true)

    const button = Array.from(document.querySelectorAll('button')).find((item) =>
      item.textContent?.includes('Apply & re-optimize'),
    )
    if (!(button instanceof HTMLButtonElement)) {
      throw new Error('Apply & re-optimize button was not found.')
    }
    button.click()
  })
  await page.waitForFunction(
    () => {
      const optimizing = document.body.textContent?.includes('Optimizing route…')
      const hasDayRows = document.querySelectorAll(
        'button[aria-label^="Open day "]',
      ).length > 0
      return !optimizing && hasDayRows
    },
    { timeout: 90_000 },
  )
  await page.screenshot({
    path: path.join(screenshotDir, 'desktop-optimized.png'),
    fullPage: false,
  })
  const overviewChecks = await page.evaluate(() => {
    const bodyText = document.body.textContent ?? ''
    return {
      dayRows: document.querySelectorAll('button[aria-label^="Open day "]').length,
      advisoryMention:
        bodyText.includes('aux charge') ||
        bodyText.includes('auxiliary') ||
        bodyText.includes('transfer connector') ||
        bodyText.includes('At least one day exceeds'),
      selectedRoute: bodyText.includes('Daily plan'),
      feasibility: bodyText.includes('All-sites reality check'),
    }
  })

  await page.click('button[aria-label="Choose route"]')
  await page.waitForFunction(
    () =>
      Array.from(document.querySelectorAll('[role="dialog"]')).some((dialog) =>
        dialog.textContent?.includes('Choose a route'),
      ),
    { timeout: 30_000 },
  )
  const routeOptions = await page.$$eval(
    'button[aria-label^="Select route "]',
    (buttons) => buttons.length,
  )
  await page.keyboard.press('Escape')
  await page.waitForFunction(
    () =>
      !Array.from(document.querySelectorAll('[role="dialog"]')).some((dialog) =>
        dialog.textContent?.includes('Choose a route'),
      ),
    { timeout: 30_000 },
  )

  await page.evaluate(() => {
    const statusTab = Array.from(document.querySelectorAll('[role="tab"]')).find(
      (item) => item.textContent?.trim() === 'Status',
    )
    if (!(statusTab instanceof HTMLButtonElement)) {
      throw new Error('Status tab was not found.')
    }
    statusTab.click()
  })
  await page.evaluate(() => {
    const guardrails = Array.from(document.querySelectorAll('button')).find(
      (item) =>
        item.textContent?.includes('Rule guardrails') ||
        item.textContent?.includes('Passport deadline'),
    )
    if (!(guardrails instanceof HTMLButtonElement)) {
      throw new Error('Rule guardrails panel was not found.')
    }
    if (guardrails.getAttribute('aria-expanded') !== 'true') {
      guardrails.click()
    }
  })
  await page.waitForFunction(
    () =>
      document.body.textContent?.includes('Road-accurate distances loaded') ||
      document.body.textContent?.includes('Distances are estimated') ||
      document.body.textContent?.includes('Road geometry fallback') ||
      document.body.textContent?.includes('Mapping '),
    { timeout: 30_000 },
  )

  const checks = await page.evaluate(() => {
    const loadedTiles = document.querySelectorAll('.leaflet-tile-loaded').length
    const modalVisible = Boolean(document.querySelector('[role="dialog"]'))
    const bodyText = document.body.textContent ?? ''
    const roadReady =
      bodyText.includes('Road-accurate distances loaded') ||
      bodyText.includes('Distances are estimated') ||
      bodyText.includes('Road geometry fallback') ||
      bodyText.includes('Mapping ')
    const desktopHorizontalOverflow =
      document.documentElement.scrollWidth > document.documentElement.clientWidth

    return {
      loadedTiles,
      modalVisible,
      desktopHorizontalOverflow,
      roadReady,
      stationSource: bodyText.includes('Station source'),
    }
  })
  Object.assign(checks, overviewChecks)
  checks.routeOptions = routeOptions

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 })
  await page.screenshot({
    path: path.join(screenshotDir, 'mobile-optimized.png'),
    fullPage: false,
  })
  checks.mobileHorizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  )

  const failures = []
  if (checks.routeOptions < 15) failures.push('expected many route options')
  if (checks.dayRows < 1) failures.push('expected day-level rows')
  if (!checks.advisoryMention) failures.push('expected advisory messaging')
  if (checks.loadedTiles < 1) failures.push('expected loaded map tiles')
  if (checks.modalVisible) failures.push('configuration modal should be closed')
  if (checks.desktopHorizontalOverflow) failures.push('desktop page has horizontal overflow')
  if (checks.mobileHorizontalOverflow) failures.push('mobile page has horizontal overflow')
  if (!checks.roadReady) failures.push('road status messaging was not shown')

  console.log(JSON.stringify(checks, null, 2))

  if (failures.length > 0) {
    throw new Error(`UI certification failed: ${failures.join('; ')}`)
  }
} finally {
  await browser.close()
}
