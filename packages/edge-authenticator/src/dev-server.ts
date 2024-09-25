import 'dotenv/config';

import { createApp } from './app';
import { Config } from './config';
import { createLogger } from './logger';

const log = createLogger(Config.logLevel);

createApp(log)
  .then((app) => {
    app.listen(9000);
    log.info('🚀 Authenticator server running at http://localhost:9000');
  })
  .catch((error) => {
    log.fatal(error);
    process.exit(1);
  });
