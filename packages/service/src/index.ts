import { Config } from './config';
import { createApp } from './create-app';
import { createLogger } from './logger';

const log = createLogger(Config.logLevel);

createApp(log)
  .then(async (app) => {
    await app.listen(Config.port);

    log.info(
      `🎉 Service has successfully started and is listening on port ${Config.port}. 🎉`,
    );
  })
  .catch((error) => {
    log.fatal('[SERVICE] Failed to start service... Shutting down...', error);
    process.exit(1);
  });
