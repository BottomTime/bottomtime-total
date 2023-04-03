import nock, { Scope } from 'nock';

let scope: Scope;

beforeEach(() => {
  scope = nock('http:/localhost:80');
});

afterEach(() => {
  nock.cleanAll();
});

export { scope };
