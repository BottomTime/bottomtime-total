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

let DiveSites: Collection<DiveSiteDocument>;
let Users: Collection<UserDocument>;

test.describe('Dive sites:', () => {
  test.beforeAll(async ({ app }) => {
    const client = await app.mongoClient();
    const db = client.db();

    DiveSites = db.collection(Collections.DiveSites);
    Users = db.collection(Collections.Users);
  });

  test.beforeAll(async () => {
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

  test('As a user, I can navigate to the dive sites page and see a list of sites', async ({
    page,
  }) => {
    const expected = [
      'Ignorant Coyote',
      'Ethical Savings',
      'Extra-Small Wallaby',
      'Gullible Oven',
      'Foolish Familiarity',
      'Inexperienced Scimitar',
      'Flashy Desk',
      'Sore Advocacy',
      'Gloomy Cation',
      'Each Breath',
      'Illustrious Recording',
      'Steep Hood',
      'Shy Gaiters',
      'Kooky Jam',
      'Average Lesbian',
      'Kindhearted Thought',
      'Unwieldy Optimal',
      'Competent Wildebeest',
      'Crazy Sense',
      'Wrathful Container',
      'Quick-Witted Epithelium',
      'Tempting Hate',
      'Kindly Leprosy',
      'Accomplished Icecream',
      'Frivolous Grandchild',
      'Infinite Subgroup',
      'Biodegradable Chassis',
      'Indelible Noise',
      'Illustrious Anguish',
      'Motionless Stamina',
      'Qualified Beyond',
      'Disloyal Apology',
      'Celebrated Paint',
      'Bad Proof',
      'Jaunty Assignment',
      'Piercing Sepal',
      'Double Cop-Out',
      'Slimy Cyst',
      'Stale Meal',
      'Acclaimed Windage',
      'Unique Stamp',
      'Careful Down',
      'Wary Sweat',
      'Similar Precision',
      'Sympathetic Holder',
      'Moist Soda',
      'Academic Sanction',
      'Inconsequential Volume',
      'Drafty Firewall',
      'Quizzical Cloth',
    ];

    await page.goto('/diveSites');
    const sites = await page.getByTestId('dive-site-name').allInnerTexts();
    const count = await page.getByTitle('Site count').innerText();
    expect(count).toContain(sites.length.toString());
    expect(sites).toEqual(expected);
  });

  test('As a user, I can perform a text search', async ({ page }) => {
    const expected = [
      'Biodegradable Chassis',
      'Unwieldy Optimal',
      'Hidden Metallurgist',
    ];
    await page.goto('/diveSites');

    const searchBox = page.getByRole('searchbox');
    await searchBox.type('west');
    await searchBox.press('Enter');
    await page.waitForLoadState('networkidle');

    const sites = await page.getByTestId('dive-site-name').allInnerTexts();
    const count = await page.getByTitle('Site count').innerText();
    expect(count).toContain(sites.length.toString());
    expect(sites).toEqual(expected);
  });

  test('As a user, I will be informed if my search yields no results', async ({
    page,
  }) => {
    await page.goto('/diveSites');

    const searchBox = page.getByRole('searchbox');
    await searchBox.type('definitelynotgoingtofindthissearchterm');
    await searchBox.press('Enter');
    await page.waitForLoadState('networkidle');

    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible();
    await expect(alert.innerText()).resolves.toEqual(
      'No dive sites were found matching your search parameters.',
    );
  });
});
