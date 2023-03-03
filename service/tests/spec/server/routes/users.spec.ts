import createTests from './users.create';
import retrieveTests from './users.retrieve';
import updateTests from './users.update';

describe('Users Routes', () => {
  describe('Creating Users', createTests);
  describe('Retrieving and Searching Users', retrieveTests);
  describe('Updating Account Properties', updateTests);
  it.todo(
    'Write email client so you can test password resets and email verifications',
  );
});
