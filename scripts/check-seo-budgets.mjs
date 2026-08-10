#!/usr/bin/env node

import { gzipSync } from 'node:zlib'
import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'

const projectRoot = process.cwd()
const distDir = path.join(projectRoot, 'dist')
const html = await readFile(path.join(distDir, 'index.html'), 'utf8')
const initialScripts = [...html.matchAll(/<script[^>]+src=["']([^"']+\.js)["']/g)]
  .map((match) => match[1])
const initialStyles = [...html.matchAll(/<link[^>]+href=["']([^"']+\.css)["']/g)]
  .map((match) => match[1])

if (!initialScripts.length) {
  throw new Error('No initial JavaScript entry was found in dist/index.html')
}

async function assetSize(assetPath) {
  const absolutePath = path.join(distDir, assetPath.replace(/^\//, ''))
  const contents = await readFile(absolutePath)
  return {
    assetPath,
    rawBytes: contents.byteLength,
    gzipBytes: gzipSync(contents).byteLength,
  }
}

const scriptSizes = await Promise.all(initialScripts.map(assetSize))
const styleSizes = await Promise.all(initialStyles.map(assetSize))
const initialJsGzip = scriptSizes.reduce((total, asset) => total + asset.gzipBytes, 0)
const jsBudgetKb = Number(process.env.SEO_INITIAL_JS_BUDGET_KB ?? 150)
const cssBudgetKb = Number(process.env.SEO_INITIAL_CSS_BUDGET_KB ?? 35)
const initialCssGzip = styleSizes.reduce((total, asset) => total + asset.gzipBytes, 0)

const landingDir = path.join(projectRoot, 'public', 'landing')
const landingFiles = await readdir(landingDir)
const oversizedModernImages = []
for (const file of landingFiles.filter((name) => /\.(avif|webp)$/i.test(name))) {
  const bytes = (await stat(path.join(landingDir, file))).size
  if (bytes > 300 * 1024) oversizedModernImages.push({ file, bytes })
}

const requiredSocialImages = [
  'chargequest-home.jpg',
  'chargequest-competition.jpg',
  'chargequest-badges.jpg',
  'chargequest-routes.jpg',
]
const socialDir = path.join(projectRoot, 'public', 'social')
const socialImageSizes = await Promise.all(requiredSocialImages.map(async (file) => ({
  file,
  bytes: (await stat(path.join(socialDir, file))).size,
})))

function kib(bytes) {
  return (bytes / 1024).toFixed(1)
}

for (const asset of scriptSizes) {
  console.log(`initial JS ${asset.assetPath}: ${kib(asset.gzipBytes)} KiB gzip`)
}
for (const asset of styleSizes) {
  console.log(`initial CSS ${asset.assetPath}: ${kib(asset.gzipBytes)} KiB gzip`)
}

const failures = []
if (initialJsGzip > jsBudgetKb * 1024) {
  failures.push(`Initial JavaScript is ${kib(initialJsGzip)} KiB gzip; budget is ${jsBudgetKb} KiB`)
}
if (initialCssGzip > cssBudgetKb * 1024) {
  failures.push(`Initial CSS is ${kib(initialCssGzip)} KiB gzip; budget is ${cssBudgetKb} KiB`)
}
for (const image of oversizedModernImages) {
  failures.push(`${image.file} is ${kib(image.bytes)} KiB; modern landing-image budget is 300 KiB`)
}
for (const image of socialImageSizes) {
  if (image.bytes > 300 * 1024) {
    failures.push(`${image.file} is ${kib(image.bytes)} KiB; social-image budget is 300 KiB`)
  }
}

if (failures.length) {
  for (const failure of failures) console.error(`- ${failure}`)
  process.exitCode = 1
} else {
  console.log('SEO asset budgets passed.')
}
