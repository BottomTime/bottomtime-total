import { createLogger } from '../../src/logger';

describe('Create Logger', () => {
  it('Will create a new logger that will write to stdout', () => {
    const logger = createLogger('trace');
    expect(logger.level()).toBe(10);
  });

  it('Will use "info" as the default log level', () => {
    const logger = createLogger('not valid');
    expect(logger.level()).toBe(30);
  });
});
