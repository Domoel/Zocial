export default {
  ecma: 8,
  mangle: true,
  compress: {
    pure_funcs: [
      'console.log' // remove console.log in production (perf); dev keeps them
    ]
  },
  output: {
    comments: false
  },
  safari10: true
}
