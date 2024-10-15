import { ApiClient } from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import { IConfigCatClient } from 'configcat-common';
import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../src/api-client';
import { FeaturesServiceKey } from '../../../src/featrues';
import { LocationKey, MockLocation } from '../../../src/location';
import DiveOperatorsView from '../../../src/views/dive-operators-view.vue';
import { ConfigCatClientMock } from '../../config-cat-client-mock';
import { createRouter } from '../../fixtures/create-router';

describe('Dive operators view', () => {
  let client: ApiClient;
  let features: IConfigCatClient;
  let router: Router;

  let pinia: Pinia;
  let location: Location;
  let opts: ComponentMountingOptions<typeof DiveOperatorsView>;

  beforeAll(() => {
    client = new ApiClient();
    features = new ConfigCatClientMock();
    router = createRouter();
  });

  beforeEach(() => {
    pinia = createPinia();
    location = new MockLocation();
    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
          [FeaturesServiceKey as symbol]: features,
          [LocationKey as symbol]: location,
        },
        stubs: {
          teleport: true,
        },
      },
    };
  });

  it('will render', () => {
    mount(DiveOperatorsView, opts);
  });
});
