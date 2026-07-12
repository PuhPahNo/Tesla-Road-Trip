import fs from 'node:fs/promises'
import path from 'node:path'
import puppeteer from 'puppeteer-core'

const chromePath =
  process.env.CHROME_PATH ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const sourcePath = path.resolve('design/brand/header-logo-black.png')
const outputPath = path.resolve('public/chargequest-logo.png')
const source = await fs.readFile(sourcePath)
const sourceDataUrl = `data:image/png;base64,${source.toString('base64')}`

const browser = await puppeteer.launch({
  executablePath: chromePath,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})

try {
  const page = await browser.newPage()
  const transparentDataUrl = await page.evaluate(async (imageUrl) => {
    const image = new Image()
    image.src = imageUrl
    await image.decode()

    const canvas = document.createElement('canvas')
    canvas.width = image.naturalWidth
    canvas.height = image.naturalHeight
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('Unable to create the logo canvas context.')

    context.drawImage(image, 0, 0)
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
    for (let index = 0; index < pixels.data.length; index += 4) {
      const red = pixels.data[index]
      const green = pixels.data[index + 1]
      const blue = pixels.data[index + 2]
      const brightness = Math.max(red, green, blue)

      if (brightness <= 6) {
        pixels.data[index + 3] = 0
        continue
      }

      const alpha = Math.min(255, Math.round(((brightness - 6) / 249) * 255))
      pixels.data[index] = Math.min(255, Math.round((red / brightness) * 255))
      pixels.data[index + 1] = Math.min(255, Math.round((green / brightness) * 255))
      pixels.data[index + 2] = Math.min(255, Math.round((blue / brightness) * 255))
      pixels.data[index + 3] = alpha
    }

    context.clearRect(0, 0, canvas.width, canvas.height)
    context.putImageData(pixels, 0, 0)
    return canvas.toDataURL('image/png')
  }, sourceDataUrl)

  await fs.writeFile(outputPath, Buffer.from(transparentDataUrl.split(',')[1], 'base64'))
} finally {
  await browser.close()
}

console.log('Generated transparent ChargeQuest header logo from the approved black master.')
