import { Feature } from '@bottomtime/common';

import { IConfigCatClient } from 'configcat-node';

import { FeaturesService } from '../../../src/features';
import { ConfigCatClientMock } from '../../utils/config-cat-client-mock';

const TestFeatureEnabled: Feature<boolean> = {
  key: 'enabled',
  defaultValue: false,
} as const;
const TestFeatureDisabled: Feature<boolean> = {
  key: 'disabled',
  defaultValue: false,
} as const;
const TestDisabledButDefaultEnabledFeature: Feature<boolean> = {
  key: 'disabled_but_default_enabled',
  defaultValue: true,
} as const;
const MissingFeature: Feature<number> = {
  key: 'no_such_feature',
  defaultValue: 42,
} as const;
const TestStringFeature: Feature<string> = {
  key: 'a_string',
  defaultValue: 'ooooooooooo weeeeeeeee',
} as const;
const TestNumericFeature: Feature<number> = {
  key: 'a_number',
  defaultValue: 7,
} as const;

describe('Features service', () => {
  let client: IConfigCatClient;
  let service: FeaturesService;

  beforeAll(() => {
    client = new ConfigCatClientMock({
      [TestFeatureEnabled.key]: true,
      [TestFeatureDisabled.key]: false,
      [TestDisabledButDefaultEnabledFeature.key]: false,
      [TestStringFeature.key]: 'yup',
      [TestNumericFeature.key]: 999,
    });
    service = new FeaturesService(client);
  });

  it('will get the values of feature flags from the underlying client', async () => {
    await expect(service.getFeature(TestFeatureEnabled)).resolves.toBe(true);
    await expect(service.getFeature(TestFeatureDisabled)).resolves.toBe(false);
    await expect(
      service.getFeature(TestDisabledButDefaultEnabledFeature),
    ).resolves.toBe(false);
    await expect(service.getFeature(TestStringFeature)).resolves.toBe('yup');
    await expect(service.getFeature(TestNumericFeature)).resolves.toBe(999);
  });

  it('will return a default value for a flag if the flag is not defined', async () => {
    await expect(service.getFeature(MissingFeature)).resolves.toBe(42);
  });
});
