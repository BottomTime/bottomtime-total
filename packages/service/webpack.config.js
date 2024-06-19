/* eslint-disable no-process-env, @typescript-eslint/no-var-requires */
const NodemonPlugin = require('nodemon-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  entry: {
    main: './src/index.ts',
    sls: './src/sls-entry.ts',
  },
  target: 'node',
  devtool: isProduction ? 'source-map' : 'eval-source-map',
  mode: isProduction ? 'production' : 'development',
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(html)$/,
        type: 'asset/resource',
      },

      // "Fix" for issues while bundling @nestjs/terminus package.
      // See https://github.com/nestjs/terminus/issues/1423
      {
        test: /@nestjs\/terminus\/dist\/utils\/.*(\.js\.map|\.d\.ts)$/,
        loader: 'null-loader',
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    fallback: {
      crypto: require.resolve('crypto-browserify'),
    },
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, './dist'),
    clean: true,
    libraryTarget: 'commonjs2',
  },
  plugins: [
    new NodemonPlugin({
      script: './dist/main.js',
      watch: path.resolve(__dirname, './dist'),
      ext: 'js,html',
    }),
    new webpack.IgnorePlugin({
      resourceRegExp:
        /(aws-lambda|@mikro-orm\/core|@nestjs\/(microservices|mongoose|sequelize|websockets)|class-(validator|transformer))/,
    }),
    new webpack.ProgressPlugin(),
  ],
  optimization: {
    runtimeChunk: 'single',
  },
  ignoreWarnings: [
    {
      module: /node_modules/,
    },
  ],
};
