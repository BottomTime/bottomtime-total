import { CreateOrUpdateDiveSiteDTO, DepthUnit } from '@bottomtime/api';

import { expect, test } from '../fixtures';

const Username = 'diver_dan';
const Password = 'Dan_Dives23';
const DiveSiteProps: CreateOrUpdateDiveSiteDTO = {
  name: 'Magical, Awesome Dive Site',
  directions: 'Go left, then right, then under.',
  description: 'This is a test dive site. I hope to search for and edit it.',
  freeToDive: true,
  gps: {
    lat: 37.7749,
    lon: -122.4194,
  },
  location: 'San Francisco, CA',
  shoreAccess: false,
  depth: {
    depth: 42,
    unit: DepthUnit.Feet,
  },
};

test.describe('Dive Sites', () => {
  test('will allow a user to search for and navigate to an existing dive site', async ({
    api,
    diveSites,
    page,
  }) => {
    const { id } = await api.diveSites.createDiveSite(DiveSiteProps);

    await diveSites.gotoDiveSites();
    await diveSites.searchForDiveSite({
      query: 'Magical',
      freeToDive: true,
      shoreAccess: false,

      // Why is this not working?
      // location: { lat: -37.7749, lon: -122.4194 },
      // radius: 500,
    });

    await page.waitForURL(
      '**/diveSites?query=Magical&freeToDive=true&shoreAccess=false',
    );

    await page.getByTestId(`select-site-${id}`).click();
    await page.getByTestId('drawer-fullscreen').click();
    await page.waitForURL(`**/diveSites/${id}`);

    await expect(
      page.locator('p').filter({ hasText: DiveSiteProps.name }),
    ).toBeVisible();
  });

  test('will allow users to create and edit a dive site', async ({
    api,
    auth,
    diveSites,
    page,
  }) => {
    await auth.createUserAndLogin(Username, Password);
    await diveSites.gotoNewDiveSite();

    const name = 'Dahab Blue Hole';
    const description = "Perfectly safe if you don't do anything dumb";
    const depth = 22.1;
    const depthUnit = DepthUnit.Meters;
    const location = 'Blue Hole of Dahab';
    const directions =
      'Take a flight to Egypt, then probably some buses, then go diving.';
    const gps = {
      lat: 28.5717821,
      lon: 34.5600764,
    };

    await page.getByTestId('location').fill(location);
    await page.getByTestId('gps-lat').fill(gps.lat.toString());
    await page.getByTestId('gps-lon').fill(gps.lon.toString());
    await page.getByTestId('directions').fill(directions);
    await page.getByTestId('name').fill(name);
    await page.getByTestId('depth-bottomless').click();
    await page.getByTestId('description').fill(description);
    await page.getByTestId('free-to-dive-true').click();
    await page.getByTestId('shore-access-true').click();
    await page.getByTestId('save-site').scrollIntoViewIfNeeded();
    // await page.getByTestId('save-site').click({ delay: 100 });
    await page.getByTestId('save-site').dblclick();

    await page.waitForURL(/\/diveSites\/(?!new)/);

    const siteId = page.url().split('/').pop()!;
    const site = await api.diveSites.getDiveSite(siteId);

    expect(site.name).toBe(name);
    expect(site.description).toBe(description);
    expect(site.depth?.depth).toBe(0);
    expect(site.depth?.unit).toBe(depthUnit);
    expect(site.freeToDive).toBe(true);
    expect(site.shoreAccess).toBe(true);
    expect(site.location).toBe(location);
    expect(site.gps?.lat).toBe(gps.lat);
    expect(site.gps?.lon).toBe(gps.lon);
    expect(site.directions).toBe(directions);

    await page.getByTestId('name').fill(name);
    await page.getByTestId('description').fill(description);
    await page.getByTestId('depth-bottomless').click();
    await page.getByTestId('depth').fill(depth.toString());
    await page.getByText('Payment required').click();
    await page.getByText('Accessible from shore').click();
    await page.getByTestId('location').fill(location);
    await page.getByTestId('gps-lat').fill(gps.lat.toString());
    await page.getByTestId('gps-lon').fill(gps.lon.toString());
    await page.getByTestId('directions').fill(directions);
    await page.getByTestId('save-site').click();

    await expect(page.getByTestId('toast-site-updated')).toBeVisible();
  });
});
