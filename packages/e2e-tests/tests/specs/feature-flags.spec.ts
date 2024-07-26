import { expect, test } from '../fixtures';

test.describe('Feature Flags', () => {
  const key = 'best_feature_flag';

  test.beforeEach(async ({ auth }) => {
    await auth.createAdminAndLogin();
  });

  test('will allow an admin to create a feature flag', async ({
    api,
    featureFlags,
    page,
  }) => {
    const name = 'New Feature Flag';
    const description = 'Initial description goes here.';

    await featureFlags.gotoFeatureFlags();
    await page.getByTestId('create-feature').click();
    await page.getByTestId('key').fill(key);
    await page.getByTestId('name').fill(name);
    await page.getByTestId('description').fill(description);
    await page.getByTestId('save-feature').click();

    await expect(page.getByTestId('drawer-panel')).toBeHidden();
    await expect(page.getByTestId('select-best_feature_flag')).toHaveText(
      'New Feature Flag',
    );

    const feature = await api.features.getFeature(key);
    expect(feature.key).toBe(key);
    expect(feature.name).toBe(name);
    expect(feature.description).toBe(description);
    expect(feature.enabled).toBe(false);
  });

  test('will allow an admin to edit a feature flag', async ({
    api,
    featureFlags,
    page,
  }) => {
    const newName = 'Updated Feature Flag';
    const newDescription = 'Updated description goes here.';
    await api.features.createFeature(key, {
      name: 'Old Feature Name',
      description: 'Old feature description.',
      enabled: false,
    });

    await featureFlags.gotoFeatureFlags();
    await page.getByTestId('edit-best_feature_flag').click();
    await page.getByTestId('name').fill(newName);
    await page.getByTestId('description').fill(newDescription);
    await page
      .getByTestId('drawer-content')
      .locator('label')
      .filter({ hasText: 'Off' })
      .click();
    await page.getByTestId('save-feature').click();

    await expect(page.getByTestId('drawer-panel')).toBeHidden();
    await expect(page.getByTestId('select-best_feature_flag')).toHaveText(
      newName,
    );

    const feature = await api.features.getFeature(key);
    expect(feature.key).toBe(key);
    expect(feature.name).toBe(newName);
    expect(feature.description).toBe(newDescription);
    expect(feature.enabled).toBe(true);
  });

  test('will allow an admin to delete a feature flag', async ({
    api,
    featureFlags,
    page,
  }) => {
    await api.features.createFeature(key, {
      name: 'Old Feature Name',
      description: 'Old feature description.',
      enabled: false,
    });

    await featureFlags.gotoFeatureFlags();
    await page.getByTestId('delete-best_feature_flag').click();
    await page.getByTestId('dialog-confirm-button').click();

    await expect(page.getByText('No feature flags found.')).toBeVisible();
    await expect(api.features.featureExists(key)).resolves.toBe(false);
  });

  test('will allow an admin to quickly toggle a feature flag', async ({
    api,
    featureFlags,
  }) => {
    await api.features.createFeature(key, {
      name: 'Old Feature Name',
      description: 'Old feature description.',
      enabled: false,
    });

    await featureFlags.gotoFeatureFlags();
    await featureFlags.toggleFeatureFlag(key);

    const feature = await api.features.getFeature(key);
    expect(feature.enabled).toBe(true);
  });
});
