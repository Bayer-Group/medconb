const path = require('path')

const AppSourceDir = path.join(__dirname, '..', 'assets')

module.exports = {
  stories: ['../stories/**/*.stories.@(js|jsx|ts|tsx)', '../src/components/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: ['@storybook/addon-links', '@storybook/addon-essentials', '@storybook/addon-interactions'],
  framework: '@storybook/react',
  core: {
    builder: '@storybook/builder-webpack5',
  },
  webpackFinal: (config) => {
    config.module.rules.push({
      test: /\.(ts|js|tsx|jsx)$/,
      exclude: /node_modules/,
      use: [
        {
          loader: require.resolve('@linaria/webpack-loader'),
          options: {
            sourceMap: process.env.NODE_ENV !== 'production',
            extension: '.css',
            babelOptions: {
              configFile: path.resolve(__dirname, '../babel.config.js'),
            },
          },
        },
      ],
    })
    config.module.rules.push({
      test: /\.less$/,
      use: [
        require.resolve('style-loader'),
        require.resolve('css-loader'),
        {
          loader: require.resolve('less-loader'),
          options: {
            lessOptions: {
              javascriptEnabled: true,
            },
          },
        },
      ],
    })
    // config.module.rules.push({
    //   test: /\.(woff|woff2|eot|ttf|otf)$/,
    //   use: [
    //     require.resolve('file-loader'),
    //     {
    //       loader: require.resolve('less-loader'),
    //       options: {
    //         outputPath: 'dist/static/fonts/',
    //         publicPath: (url) => '/static/fonts/' + url,
    //       },
    //     },
    //   ],
    // })

    const svgRule = config.module.rules.find((rule) => 'test.svg'.match(rule.test))
    svgRule.exclude = [AppSourceDir]

    config.module.rules.push({
      test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
      include: [AppSourceDir],
      use: [
        require.resolve('babel-loader'),
        {
          loader: require.resolve('@svgr/webpack'),
          options: {
            babel: false,
            icon: true,
            svgo: false,
          },
        },
      ],
    })

    return config
  },
}
