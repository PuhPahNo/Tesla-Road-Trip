import fs from 'node:fs/promises'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const chromePath =
  process.env.CHROME_PATH ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const publicDir = path.resolve('public')
const masterPath = path.join(publicDir, 'favicon-master.png')
const masterPng = await fs.readFile(masterPath)
const masterDataUrl = `data:image/png;base64,${masterPng.toString('base64')}`
const outputs = [
  { file: 'favicon-16.png', size: 16 },
  { file: 'favicon-32.png', size: 32 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
]

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})

try {
  const page = await browser.newPage()
  for (const output of outputs) {
    await page.setViewport({
      width: output.size,
      height: output.size,
      deviceScaleFactor: 1,
    })
    await page.setContent(
      `<style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#000}img{display:block;width:100%;height:100%}</style><img src="${masterDataUrl}" alt="">`,
    )
    await page.waitForFunction(() => document.querySelector('img')?.complete)
    await page.screenshot({
      path: path.join(publicDir, output.file),
      omitBackground: false,
    })
  }
} finally {
  await browser.close()
}

console.log(`Generated ${outputs.length} favicon assets from favicon-master.png.`)
