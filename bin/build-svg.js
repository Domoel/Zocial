import svgs from './svgs.js'
import path from 'path'
import fs from 'fs'
import { promisify } from 'util'
import { optimize } from 'svgo'
import * as cheerio from 'cheerio'
import { makeIcon } from '../src/routes/_utils/makeIcon.js'
import { Resvg } from '@resvg/resvg-js'
const $ = cheerio.load('')

const __dirname = path.dirname(new URL(import.meta.url).pathname)
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const mkdir = promisify(fs.mkdir)

async function readSvg (svg) {
  const filepath = path.join(__dirname, '../', svg.src)
  const content = await readFile(filepath, 'utf8')
  const optimized = await optimize(content, { multipass: true })
  const $optimized = $(optimized.data)
  const $path = $optimized.find('path, circle').removeAttr('fill')
  const viewBox =
    $optimized.attr('viewBox') ||
    `0 0 ${$optimized.attr('width')} ${$optimized.attr('height')}`
  const $symbol = $('<symbol></symbol>')
    .attr('id', svg.id)
    .attr('viewBox', viewBox)
    .append($path)
  return $.xml($symbol)
}

async function render (svg, size) {
  return new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: size
    }
  }).render().asPng()
}

// Returns an SVG string for the Zocial app icon.
// paddingFraction: extra padding as fraction of size (0.1 = 10% each side for maskable safe zone)
function makeZocialIcon (paddingFraction = 0) {
  const total = 100
  const pad = total * paddingFraction
  const inner = total - pad * 2
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7B35BE"/>
      <stop offset="100%" stop-color="#2B80D0"/>
    </linearGradient>
  </defs>
  <rect width="${total}" height="${total}" fill="url(#g)"/>
  <svg x="${pad}" y="${pad}" width="${inner}" height="${inner}" viewBox="0 0 128 128">
    <path fill="white" d="M31 15h68a7 7 0 0 1 7 7v13a9 9 0 0 1-2 5L57 94h45a7 7 0 0 1 7 7v12a7 7 0 0 1-7 7H29a7 7 0 0 1-7-7v-13a9 9 0 0 1 2-5l47-54H31a7 7 0 0 1-7-7V22a7 7 0 0 1 7-7Z"/>
  </svg>
</svg>`
}

async function buildIcons () {
  await mkdir(path.resolve(__dirname, '../static/icons'), {
    recursive: true
  })

  // Main icons — gradient design matching the Zocial brand
  const icon = Buffer.from(makeZocialIcon(0))
  const maskableIcon = Buffer.from(makeZocialIcon(0.1))

  for (const size of [192, 512]) {
    await writeFile(
      path.resolve(__dirname, `../static/icons/icon-${size}.png`),
      await render(icon, size)
    )
    await writeFile(
      path.resolve(__dirname, `../static/icons/icon-${size}-maskable.png`),
      await render(maskableIcon, size)
    )
  }
  await writeFile(
    path.resolve(__dirname, '../static/icons/apple-touch-icon.png'),
    await render(icon, 180)
  )

  // Alt theme icons (used for notification/badge variants)
  for (const theme of [{ name: '-alt', bg: '#3c2947', fg: '#d4bbff' }]) {
    const altIcon = Buffer.from(makeIcon(theme))
    const altIosIcon = Buffer.from(makeIcon({ ...theme, ios: true }))
    const altMaskableIcon = Buffer.from(makeIcon({ ...theme, maskable: true }))
    await writeFile(
      path.resolve(__dirname, `../static/icons/icon-192${theme.name}.png`),
      await render(altIcon, 192)
    )
    await writeFile(
      path.resolve(__dirname, `../static/icons/icon-512${theme.name}.png`),
      await render(altIcon, 512)
    )
    await writeFile(
      path.resolve(__dirname, `../static/icons/icon-192-maskable${theme.name}.png`),
      await render(altMaskableIcon, 192)
    )
    await writeFile(
      path.resolve(__dirname, `../static/icons/icon-512-maskable${theme.name}.png`),
      await render(altMaskableIcon, 512)
    )
    await writeFile(
      path.resolve(__dirname, `../static/icons/apple-touch-icon${theme.name}.png`),
      await render(altIosIcon, 180)
    )
  }
}

export async function buildSvg () {
  await buildIcons()
  const inlineSvgs = svgs.filter(_ => _.inline)
  const regularSvgs = svgs.filter(_ => !_.inline)

  const inlineSvgStrings = (await Promise.all(inlineSvgs.map(readSvg))).join('')
  const regularSvgStrings = (await Promise.all(regularSvgs.map(readSvg))).join(
    ''
  )

  const inlineOutput = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">${inlineSvgStrings}</svg>`
  const regularOutput = `<svg xmlns="http://www.w3.org/2000/svg">${regularSvgStrings}</svg>`

  await writeFile(
    path.resolve(__dirname, '../static/icons.svg'),
    regularOutput,
    'utf8'
  )

  return inlineOutput
}
