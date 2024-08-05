/** @type {import('vite').UserConfig} */

/* eslint-disable no-process-env */
import vue from '@vitejs/plugin-vue';

import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // const define = loadDefine(mode);
  return {
    plugins: [
      vue(),
      nodePolyfills({
        include: ['url'],
      }),
    ],
    resolve: {
      preserveSymlinks: true,
    },
    ...(mode === 'production'
      ? {
          ssr: {
            noExternal: true,
          },
        }
      : {}),
  };
});
