export default {
  ecma: 8,
  mangle: true,
  compress: {
    // Strip console.log only on the production channel (main builds). Dev-channel builds
    // (and `npm run dev`, which doesn't minify) keep them, so the Logs page can show the
    // full debug output. NOTE: every Docker build runs with NODE_ENV=production, so we key
    // off the release channel here, not the build mode.
    pure_funcs: process.env.ZOCIAL_CHANNEL === 'prod' ? ['console.log'] : []
  },
  output: {
    comments: false
  },
  safari10: true
}
