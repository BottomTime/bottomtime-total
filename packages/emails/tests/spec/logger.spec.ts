import Logger from 'bunyan';

import { createLogger } from '../../src/service/logger';

describe('Logger', () => {
  it('will instantiate a new logger', () => {
    const logger = createLogger('debug');
    expect(logger).toBeInstanceOf(Logger);
    expect(logger.level()).toBe(20);
  });

  it('will default to info level if an invalid level is provided', () => {
    const logger = createLogger('invalid');
    expect(logger).toBeInstanceOf(Logger);
    expect(logger.level()).toBe(30);
  });
});
