import { ApiClient } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../src/api-client';
import EditDiveSite from '../../../src/components/diveSites/edit-dive-site.vue';
import { LocationKey, MockLocation } from '../../../src/location';
import { useCurrentUser } from '../../../src/store';
import NewDiveSiteView from '../../../src/views/new-dive-site-view.vue';
import { createRouter } from '../../fixtures/create-router';
import { DiveSiteWithFullProperties } from '../../fixtures/sites';
import { BasicUser } from '../../fixtures/users';

describe('New Dive Site View', () => {
  let client: ApiClient;
  let router: Router;

  let location: MockLocation;
  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof NewDiveSiteView>;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter();

    jest.useFakeTimers({
      now: new Date('2024-02-29T18:40:25.395Z'),
      doNotFake: ['setImmediate', 'nextTick'],
    });
  });

  beforeEach(() => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    currentUser.user = BasicUser;
    location = new MockLocation();

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

  afterAll(() => {
    jest.useRealTimers();
  });

  it('will render login form if user is not authenticated', () => {
    currentUser.user = null;
    const wrapper = mount(NewDiveSiteView, opts);
    expect(wrapper.find('[data-testid="login-submit"]').isVisible()).toBe(true);
    expect(wrapper.find('[data-testid="name"]').exists()).toBe(false);
  });

  it('will allow an authenticated user to create a new dive site', async () => {
    const wrapper = mount(NewDiveSiteView, opts);
    const edit = wrapper.getComponent(EditDiveSite);

    expect(edit.props('site')).toMatchSnapshot();

    edit.vm.$emit('site-updated', DiveSiteWithFullProperties);
    await flushPromises();
    jest.runAllTimers();
    await flushPromises();

    expect(location.pathname).toBe(
      `/diveSites/${DiveSiteWithFullProperties.id}`,
    );
  });
});
