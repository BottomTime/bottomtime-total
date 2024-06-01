import {
  ApiClient,
  CreateOrUpdateDiveSiteDTO,
  DepthUnit,
  DiveSite,
} from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../src/api-client';
import CreateSiteWizard from '../../../src/components/diveSites/create-site-wizard.vue';
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
    const siteId = 'f9b5ae71-7751-4f7d-8502-a3a56bb04aea';
    const options: CreateOrUpdateDiveSiteDTO = {
      location: 'Egypt',
      name: 'Dahab Blue Hole',
      depth: { depth: 0, unit: DepthUnit.Meters },
      description: "Perfectly safe... as long as you don't do anything stupid.",
      freeToDive: true,
      shoreAccess: true,
      gps: { lat: 28.5717821, lon: 34.5600764 },
    };

    const spy = jest
      .spyOn(client.diveSites, 'createDiveSite')
      .mockResolvedValue(
        new DiveSite(client.axios, {
          ...options,
          id: siteId,
          createdOn: new Date('2024-05-27T19:34:55.786Z'),
          creator: { ...BasicUser.profile },
        }),
      );

    const wrapper = mount(NewDiveSiteView, opts);
    const wizard = wrapper.getComponent(CreateSiteWizard);

    wizard.vm.$emit('save', options);
    await flushPromises();

    expect(location.pathname).toBe(`/diveSites/${siteId}`);
    expect(spy).toHaveBeenCalledWith(options);
  });
});
