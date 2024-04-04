import { CreateOrUpdateDiveSiteDTO, DepthUnit } from '@bottomtime/api';

import { expect, test } from '../fixtures';

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
    await page.getByTestId('drawer-fullscreen').getByRole('button').click();
    await page.waitForURL(`**/diveSites/${id}`);

    await expect(
      page.locator('p').filter({ hasText: DiveSiteProps.name }),
    ).toBeVisible();
  });
});
