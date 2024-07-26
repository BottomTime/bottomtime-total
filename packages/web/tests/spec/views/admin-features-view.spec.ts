import {
  ApiClient,
  Feature,
  FeatureDTO,
  FeatureSchema,
  Fetcher,
} from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../src/api-client';
import FeaturesListItem from '../../../src/components/admin/features-list-item.vue';
import FeaturesList from '../../../src/components/admin/features-list.vue';
import { LocationKey, MockLocation } from '../../../src/location';
import { useCurrentUser, useFeatures } from '../../../src/store';
import FeaturesView from '../../../src/views/admin-features-view.vue';
import { createRouter } from '../../fixtures/create-router';
import { AdminUser, BasicUser } from '../../fixtures/users';

const TestData = (): FeatureDTO[] => [
  {
    createdAt: new Date('2021-01-01T00:00:00.000Z'),
    updatedAt: new Date('2021-01-01T00:00:00.000Z'),
    key: 'awesome_feature',
    name: 'Latest Awesome Thing',
    description: 'This is a test feature',
    enabled: true,
  },
  {
    createdAt: new Date('2021-01-01T00:00:00.000Z'),
    updatedAt: new Date('2021-01-01T00:00:00.000Z'),
    key: 'secret_feature',
    name: 'Top Secret Feature',
    description: 'Shhh! No one is supposed to know about this',
    enabled: false,
  },
  {
    createdAt: new Date('2021-01-01T00:00:00.000Z'),
    updatedAt: new Date('2021-01-01T00:00:00.000Z'),
    key: 'old_feature',
    name: 'Old and Busted',
    description: 'This is a test feature',
    enabled: false,
  },
];
const Epoch = new Date(0);
const BlankFeature: FeatureDTO = {
  createdAt: Epoch,
  updatedAt: Epoch,
  enabled: false,
  key: '',
  name: '',
  description: '',
};

const CreateButton = '#create-feature';
const KeyInput = '#key';
const NameInput = '#name';
const DescriptionInput = '#description';
const EnabledInput = '#enabled';
const SaveButton = '#save-feature';

describe('Feature Flags view', () => {
  let fetcher: Fetcher;
  let client: ApiClient;
  let router: Router;
  let features: ReturnType<typeof useFeatures>;
  let currentUser: ReturnType<typeof useCurrentUser>;

  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof FeaturesView>;

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new ApiClient({ fetcher });
    router = createRouter();
  });

  beforeEach(() => {
    pinia = createPinia();
    features = useFeatures(pinia);
    features.features = TestData();
    currentUser = useCurrentUser(pinia);
    currentUser.user = AdminUser;
    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
          [LocationKey as symbol]: new MockLocation(),
        },
      },
    };
  });

  it('will render a list of featue flags', () => {
    const wrapper = mount(FeaturesView, opts);
    const items = wrapper.findAllComponents(FeaturesListItem);
    expect(items).toHaveLength(3);
    items.forEach((item, index) => {
      expect(item.text()).toContain(TestData()[index].name);
    });
  });

  it('will allow an admin to create a new feature flag', async () => {
    const expected: FeatureDTO = {
      ...BlankFeature,
      key: 'new_feature',
      name: 'New Feature',
      description: 'This is a new feature',
      enabled: true,
    };
    const saveSpy = jest
      .spyOn(client.features, 'createFeature')
      .mockResolvedValue(new Feature(fetcher, expected));
    const wrapper = mount(FeaturesView, opts);
    await wrapper.get(CreateButton).trigger('click');
    await wrapper.get(KeyInput).setValue(expected.key);
    await wrapper.get(NameInput).setValue(expected.name);
    await wrapper.get(DescriptionInput).setValue(expected.description);
    await wrapper.get(EnabledInput).setValue(expected.enabled);
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="drawer-panel"]').exists()).toBe(false);
    expect(saveSpy).toHaveBeenCalledWith(expected.key, {
      name: expected.name,
      description: expected.description,
      enabled: expected.enabled,
    });

    const newItem = wrapper.getComponent(FeaturesListItem);
    expect(newItem.text()).toContain(expected.name);
    expect(features.features[0]).toEqual(expected);
  });

  it('will allow an admin to edit an existing feature flag', async () => {
    const wrapper = mount(FeaturesView, opts);
    const selectedDTO = features.features[1];
    let feature: Feature;
    let saveSpy: jest.SpyInstance = jest.fn();
    jest.spyOn(client.features, 'wrapDTO').mockImplementation((dto) => {
      feature = new Feature(fetcher, FeatureSchema.parse(dto));
      saveSpy = jest.spyOn(feature, 'save').mockResolvedValue();
      return feature;
    });

    const newName = 'Brand New Name';
    const newDescription = 'This is a brand new feature';
    const newEnabled = !selectedDTO.enabled;

    await wrapper
      .get(`[data-testid="select-${selectedDTO.key}"]`)
      .trigger('click');
    await wrapper.get(NameInput).setValue(newName);
    await wrapper.get(DescriptionInput).setValue(newDescription);
    await wrapper.get(EnabledInput).setValue(newEnabled);
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="drawer-panel"]').exists()).toBe(false);
    expect(saveSpy).toHaveBeenCalled();
    expect(features.features[1].name).toEqual(newName);
    expect(features.features[1].description).toEqual(newDescription);
    expect(features.features[1].enabled).toEqual(newEnabled);

    const updatedItem = wrapper.get(
      `[data-testid="feature-flag-${selectedDTO.key}"]`,
    );
    expect(updatedItem.text()).toContain(newName);
    expect(updatedItem.text()).toContain(newDescription);
  });

  it('will allow an admin to delete an existing feature flag', async () => {
    const selectedDTO = features.features[2];
    const wrapper = mount(FeaturesView, opts);
    let deleteSpy: jest.SpyInstance = jest.fn();
    let feature: Feature;
    jest.spyOn(client.features, 'wrapDTO').mockImplementation((dto) => {
      feature = new Feature(fetcher, FeatureSchema.parse(dto));
      expect(feature.key).toBe(selectedDTO.key);
      deleteSpy = jest.spyOn(feature, 'delete').mockResolvedValue();
      return feature;
    });

    await wrapper
      .get(`[data-testid="delete-${selectedDTO.key}"]`)
      .trigger('click');
    await wrapper.get('[data-testid="dialog-confirm-button"]').trigger('click');
    await flushPromises();

    expect(deleteSpy).toHaveBeenCalled();
    const items = wrapper.findAllComponents(FeaturesListItem);
    expect(items).toHaveLength(2);
    expect(features.features).toHaveLength(2);
    expect(features.features.findIndex((f) => f.key === selectedDTO.key)).toBe(
      -1,
    );
    items.forEach((item) => {
      expect(item.text()).not.toContain(selectedDTO.name);
    });
  });

  it('will allow an admin to change their mind about deleting a feature flag', async () => {
    const selectedDTO = features.features[2];
    const wrapper = mount(FeaturesView, opts);
    let deleteSpy: jest.SpyInstance = jest.fn();
    let feature: Feature;
    jest.spyOn(client.features, 'wrapDTO').mockImplementation((dto) => {
      feature = new Feature(fetcher, FeatureSchema.parse(dto));
      expect(feature.key).toBe(selectedDTO.key);
      deleteSpy = jest.spyOn(feature, 'delete').mockResolvedValue();
      return feature;
    });

    await wrapper
      .get(`[data-testid="delete-${selectedDTO.key}"]`)
      .trigger('click');
    await wrapper.get('[data-testid="dialog-cancel-button"]').trigger('click');
    await flushPromises();

    expect(deleteSpy).not.toHaveBeenCalled();
    const items = wrapper.findAllComponents(FeaturesListItem);
    expect(items).toHaveLength(3);
    expect(features.features).toHaveLength(3);
    items.forEach((item, index) => {
      expect(item.text()).toContain(TestData()[index].name);
    });
  });

  it('will show login form if user is not authenticated', () => {
    currentUser.user = null;
    const wrapper = mount(FeaturesView, opts);
    expect(wrapper.find('[data-testid="login-form"]').isVisible()).toBe(true);
    expect(wrapper.findComponent(FeaturesList).exists()).toBe(false);
  });

  it('will show forbidden message if user is not an admin', () => {
    currentUser.user = BasicUser;
    const wrapper = mount(FeaturesView, opts);
    expect(wrapper.find('[data-testid="forbidden-message"]').isVisible()).toBe(
      true,
    );
    expect(wrapper.findComponent(FeaturesList).exists()).toBe(false);
  });
});
