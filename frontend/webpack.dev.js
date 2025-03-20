const path = require('path')
const {merge} = require('webpack-merge')
const common = require('./webpack.common.js')
const openBrowser = require('react-dev-utils/openBrowser')

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    static: path.join(__dirname, './src'),
    port: 3001,
    hot: 'only',
    onListening: function (devServer) {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined')
      }
      const addr = devServer.server.address()
      openBrowser(`http://localhost:${addr.port}`)
    },
    compress: true,
  },
})
