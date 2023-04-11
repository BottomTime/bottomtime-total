import createTests from './users.create';
import retrieveTests from './users.retrieve';
import updateTests from './users.update';
import verifcationTests from './users.verification';

describe('Users Routes', () => {
  describe('Creating Users', createTests);
  describe('Retrieving and Searching Users', retrieveTests);
  describe('Updating Account Properties', updateTests);
  describe('Email Verification and Password Resets', verifcationTests);
});
