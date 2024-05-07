import { router } from '../../../src/router';

describe('Vue Router', () => {
  it.todo('Need a sustainable way to test that routes match');

  it('will default to a "not found" route', () => {
    expect(router.resolve('/definitely/non/existent/route').name).toBe(
      'not-found',
    );
  });
});
