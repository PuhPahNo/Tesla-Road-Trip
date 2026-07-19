import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildSitemapXml } from './seo'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sitemapPath = path.join(repoRoot, 'public', 'sitemap.xml')

await writeFile(sitemapPath, buildSitemapXml(), 'utf8')
console.log(`Generated ${sitemapPath}`)
