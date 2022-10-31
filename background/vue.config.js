const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = {
  publicPath: process.argv[4] == 'localhost' ? 'http://localhost:8002/' : '/background/',
  outputDir: `../build/background`,
  devServer: {
    allowedHosts: 'all'
  },
  configureWebpack: {
    plugins: [
      new NodePolyfillPlugin()
    ]
  }
}
