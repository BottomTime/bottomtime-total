import { ApiClient, FeatureDTO } from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../src/api-client';
import FeaturesListItem from '../../../src/components/admin/features-list-item.vue';
import { useFeatures } from '../../../src/store';
import FeaturesView from '../../../src/views/admin-features-view.vue';
import { createRouter } from '../../fixtures/create-router';

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

describe('Feature Flags view', () => {
  let client: ApiClient;
  let router: Router;
  let features: ReturnType<typeof useFeatures>;

  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof FeaturesView>;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter();
  });

  beforeEach(() => {
    pinia = createPinia();
    features = useFeatures(pinia);
    features.features = TestData();
    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
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

  it.todo('finish');
});
