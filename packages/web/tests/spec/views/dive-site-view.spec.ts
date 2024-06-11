import { ApiClient, DiveSite } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  mount,
  renderToString,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../src/api-client';
import { useCurrentUser, useDiveSites } from '../../../src/store';
import DiveSiteView from '../../../src/views/dive-site-view.vue';
import { createAxiosError } from '../../fixtures/create-axios-error';
import { createRouter } from '../../fixtures/create-router';
import { DiveSiteWithFullProperties } from '../../fixtures/sites';

describe('Dive Site View', () => {
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let diveSites: ReturnType<typeof useDiveSites>;
  let opts: ComponentMountingOptions<typeof DiveSiteView>;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter([
      {
        path: '/diveSites/:siteId',
        name: 'DiveSite',
        component: DiveSiteView,
      },
    ]);
  });

  beforeEach(async () => {
    await router.push(`/diveSites/${DiveSiteWithFullProperties.id}`);
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    diveSites = useDiveSites(pinia);

    currentUser.user = null;
    diveSites.currentSite = DiveSiteWithFullProperties;

    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    };
  });

  it('will prefetch the site data on the server side', async () => {
    const spy = jest
      .spyOn(client.diveSites, 'getDiveSite')
      .mockResolvedValue(
        new DiveSite(client.axios, DiveSiteWithFullProperties),
      );
    const html = await renderToString(DiveSiteView, { global: opts.global });
    expect(spy).toHaveBeenCalledWith(DiveSiteWithFullProperties.id);
    expect(html).toMatchSnapshot();
  });

  it('will show not found message if prefetch cannot find the site on the server side', async () => {
    diveSites.currentSite = null;
    const error = createAxiosError({
      status: 404,
      message: 'Not Found',
      method: 'GET',
      path: `/api/diveSites/${DiveSiteWithFullProperties.id}`,
    });
    const spy = jest
      .spyOn(client.diveSites, 'getDiveSite')
      .mockRejectedValue(error);
    const html = await renderToString(DiveSiteView, { global: opts.global });
    expect(spy).toHaveBeenCalledWith(DiveSiteWithFullProperties.id);
    expect(html).toMatchSnapshot();
  });

  it('will show not found message if site cannot be found', () => {
    diveSites.currentSite = null;
    const wrapper = mount(DiveSiteView, opts);
    expect(wrapper.get('[data-testid="not-found-message"]').isVisible()).toBe(
      true,
    );
  });

  it.todo('will render the site info if the site is found');
});
