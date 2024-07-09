/* eslint-disable no-process-env, @typescript-eslint/no-var-requires */
const path = require('path');
const webpack = require('webpack');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  entry: {
    sls: './src/service/sls.ts',
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
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, './dist/service'),
    clean: true,
    libraryTarget: 'commonjs2',
  },
  plugins: [
    new webpack.IgnorePlugin({
      resourceRegExp: /aws-lambda/,
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
