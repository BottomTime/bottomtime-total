/* eslint-disable no-process-env, @typescript-eslint/no-var-requires */
const nodeExternals = require('webpack-node-externals');
const NodemonPlugin = require('nodemon-webpack-plugin');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  entry: {
    main: './src/index.ts',
    sls: './src/sls-entry.ts',
  },
  stats: {
    warningsFilter: [/node_modules/],
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
    publicPath: '',
  },
  plugins: [
    new NodemonPlugin({
      script: './dist/main.js',
      watch: path.resolve(__dirname, './dist'),
    }),
  ],
  externals: [
    nodeExternals({
      modulesDir: path.resolve(__dirname, '../../node_modules'),
    }),
    nodeExternals({
      modulesDir: path.resolve(__dirname, './node_modules'),
    }),
  ],
  optimization: {
    runtimeChunk: 'single',
  },
};
