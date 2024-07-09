/* eslint-disable no-process-env */
import commonJs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

import copy from 'rollup-plugin-copy';

// const isProduction = process.env.NODE_ENV === 'production';
// const outputPlugins = isProduction ? [terser()] : [];

export default {
  input: ['server/index.mjs', 'server/sls-entry.mjs'],
  output: {
    format: 'es',
    dir: 'dist',
    // plugins: outputPlugins,
    plugins: [terser()],
    sourcemap: true,
  },
  plugins: [
    commonJs(),
    copy({
      targets: [{ src: 'package.json', dest: 'dist' }],
    }),
    json(),
    nodeResolve({
      preferBuiltins: true,
    }),
  ],
  external: ['vite', 'dtrace-provider', 'fs', 'mv', 'os', 'source-map-support'],
};
