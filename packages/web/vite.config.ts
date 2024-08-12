/** @type {import('vite').UserConfig} */

/* eslint-disable no-process-env */
import vue from '@vitejs/plugin-vue';

import { defineConfig, loadEnv } from 'vite';
import viteCompression from 'vite-plugin-compression';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

const envPrefix = 'BTWEB_VITE_';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), envPrefix);
  const define = Object.entries(env).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      acc[`process.env.${key}`] = JSON.stringify(value);
      return acc;
    },
    {
      'process.env.MODE': JSON.stringify(process.env.NODE_ENV),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    },
  );

  return {
    define,
    envPrefix,
    mode: process.env.NODE_ENV || 'development',
    plugins: [
      vue(),
      nodePolyfills({
        include: ['url'],
      }),
      viteCompression(),
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
