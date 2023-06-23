import config from './config';
import { createLogger } from './logger';
import { createServer } from './server/create-server';
import { createDependencies } from './server/dependencies';

const log = createLogger(config.logLevel);

createServer(() => createDependencies(log))
  .then((app) => {
    app.listen(config.port);
    log.info(
      `[SERVICE] Service has started and is listening on port ${config.port}.`,
    );
  })
  .catch((error) => {
    log.fatal('[SERVICE] Failed to start service... Shutting down...', error);
    process.exit(1);
  });
