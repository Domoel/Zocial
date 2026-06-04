// Generates PWA icon PNGs from static/icons/icon-source.png
// Output: static/icons/icon-{192,512}.png and icon-{192,512}-maskable.png
//
// Regular icons: source image resized to target size
// Maskable icons: source image centered with 10% padding (80% safe zone)
//
// To update icons: replace static/icons/icon-source.png and run pnpm build-icons

import path from 'path'
import fs from 'fs'
import { promisify } from 'util'
import { Resvg } from '@resvg/resvg-js'

const __dirname = path.dirname(new URL(import.meta.url).pathname)
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const copyFile = promisify(fs.copyFile)

const SOURCE_PATH = path.resolve(__dirname, '../static/icons/icon-source.png')
const OUT_DIR = path.resolve(__dirname, '../static/icons')
const SIZES = [192, 512]

async function renderAtSize (pngData, targetSize, paddingFraction = 0) {
  const padding = Math.round(targetSize * paddingFraction)
  const inner = targetSize - padding * 2
  const base64 = pngData.toString('base64')
  // Use href (SVG 2.0) — resvg supports data URI images
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${targetSize}" height="${targetSize}">`,
    `  <image href="data:image/png;base64,${base64}"`,
    `    x="${padding}" y="${padding}" width="${inner}" height="${inner}"`,
    `    preserveAspectRatio="xMidYMid meet"/>`,
    `</svg>`
  ].join('\n')

  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: targetSize } })
  const result = resvg.render()
  if (result.width === 0 || result.height === 0) {
    throw new Error('resvg rendered empty image — data URI likely unsupported')
  }
  return result.asPng()
}

async function main () {
  if (!fs.existsSync(SOURCE_PATH)) {
    console.error('Missing source icon: static/icons/icon-source.png')
    console.error('Place your logo PNG there and re-run.')
    process.exit(1)
  }

  const source = await readFile(SOURCE_PATH)

  for (const size of SIZES) {
    // Regular icon
    if (size === 512) {
      // Source is already 512×512 — copy directly, no quality loss
      await copyFile(SOURCE_PATH, path.join(OUT_DIR, `icon-${size}.png`))
    } else {
      await writeFile(
        path.join(OUT_DIR, `icon-${size}.png`),
        await renderAtSize(source, size, 0)
      )
    }

    // Maskable: 10% padding each side → content within 80% safe zone
    await writeFile(
      path.join(OUT_DIR, `icon-${size}-maskable.png`),
      await renderAtSize(source, size, 0.1)
    )

    console.log(`✓ icon-${size}.png + icon-${size}-maskable.png`)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
