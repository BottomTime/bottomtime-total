import nock, { Scope } from 'nock';

export function createScope(): Scope {
  return nock('http://localhost:80/');
}
