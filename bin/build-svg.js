import svgs from './svgs.js'
import path from 'path'
import fs from 'fs'
import { promisify } from 'util'
import { optimize } from 'svgo'
import * as cheerio from 'cheerio'
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

// Wraps the source PNG in an SVG so resvg can resize it and add maskable padding.
// paddingFraction: fraction of each side reserved as safe-zone padding (0.1 = 10% for maskable)
function sourceIconSvg (pngBase64, size, paddingFraction = 0) {
  const pad = Math.round(size * paddingFraction)
  const inner = size - pad * 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">` +
    `<image href="data:image/png;base64,${pngBase64}" x="${pad}" y="${pad}" ` +
    `width="${inner}" height="${inner}" preserveAspectRatio="xMidYMid meet"/>` +
    '</svg>'
}

// Generates all PWA icons from static/icons/icon-source.png (single source of truth).
// To change the app icon, replace icon-source.png and rebuild.
async function buildIcons () {
  await mkdir(path.resolve(__dirname, '../static/icons'), {
    recursive: true
  })

  const sourcePath = path.resolve(__dirname, '../static/icons/icon-source.png')
  const base64 = (await readFile(sourcePath)).toString('base64')

  for (const size of [192, 512]) {
    await writeFile(
      path.resolve(__dirname, `../static/icons/icon-${size}.png`),
      await render(sourceIconSvg(base64, size, 0), size)
    )
    await writeFile(
      path.resolve(__dirname, `../static/icons/icon-${size}-maskable.png`),
      await render(sourceIconSvg(base64, size, 0.1), size)
    )
  }
  await writeFile(
    path.resolve(__dirname, '../static/icons/apple-touch-icon.png'),
    await render(sourceIconSvg(base64, 180, 0), 180)
  )
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
