/* eslint-disable no-console */
import { Config } from './config.mjs';
import { createApp } from './server.mjs';

createApp()
  .then((app) => {
    app.listen(Config.port);
    console.log(`🎉 Server is live and listening on port ${Config.port}... 🎉`);
  })
  .catch((err) => {
    console.error('Error creating app:', err);
    process.exit(1);
  });
