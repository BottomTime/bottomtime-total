// https://docs.cypress.io/api/table-of-contents

describe('My First Test', () => {
  beforeAll(() => {
    console.log('Got here');
  });
  it('Visits the app root url', () => {
    cy.visit('/');
    cy.contains('h1', 'Welcome to Your Vue.js + TypeScript App');
  });
});
