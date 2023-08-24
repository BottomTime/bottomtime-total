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

    await Promise.all([
      Users.insertMany(
        SiteCreatorData.map((creator) => UserSchema.parse(creator)),
      ),
      DiveSites.insertMany(
        DiveSiteData.map((site) => DiveSiteSchema.parse(site)),
      ),
    ]);
  });

  test.afterAll(async ({ app }) => {
    await app.purgeDatabase();
  });

  test('Will display a list of sites on page load', async ({ page }) => {
    await page.goto('/diveSites');
    await expect(page.locator('p#site-count')).toMatchSnapshot();
  });

  test('Will perform a text search', async ({ page }) => {});

  test('Will display a message if no dive sites can be found', async ({
    page,
  }) => {
    await DiveSites.deleteMany({});
    await page.goto('/diveSites');
    await expect(page.locator('article#no-sites-message')).toBeVisible();
    await expect(
      page.locator('article#no-sites-message').innerHTML(),
    ).toMatchSnapshot();
  });
});
