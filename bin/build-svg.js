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

async function buildIcons () {
  await mkdir(path.resolve(__dirname, '../static/icons'), {
    recursive: true
  })
  for (const theme of [{ name: '' }, { name: '-alt', bg: '#3c2947', fg: '#d4bbff' }]) {
    const icon = Buffer.from(makeIcon(theme))
    const iosIcon = Buffer.from(makeIcon({ ...theme, ios: true }))
    const maskableIcon = Buffer.from(makeIcon({ ...theme, maskable: true }))
    await writeFile(
      path.resolve(__dirname, `../static/icons/icon-192${theme.name}.png`),
      await render(icon, 192)
    )
    await writeFile(
      path.resolve(__dirname, `../static/icons/icon-512${theme.name}.png`),
      await render(icon, 512)
    )
    await writeFile(
      path.resolve(
        __dirname,
        `../static/icons/icon-192-maskable${theme.name}.png`
      ),
      await render(maskableIcon, 192)
    )
    await writeFile(
      path.resolve(
        __dirname,
        `../static/icons/icon-512-maskable${theme.name}.png`
      ),
      await render(maskableIcon, 512)
    )
    await writeFile(
      path.resolve(
        __dirname,
        `../static/icons/apple-touch-icon${theme.name}.png`
      ),
      await render(iosIcon, 180)
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
