/* eslint-disable no-process-env */
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import webpack from 'webpack';

const cwd = dirname(fileURLToPath(import.meta.url));

export default {
  entry: {
    index: './index.mjs',
  },
  target: 'node',
  devtool: 'source-map',
  mode: 'production',
  resolve: {
    extensions: ['.js', '.mjs'],
  },
  output: {
    filename: '[name].js',
    path: resolve(cwd, './dist'),
    clean: true,
    libraryTarget: 'commonjs2',
  },
  plugins: [new webpack.ProgressPlugin()],
  optimization: {
    runtimeChunk: 'single',
  },
  ignoreWarnings: [
    {
      module: /node_modules/,
    },
  ],
};
