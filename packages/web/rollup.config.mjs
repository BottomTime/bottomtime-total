/* eslint-disable no-process-env */
import commonJs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

// const isProduction = process.env.NODE_ENV === 'production';
// const outputPlugins = isProduction ? [terser()] : [];

export default {
  input: 'server/sls-entry.mjs',
  output: {
    format: 'es',
    dir: 'dist',
    // plugins: outputPlugins,
    plugins: [terser()],
    sourcemap: true,
  },
  plugins: [
    commonJs(),
    json(),
    nodeResolve({
      preferBuiltins: true,
    }),
  ],
  external: ['vite'],
};
