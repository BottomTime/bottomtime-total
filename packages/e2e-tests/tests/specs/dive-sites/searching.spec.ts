import { Collection } from 'mongodb';

import { expect, test } from '../../fixture';
import {
  Collections,
  DiveSiteDocument,
  DiveSiteSchema,
  UserDocument,
  UserSchema,
} from '@/data';

import SiteCreatorData from '@tests/fixtures/dive-site-creators.json';
import DiveSiteData from '@tests/fixtures/dive-sites.json';

test.describe('Searching dive sites', () => {
  let DiveSites: Collection<DiveSiteDocument>;
  let Users: Collection<UserDocument>;

  test.beforeAll(async ({ app }) => {
    const client = await app.mongoClient();
    const db = client.db();

    DiveSites = db.collection(Collections.DiveSites);
    Users = db.collection(Collections.Users);
  });

  test.beforeEach(async () => {
    await Promise.all([
      Users.insertMany(
        SiteCreatorData.map((creator) => UserSchema.parse(creator)),
      ),
      DiveSites.insertMany(
        DiveSiteData.map((site) => DiveSiteSchema.parse(site)),
      ),
    ]);
  });

  test.afterEach(async ({ app }) => {
    await app.purgeDatabase();
  });

  test('Will display a list of sites on page load', async ({ page }) => {
    await page.goto('/diveSites');
    const sites = await page.getByTestId('dive-site-name').allInnerTexts();
    const count = await page.getByTitle('Site count').innerText();
    expect(count).toContain(sites.length.toString());
    expect(sites.join(',')).toMatchSnapshot();
  });

  test('Will perform a text search', async ({ page }) => {
    await page.goto('/diveSites');

    const searchBox = page.getByRole('searchbox');
    await searchBox.type('west');
    await searchBox.press('Enter');
    await page.waitForLoadState('networkidle');

    const sites = await page.getByTestId('dive-site-name').allInnerTexts();
    const count = await page.getByTitle('Site count').innerText();
    expect(count).toContain(sites.length.toString());
    expect(sites.join(',')).toMatchSnapshot();
  });

  test('Will display a message if no dive sites can be found', async ({
    page,
  }) => {
    await DiveSites.deleteMany({});
    await page.goto('/diveSites');

    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible();
    await expect(alert.innerText()).resolves.toMatchSnapshot();
  });
});
