import { ApiClient } from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import { ApiClientKey } from '../../../src/api-client';
import FriendsView from '../../../src/views/friends-view.vue';

describe('Friends view', () => {
  let client: ApiClient;
  let opts: ComponentMountingOptions<typeof FriendsView>;

  beforeAll(() => {
    client = new ApiClient();
    opts = {
      global: {
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    };
  });

  it('will render', () => {
    mount(FriendsView, opts);
  });
});
