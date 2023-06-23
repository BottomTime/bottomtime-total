require('dotenv-defaults/config');
const { defineConfig } = require('@vue/cli-service');

module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,
  devServer: {
    proxy: {
      '/api': {
        target: process.env.BT_SERVICE_URL || 'http://127.0.0.1:4800/',
        pathRewrite: { '^/api': '' },
      },
    },
  },
});
