import {
  SearchDiveSitesResponseDTO,
  SearchDiveSitesResponseSchema,
} from '@bottomtime/api';

import { ApiClient, ApiClientKey, DiveSite } from '@/client';
import DiveSitesView from '@/views/dive-sites-view.vue';
import {
  ComponentMountingOptions,
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

  beforeAll(() => {
    searchResults = SearchDiveSitesResponseSchema.parse(SearchResults);
    window.__INITIAL_STATE__ = {
      currentUser: null,
      diveSites: searchResults,
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
    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    };
  });

  it('will prefetch and render dive sites on the server side', async () => {
    const spy = await jest
      .spyOn(client.diveSites, 'searchDiveSites')
      .mockResolvedValue({
        sites: searchResults.sites.map(
          (site) => new DiveSite(client.axios, site),
        ),
        totalCount: searchResults.totalCount,
      });

    const html = await renderToString(DiveSitesView, { global: opts.global });
    expect(spy).toBeCalledWith({});
    // TODO: Mock the API client and simulate a response.
    // Maybe compare the HTML against the rendered component? That would be siiiiiick!

    const wrapper = mount(DiveSitesView, opts);
    expect(wrapper.html()).toBe(html);
  });

  it.todo('will prefetch and render dive sites with a query string');

  it('will mount', () => {
    const wrapper = mount(DiveSitesView, opts);
  });
});
