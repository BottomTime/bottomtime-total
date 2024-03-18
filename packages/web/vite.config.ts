import vue from '@vitejs/plugin-vue';

import { defineConfig, loadEnv } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// Use process.env instead of import.meta.env
function loadDefine(mode: string): Record<string, string> {
  const env = loadEnv(mode, __dirname, 'BTWEB_VITE_');
  const define: Record<string, string> = {};

  for (const [key, value] of Object.entries(env)) {
    define[`process.env.${key}`] = JSON.stringify(value);
  }
  define['process.env.MODE'] = JSON.stringify(mode);
  define['process.env.NODE_ENV'] = JSON.stringify(
    process.env.NODE_ENV || 'development',
  );

  return define;
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const define = loadDefine(mode);
  return {
    plugins: [
      vue(),
      nodePolyfills({
        include: ['url'],
      }),
    ],
    define,
  };
});
