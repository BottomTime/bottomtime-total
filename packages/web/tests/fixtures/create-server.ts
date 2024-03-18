import nock, { Scope } from 'nock';

export function createServer(): { server: Scope; shutdown: () => void } {
  return {
    server: nock(process.env.BTWEB_API_URL ?? 'http://localhost:4800'),
    shutdown: () => nock.cleanAll(),
  };
}
