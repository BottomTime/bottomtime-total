import { ApiClient } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';

import { ApiClientKey } from '../../../../src/api-client';
import { clickOutside } from '../../../../src/click-outside';
import NotificationsBell from '../../../../src/components/core/notifications-bell.vue';

describe('NotificationsBell component', () => {
  let client: ApiClient;

  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof NotificationsBell>;

  beforeAll(() => {
    client = new ApiClient();
  });

  beforeEach(() => {
    pinia = createPinia();
    opts = {
      global: {
        directives: {
          'click-outside': clickOutside,
        },
        plugins: [pinia],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    };
  });

  it('will mount', async () => {
    mount(NotificationsBell, opts);
    await flushPromises();
  });

  it.todo('finish testing this component.');
});
