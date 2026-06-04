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

// Generates all PWA icons from static/icons/icon-source.svg (single source of truth).
// resvg rasterizes the SVG reliably at any size. To change the icon, edit icon-source.svg.
async function buildIcons () {
  await mkdir(path.resolve(__dirname, '../static/icons'), {
    recursive: true
  })

  const sourcePath = path.resolve(__dirname, '../static/icons/icon-source.svg')
  const sourceSvg = await readFile(sourcePath, 'utf8')

  // The source is a square, full-bleed icon, so every variant is the same image
  // at a different size. Android/iOS apply their own corner masking; the "maskable"
  // PNGs just need to exist for the manifest's purpose:"maskable" entries.
  for (const size of [192, 512]) {
    await writeFile(
      path.resolve(__dirname, `../static/icons/icon-${size}.png`),
      await render(sourceSvg, size)
    )
    await writeFile(
      path.resolve(__dirname, `../static/icons/icon-${size}-maskable.png`),
      await render(sourceSvg, size)
    )
  }
  await writeFile(
    path.resolve(__dirname, '../static/icons/apple-touch-icon.png'),
    await render(sourceSvg, 180)
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
