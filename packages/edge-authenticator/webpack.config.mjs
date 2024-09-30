/* eslint-disable no-process-env */
import CopyPlugin from 'copy-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import NodemonPlugin from 'nodemon-webpack-plugin';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import webpack from 'webpack';

const cwd = dirname(fileURLToPath(import.meta.url));

const isProduction = process.env.NODE_ENV === 'production';

export default {
  entry: {
    index: './src/index.ts',
    'dev-server': './src/dev-server.ts',
  },
  target: 'node',
  devtool: 'source-map',
  mode: isProduction ? 'production' : 'development',
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
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'],
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
    new MiniCssExtractPlugin({
      filename: 'public/[name].css',
    }),
    new NodemonPlugin({
      script: './dist/dev-server.js',
      watch: resolve(cwd, 'dist/'),
      ext: 'js,css',
    }),
    new CopyPlugin({
      patterns: [
        { from: 'src/public/', to: 'public/' },
        { from: 'src/views/', to: 'views/' },
      ],
    }),
    new webpack.IgnorePlugin({
      resourceRegExp:
        /(aws-lambda|class-(transformer|validator)|@nestjs\/(microservices|websockets))/,
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
