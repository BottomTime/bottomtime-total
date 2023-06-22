import { test, expect } from '../../fixture';

test('Go to Signup Page', async ({ app, page }) => {
  await page.goto('/signup');

  const username = 'Rocky_B';
  const email = 'ricky_b88@gmail.org';
  const password = 'b$bT#Wv$@A`9hKY=';
  const name = 'Ricky Bobby';
  const location = 'Vancouver, BC';

  await page.locator('input#username').type(username);
  await page.locator('input#email').type(email);
  await page.locator('input#password').type(password);
  await page.locator('input#confirmPassword').type(password);
  await page.locator('select#profileVisibility').selectOption('private');
  await page.locator('input#name').type(name);
  await page.locator('input#location').type(location);

  await page.locator('button#btn-signup').click();

  await expect(page).toHaveURL('/');
  await expect(page.locator('a#nav-current-user')).toContainText(name);

  await page.goto('/profile');
  await expect(page.locator('input#name')).toHaveValue(name);
});
