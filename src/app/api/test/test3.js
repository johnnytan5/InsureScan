// test3.js (ES module-compatible way to load a CommonJS module)
import { createRequire } from 'module'
import fs from 'fs'
import { fileURLToPath } from 'url'
import path from 'path'

const require = createRequire(import.meta.url)
const pdf2img = require('pdf-img-convert')

// Optional: resolve relative file paths
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const outputImages = await pdf2img.convert(path.join(__dirname, '/Users/johnnytan/Downloads/CNandReceiptWaterMarkNew_1711845430379.pdf'))

for (let i = 0; i < outputImages.length; i++) {
  await fs.promises.writeFile(path.join(__dirname, `output-${i}.png`), outputImages[i])
}

console.log(`✅ Done converting ${outputImages.length} pages.`)
