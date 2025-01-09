import bunyan from 'bunyan';

import { Logger } from '../../src/logger';

describe('Logger', () => {
  it('will instantiate a Bunyan logger', () => {
    const log = Logger;
    expect(log).toBeInstanceOf(bunyan);
  });
});
