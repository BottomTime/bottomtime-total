import { ApiClient } from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../src/api-client';
import { LocationKey, MockLocation } from '../../../src/location';
import { useCurrentUser } from '../../../src/store';
import NewLogEntryView from '../../../src/views/new-log-entry-view.vue';
import { createRouter } from '../../fixtures/create-router';

describe('NewLogEntry view', () => {
  let router: Router;
  let client: ApiClient;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let location: MockLocation;
  let opts: ComponentMountingOptions<typeof NewLogEntryView>;

  beforeAll(() => {
    router = createRouter();
    client = new ApiClient();
  });

  beforeEach(() => {
    location = new MockLocation();

    pinia = createPinia();
    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
          [LocationKey as symbol]: location,
        },
      },
    };
  });

  it('will render an empty form', () => {
    const wrapper = mount(NewLogEntryView, opts);
  });

  it('will default the log number to the next available integer', async () => {});
});
