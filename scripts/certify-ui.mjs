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

  // Cockpit chrome ready: brand island + Configure action.
  await page.waitForFunction(
    () =>
      document.body.textContent?.includes('Quest Planner') &&
      Array.from(document.querySelectorAll('button')).some((button) =>
        button.getAttribute('aria-label') === 'Configure',
      ),
    { timeout: 30_000 },
  )

  // Wait for the first optimize to finish (splash + optimize spinner gone,
  // focus day bar present).
  await page.waitForFunction(
    () => {
      const text = document.body.textContent ?? ''
      return (
        !text.includes('Charting the 2026 Americas competition') &&
        !document.querySelector('.animate-spin') &&
        text.includes('DAY ')
      )
    },
    { timeout: 90_000 },
  )

  // Open the config slide-over and adjust the plan.
  await page.click('button[aria-label="Configure"]')
  await page.waitForFunction(
    () =>
      Array.from(document.querySelectorAll('[role="dialog"]')).some((dialog) =>
        dialog.textContent?.includes('Tune the optimizer'),
      ),
    { timeout: 30_000 },
  )
  await page.screenshot({
    path: path.join(screenshotDir, 'config-slideover.png'),
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

    setRangeByLabel('Target streak days', 60)
    setSwitchByLabel('Long-day optimization', true)

    const button = Array.from(document.querySelectorAll('button')).find((item) =>
      item.textContent?.includes('Optimize route'),
    )
    if (!(button instanceof HTMLButtonElement)) {
      throw new Error('Optimize route button was not found.')
    }
    button.click()
  })

  // Optimize finishes (spinner gone) and the focus bar returns.
  await page.waitForFunction(
    () =>
      !document.querySelector('.animate-spin') &&
      (document.body.textContent ?? '').includes('DAY '),
    { timeout: 90_000 },
  )

  // Open the Daily plan panel from the icon rail and count day rows.
  await page.click('button[aria-label="Daily plan"]')
  await page.waitForFunction(
    () => document.querySelectorAll('button[aria-label^="Open day "]').length > 0,
    { timeout: 30_000 },
  )
  await page.screenshot({
    path: path.join(screenshotDir, 'desktop-optimized.png'),
    fullPage: false,
  })
  const overviewChecks = await page.evaluate(() => {
    const bodyText = document.body.textContent ?? ''
    return {
      dayRows: document.querySelectorAll('button[aria-label^="Open day "]').length,
      focusBar: bodyText.includes('DAY '),
      calendarButton: Boolean(
        document.querySelector('button[aria-label="Open trip calendar"]'),
      ),
    }
  })

  // Advisory messaging lives in the Overview panel.
  await page.click('button[aria-label="Overview"]')
  await page.waitForFunction(
    () => document.body.textContent?.includes('At a glance'),
    { timeout: 30_000 },
  )
  overviewChecks.advisoryMention = await page.evaluate(() => {
    const bodyText = document.body.textContent ?? ''
    return (
      bodyText.includes('aux charge') ||
      bodyText.includes('auxiliary') ||
      bodyText.includes('transfer connector') ||
      bodyText.includes('unique Supercharger per streak day') ||
      bodyText.includes('24-hour streak') ||
      bodyText.includes('At least one day exceeds')
    )
  })

  // Trip calendar opens from the focus bar.
  await page.click('button[aria-label="Open trip calendar"]')
  await page.waitForFunction(
    () => document.body.textContent?.includes('Trip calendar'),
    { timeout: 30_000 },
  )
  await page.screenshot({
    path: path.join(screenshotDir, 'trip-calendar.png'),
    fullPage: false,
  })
  await page.keyboard.press('Escape')
  await page.waitForFunction(
    () => !document.body.textContent?.includes('Trip calendar ·'),
    { timeout: 30_000 },
  )

  // Route picker.
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

  // Guardrails panel: source + road status messaging.
  await page.click('button[aria-label="Guardrails"]')
  await page.waitForFunction(
    () =>
      document.body.textContent?.includes('Rule guardrails') &&
      (document.body.textContent?.includes('Road-accurate distances loaded') ||
        document.body.textContent?.includes('Distances are estimated') ||
        document.body.textContent?.includes('Road geometry fallback') ||
        document.body.textContent?.includes('Mapping ')),
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
  checks.mobileTabBar = await page.evaluate(() =>
    Array.from(document.querySelectorAll('nav button')).some((button) =>
      button.textContent?.includes('Copilot'),
    ),
  )

  const failures = []
  if (checks.routeOptions < 20) failures.push('expected at least 20 route options')
  if (checks.dayRows < 1) failures.push('expected day-level rows')
  if (!checks.focusBar) failures.push('expected the focus day bar')
  if (!checks.calendarButton) failures.push('expected the trip calendar button')
  if (!checks.advisoryMention) failures.push('expected advisory messaging')
  if (checks.loadedTiles < 1) failures.push('expected loaded map tiles')
  if (checks.modalVisible) failures.push('configuration slide-over should be closed')
  if (checks.desktopHorizontalOverflow) failures.push('desktop page has horizontal overflow')
  if (checks.mobileHorizontalOverflow) failures.push('mobile page has horizontal overflow')
  if (!checks.mobileTabBar) failures.push('expected the mobile tab bar')
  if (!checks.roadReady) failures.push('road status messaging was not shown')

  console.log(JSON.stringify(checks, null, 2))

  if (failures.length > 0) {
    throw new Error(`UI certification failed: ${failures.join('; ')}`)
  }
} finally {
  await browser.close()
}
