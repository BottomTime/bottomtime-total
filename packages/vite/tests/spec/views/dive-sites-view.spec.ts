import {
  SearchDiveSitesResponseDTO,
  SearchDiveSitesResponseSchema,
} from '@bottomtime/api';

import { ApiClient, ApiClientKey, DiveSite } from '@/client';
import { LocationKey, MockLocation } from '@/location';
import DiveSitesView from '@/views/dive-sites-view.vue';
import {
  ComponentMountingOptions,
  flushPromises,
  mount,
  renderToString,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { createRouter } from '../../fixtures/create-router';
import SearchResults from '../../fixtures/dive-sites-search-results.json';

describe('Dive Sites View', () => {
  let searchResults: SearchDiveSitesResponseDTO;
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof DiveSitesView>;
  let location: MockLocation;

  beforeAll(() => {
    searchResults = SearchDiveSitesResponseSchema.parse(SearchResults);
    window.__INITIAL_STATE__ = {
      currentUser: null,
      diveSites: {
        sites: searchResults.sites.slice(0, 10),
        totalCount: searchResults.totalCount,
      },
    };
    client = new ApiClient();
    router = createRouter([
      {
        path: '/diveSites',
        name: 'DiveSites',
        component: DiveSitesView,
      },
    ]);
  });

  beforeEach(async () => {
    await router.push('/diveSites');
    pinia = createPinia();
    location = new MockLocation('http://localhost/diveSites');
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

  it('will prefetch and render dive sites on the server side', async () => {
    const spy = await jest
      .spyOn(client.diveSites, 'searchDiveSites')
      .mockResolvedValue({
        sites: searchResults.sites
          .slice(0, 10)
          .map((site) => new DiveSite(client.axios, site)),
        totalCount: searchResults.totalCount,
      });

    const html = await renderToString(DiveSitesView, { global: opts.global });
    expect(spy).toBeCalledWith({});

    const wrapper = mount(
      { template: html },
      {
        global: {
          config: {
            compilerOptions: {
              isCustomElement: () => true,
            },
          },
        },
      },
    );
    const listText = wrapper.get('[data-testid="sites-list-content"]').text();

    for (let i = 0; i < 10; i++) {
      expect(listText).toContain(searchResults.sites[i].name);
    }
  });

  it('will prefetch and render dive sites with a query string', async () => {
    await router.push(
      '/diveSites?limit=100&query=cove&sortBy=name&sortOrder=asc&freeToDive=true&shoreAccess=false&difficulty=1%2C3&rating=3.5%2C5&location=24.99129899138199%2C-76.36965622408646&radius=200',
    );
    const spy = await jest
      .spyOn(client.diveSites, 'searchDiveSites')
      .mockResolvedValue({
        sites: searchResults.sites
          .slice(0, 10)
          .map((site) => new DiveSite(client.axios, site)),
        totalCount: searchResults.totalCount,
      });

    const html = await renderToString(DiveSitesView, { global: opts.global });
    expect(spy).toBeCalledWith({
      query: 'cove',
      location: { lat: 24.99129899138199, lon: -76.36965622408646 },
      radius: 200,
      freeToDive: true,
      shoreAccess: false,
      rating: { min: 3.5, max: 5 },
      difficulty: { min: 1, max: 3 },
      sortBy: 'name',
      sortOrder: 'asc',
      limit: 100,
    });

    const wrapper = mount(
      { template: html },
      {
        global: {
          config: {
            compilerOptions: {
              isCustomElement: () => true,
            },
          },
        },
      },
    );
    const listText = wrapper.get('[data-testid="sites-list-content"]').text();

    for (let i = 0; i < 10; i++) {
      expect(listText).toContain(searchResults.sites[i].name);
    }
  });

  it('will allow a user to change the sort order', async () => {
    const spy = jest.spyOn(location, 'assign').mockReturnValueOnce();
    const wrapper = mount(DiveSitesView, opts);

    await wrapper.get('[data-testid="sort-order"]').setValue('name-desc');
    await flushPromises();

    expect(spy).toBeCalledWith('/diveSites?sortBy=name&sortOrder=desc');
  });

  it('will allow the user to refine the search results', async () => {
    const spy = jest.spyOn(location, 'assign').mockReturnValueOnce();
    const wrapper = mount(DiveSitesView, opts);

    await wrapper.get('[data-testid="search-dive-sites"]').setValue('cove');
    await wrapper.get('[data-testid="select-location"]').trigger('click');
    await wrapper.get('[data-testid="latitude"]').setValue('24.99129899138199');
    await wrapper
      .get('[data-testid="longitude"]')
      .setValue('-76.36965622408646');
    await wrapper.get('[data-testid="confirm-location"]').trigger('click');
    await flushPromises();

    await wrapper.get('[data-testid="search-range"]').setValue('150');
    await wrapper.get('[data-testid="rating"]').setValue('3');
    await wrapper.get('[data-testid="difficulty"]').setValue('3.5');
    await wrapper.get('[data-testid="shore-access-false"]').setValue(true);
    await wrapper.get('[data-testid="free-to-dive-true"]').setValue(true);
    await wrapper.get('[data-testid="refresh-dive-sites"]').trigger('click');

    expect(spy).toHaveBeenCalledWith(
      '/diveSites?query=cove&freeToDive=true&shoreAccess=false&difficulty=1%2C3.5&rating=3%2C5&location=24.99129899138199%2C-76.36965622408646&radius=150',
    );
  });
});
