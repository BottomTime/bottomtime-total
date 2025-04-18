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
  devtool: isProduction ? 'source-map' : 'inline-source-map',
  mode: 'development', // This cannot be set to production. >:( The minification breaks TypeORM.
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, 'src'),
    },
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
  externals: {
    sharp: 'commonjs sharp',
  },
  plugins: [
    new NodemonPlugin({
      script: './dist/main.js',
      watch: path.resolve(__dirname, './dist'),
      ext: 'js,html',
      exec: 'node',
      nodeArgs: ['--inspect=0.0.0.0:9230', '--no-lazy'],
    }),
    new webpack.IgnorePlugin({
      resourceRegExp:
        /(aws-lambda|@mikro-orm\/core|@nestjs\/(microservices|mongoose|sequelize)|class-(validator|transformer))/,
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
