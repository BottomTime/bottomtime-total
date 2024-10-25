import { ApiClient } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../src/api-client';
import MembershipConfirmationView from '../../../src/views/membership-confirmation-view.vue';
import { createRouter } from '../../fixtures/create-router';

const ClientSecret = '';

describe('Membership Confirmation View', () => {
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof MembershipConfirmationView>;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter();
  });

  beforeEach(() => {
    pinia = createPinia();
    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    };
  });

  it('will mount', async () => {
    mount(MembershipConfirmationView, opts);
    await flushPromises();
  });
});
