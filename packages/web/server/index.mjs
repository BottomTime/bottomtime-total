import { Config } from './config.mjs';
import { getLogger } from './logger.mjs';
import { createApp } from './server.mjs';

const log = getLogger();

createApp()
  .then((app) => {
    app.listen(Config.port);
    log.info(`🎉 Server is live and listening on port ${Config.port}... 🎉`);
  })
  .catch((err) => {
    log.error('Error creating app:', err);
    process.exit(1);
  });
