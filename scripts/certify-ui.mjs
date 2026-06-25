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
  await page.waitForSelector('.config-modal', { timeout: 30_000 })
  await page.screenshot({
    path: path.join(screenshotDir, 'config-modal.png'),
    fullPage: false,
  })

  await page.evaluate(() => {
    const setInputByLabel = (labelText, value) => {
      const label = Array.from(document.querySelectorAll('label')).find(
        (item) => item.textContent?.includes(labelText),
      )
      const input = label?.querySelector('input')
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

    const setCheckboxByLabel = (labelText, checked) => {
      const label = Array.from(document.querySelectorAll('label')).find(
        (item) => item.textContent?.includes(labelText),
      )
      const input = label?.querySelector('input')
      if (!(input instanceof HTMLInputElement)) {
        throw new Error(`${labelText} checkbox was not found.`)
      }
      if (input.checked !== checked) {
        input.click()
      }
    }

    setInputByLabel('Target unique sites', 700)
    setCheckboxByLabel('Long-day optimization', true)

    const button = Array.from(document.querySelectorAll('button')).find((item) =>
      item.textContent?.includes('Optimize routes'),
    )
    if (!(button instanceof HTMLButtonElement)) {
      throw new Error('Optimize routes button was not found.')
    }
    button.click()
  })
  await page.waitForSelector('.route-option', { timeout: 30_000 })
  await page.waitForFunction(
    () => {
      const status = document.querySelector('.road-status')
      return (
        status?.classList.contains('ready') ||
        status?.classList.contains('error')
      )
    },
    { timeout: 90_000 },
  )
  await page.screenshot({
    path: path.join(screenshotDir, 'desktop-optimized.png'),
    fullPage: false,
  })

  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 })
  await page.screenshot({
    path: path.join(screenshotDir, 'mobile-optimized.png'),
    fullPage: false,
  })

  const checks = await page.evaluate(() => {
    const text = (selector) =>
      document.querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim()
    const routeOptions = document.querySelectorAll('.route-option').length
    const dayRows = document.querySelectorAll('.day-table tbody tr').length
    const longDayNotes = document.querySelectorAll('.long-day-note').length
    const advisoryBoxes = document.querySelectorAll('.advisory-box').length
    const loadedTiles = document.querySelectorAll('.leaflet-tile-loaded').length
    const modalVisible = Boolean(document.querySelector('.config-modal'))
    const roadStatus = text('.road-status')
    const roadReady = document
      .querySelector('.road-status')
      ?.classList.contains('ready')
    const horizontalOverflow =
      document.documentElement.scrollWidth > document.documentElement.clientWidth

    return {
      routeOptions,
      dayRows,
      longDayNotes,
      advisoryBoxes,
      loadedTiles,
      modalVisible,
      horizontalOverflow,
      roadReady,
      roadStatus,
      stationSource: text('.source-bar h2'),
      selectedRoute: text('.day-panel h2'),
      feasibility: text('.feasibility h2'),
    }
  })

  const failures = []
  if (checks.routeOptions !== 5) failures.push('expected five route options')
  if (checks.dayRows < 1) failures.push('expected day-level rows')
  if (checks.longDayNotes < 1) failures.push('expected long-day explanation rows')
  if (checks.advisoryBoxes < 1) failures.push('expected advisory messaging')
  if (checks.loadedTiles < 1) failures.push('expected loaded map tiles')
  if (checks.modalVisible) failures.push('configuration modal should be closed')
  if (checks.horizontalOverflow) failures.push('page has horizontal overflow')
  if (!checks.roadReady) failures.push(`road geometry not ready: ${checks.roadStatus}`)

  console.log(JSON.stringify(checks, null, 2))

  if (failures.length > 0) {
    throw new Error(`UI certification failed: ${failures.join('; ')}`)
  }
} finally {
  await browser.close()
}
