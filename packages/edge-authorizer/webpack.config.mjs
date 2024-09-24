/* eslint-disable no-process-env */
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import webpack from 'webpack';

const cwd = dirname(fileURLToPath(import.meta.url));

export default {
  entry: {
    index: './src/index.ts',
  },
  target: 'node',
  devtool: 'source-map',
  mode: 'production',
  resolve: {
    extensions: ['.ts', '.js', '.mjs'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  output: {
    filename: '[name].js',
    path: resolve(cwd, './dist'),
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
