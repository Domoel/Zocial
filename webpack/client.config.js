import path from 'path'
import webpack from 'webpack'
import config from 'sapper/config/webpack.js'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
import terser from './terser.config.js'
import CircularDependencyPlugin from 'circular-dependency-plugin'
import {
  dev,
  inlineSvgs,
  isUpstream,
  mode,
  resolve,
  version,
  channel
} from './shared.config.js'
import VirtualModulesPlugin from 'webpack-virtual-modules'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'

import urlRegex from '../src/routes/_utils/urlRegexSource.js'

const output = Object.assign(config.client.output(), {
  // enables HMR in workers
  globalObject: 'this',
  filename: dev ? '[fullhash]/[id].js' : '[id].[contenthash].[name].js',
  chunkFilename: dev ? '[fullhash]/[id].js' : '[id].[contenthash].[name].js'
})
if (output.publicPath[0] !== '/') {
  output.publicPath = '/' + output.publicPath
}

process.on('unhandledRejection', (err) => {
  // TODO: seems to be a Webpack Bundle Analyzer error we can safely ignore
  if (
    !err.message.includes(
      "Error: No such label 'done hook' for WebpackLogger.timeEnd()"
    )
  ) {
    console.error(err)
  }
})

export default {
  entry: config.client.entry(),
  output,
  resolve,
  mode,
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          dev ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          path.join(__dirname, './csso-loader.cjs')
        ]
      },
      {
        test: /tesseract\.js\/dist\/worker\.min\.js$/,
        type: 'asset/resource'
      },
      {
        test: /\.[tj]s$/,
        exclude: /node_modules/,
        use: {
          loader: path.join(__dirname, './svelte-intl-loader.cjs')
        }
      },
      {
        test: /\.ts$/,
        use: [
          !(dev || process.env.DEBUG) && '@easrng/elements/minify',
          'esbuild-loader'
        ],
        exclude: /node_modules/
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: 'svelte-loader',
            options: {
              dev,
              hydratable: true,
              store: true,
              hotReload: dev,
              emitCss: true
            }
          },
          {
            loader: path.join(__dirname, './svelte-intl-loader.cjs')
          }
        ]
      }
    ].filter(Boolean)
  },
  optimization: dev
    ? {}
    : {
        minimize: !process.env.DEBUG,
        minimizer: [
          terser()
        ],
        // TODO: we should be able to enable this, but Sapper breaks if we do so
        // // isolate runtime chunk to avoid excessive cache invalidations https://webpack.js.org/guides/caching/
        // runtimeChunk: 'single',
        splitChunks: {
          chunks: 'async',
          minSize: 5000,
          maxAsyncRequests: Infinity,
          maxInitialRequests: Infinity
        }
      },
  plugins: [
    !dev && new MiniCssExtractPlugin({
      ignoreOrder: true,
      filename: dev ? '[fullhash]/[id].css' : '[id].[contenthash].[name].css',
      chunkFilename: dev ? '[fullhash]/[id].css' : '[id].[contenthash].[name].css'
    }),
    new VirtualModulesPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.INLINE_SVGS': JSON.stringify(inlineSvgs),
      'process.env.URL_REGEX': urlRegex().toString(),
      // The emoji picker ships English UI labels; runtime-localising it is a separate enhancement.
      'process.env.EMOJI_PICKER_I18N': 'undefined',
      ZOCIAL_VERSION: JSON.stringify(version),
      ZOCIAL_CHANNEL: JSON.stringify(channel),
      ZOCIAL_IS_SERVICE_WORKER: 'false',
      ZOCIAL_IS_BROWSER: 'true',
      'process.env.THEME_COLORS': 'null',
      'process.env.UPSTREAM': isUpstream,
      'process.env.SINGLE_INSTANCE': JSON.stringify(process.env.SINGLE_INSTANCE || '')
    }),
    new CircularDependencyPlugin({
      exclude: /node_modules/,
      failOnError: true,
      cwd: process.cwd()
    }),
    dev && new webpack.HotModuleReplacementPlugin({
      requestTimeout: 120000
    }),
    new BundleAnalyzerPlugin({
      analyzerMode: 'static',
      openAnalyzer: false,
      logLevel: 'silent',
      generateStatsFile: true
    })
  ].filter(Boolean),
  devtool: 'source-map',
  performance: {
    hints: dev ? false : (process.env.DEBUG ? 'warning' : 'error'),
    // The main entrypoint bundles all UI-language tables (~100 KiB minified) so the language can
    // be switched at runtime — a deliberate, accepted size increase (see _intl/). Raised from the
    // 244 KiB default to leave headroom while still catching genuine bloat regressions. If initial
    // load size becomes a concern, lazy-load non-default locales instead of raising this further.
    maxAssetSize: 409600, // 400 KiB
    maxEntrypointSize: 409600, // 400 KiB
    assetFilter: (assetFilename) => {
      return !/\.map$|tesseract-asset|\$(polyfill|katex)\$/.test(assetFilename)
    }
  }
}
