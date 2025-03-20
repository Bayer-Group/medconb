const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const { DefinePlugin } = require('webpack')
const CopyPlugin = require('copy-webpack-plugin')

let gitSha = 'no-git'
try {
  gitSha = require('child_process').execSync('git rev-parse --short HEAD').toString()
} catch (e) { }

module.exports = {
  entry: path.resolve(__dirname, 'src', 'index.tsx'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    assetModuleFilename: 'images/[name][ext][query]',
  },
  // mode: 'development',
  module: {
    rules: [
      {
        test: /\.(ts|js|tsx|jsx)$/,
        use: [
          'babel-loader',
          {
            loader: '@linaria/webpack-loader',
            options: {
              sourceMap: process.env.NODE_ENV !== 'production',
            },
          },
        ],
        exclude: /node_modules/,
        // exclude: [
        //   {
        //     test: path.resolve(__dirname, 'node_modules'),
        //     exclude: path.resolve(__dirname, 'node_modules/regexpp2'),
        //   },
        // ],
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.less$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'less-loader',
            options: {
              lessOptions: {
                javascriptEnabled: true,
                modifyVars: {
                  //https://4x.ant.design/docs/react/customize-theme
                  'font-size-base': '12px',
                  'btn-square-only-icon-size': '16px',
                },
              },
            },
          },
        ],
      },
      {
        test: /\.(?:ico|gif|png|jpg|jpeg)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.(woff(2)?|eot|ttf|otf|)$/,
        type: 'asset/inline',
      },
      {
        test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: 'babel-loader',
          },
          {
            loader: '@svgr/webpack',
            options: {
              babel: false,
              icon: true,
              svgo: false,
            },
          },
        ],
      },
      {
        test: /\.md$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[name][ext][query]',
        },
      },
      {
        test: /\.ya?ml$/,
        use: 'yaml-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.tsx', '.ts'],
    alias: {
      react: path.resolve('./node_modules/react'),
      'react-dnd': path.resolve('./node_modules/react-dnd'),
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, './public/index.html'),
    }),
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: 'styles-[contenthash].css',
    }),
    new DefinePlugin({
      COMMIT_HASH: JSON.stringify(gitSha),
    }),
    new CopyPlugin({
      patterns: [{ from: 'assets/config', to: 'config' }],
    }),
  ],
  // devtool: 'eval-source-map',
  // devServer: {
  //   static: path.join(__dirname, './src'),
  //   port: 3001,
  //   hot: 'only',
  //   compress: true,
  //   open: true,
  // },
}
