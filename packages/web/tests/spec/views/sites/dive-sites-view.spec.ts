import {
  Fetcher,
  SearchDiveSitesResponseDTO,
  SearchDiveSitesResponseSchema,
} from '@bottomtime/api';
import { ApiClient, DiveSite } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../src/api-client';
import DiveSitesListItem from '../../../../src/components/diveSites/dive-sites-list-item.vue';
import { useCurrentUser } from '../../../../src/store';
import DiveSitesView from '../../../../src/views/sites/dive-sites-view.vue';
import { createRouter } from '../../../fixtures/create-router';
import SearchResults from '../../../fixtures/dive-sites-search-results.json';

dayjs.extend(relativeTime);

describe('Dive Sites View', () => {
  let searchResults: SearchDiveSitesResponseDTO;
  let fetcher: Fetcher;
  let client: ApiClient;
  let router: Router;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof DiveSitesView>;
  let searchSpy: jest.SpyInstance;

  beforeAll(() => {
    searchResults = SearchDiveSitesResponseSchema.parse(SearchResults);
    fetcher = new Fetcher();
    client = new ApiClient({ fetcher });
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
    currentUser = useCurrentUser(pinia);

    currentUser.user = null;

    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
        stubs: {
          teleport: true,
        },
      },
    };

    searchSpy = jest
      .spyOn(client.diveSites, 'searchDiveSites')
      .mockResolvedValue({
        sites: searchResults.sites
          .slice(0, 10)
          .map((site) => new DiveSite(fetcher, site)),
        totalCount: searchResults.totalCount,
      });
  });

  it('will fetch the list of dive sites on initial load', async () => {
    const wrapper = mount(DiveSitesView, opts);
    await flushPromises();

    expect(searchSpy).toHaveBeenCalledWith({});

    const listText = wrapper.get('[data-testid="sites-list-content"]').text();
    for (let i = 0; i < 10; i++) {
      expect(listText).toContain(searchResults.sites[i].name);
    }
  });

  it('will fetch the list of dive sites on initial load given a search query string', async () => {
    await router.push(
      '/diveSites?limit=100&query=cove&sortBy=name&sortOrder=asc&freeToDive=true&shoreAccess=false&difficulty=1%2C3&rating=3.5%2C5&location=24.99129899138199%2C-76.36965622408646&radius=200',
    );

    const wrapper = mount(DiveSitesView, opts);
    await flushPromises();

    expect(searchSpy).toHaveBeenCalledWith({
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

    const listText = wrapper.get('[data-testid="sites-list-content"]').text();
    for (let i = 0; i < 10; i++) {
      expect(listText).toContain(searchResults.sites[i].name);
    }
  });

  it('will allow a user to change the sort order', async () => {
    const expected = {
      sites: searchResults.sites
        .sort((a, b) => -a.name.localeCompare(b.name))
        .slice(0, 10)
        .map((site) => new DiveSite(fetcher, site)),
      totalCount: searchResults.totalCount,
    };
    const wrapper = mount(DiveSitesView, opts);
    await flushPromises();

    const refreshSpy = jest
      .spyOn(client.diveSites, 'searchDiveSites')
      .mockResolvedValue(expected);
    await wrapper.get('[data-testid="sort-order"]').setValue('name-desc');
    await flushPromises();

    expect(refreshSpy).toHaveBeenCalledWith({
      sortBy: 'name',
      sortOrder: 'desc',
    });
    const items = wrapper.findAllComponents(DiveSitesListItem);
    expect(items).toHaveLength(expected.sites.length);
    items.forEach((item, i) => {
      expect(item.props('site')).toEqual(expected.sites[i].toJSON());
    });
  });

  it('will allow the user to refine the search results', async () => {
    const wrapper = mount(DiveSitesView, opts);
    await flushPromises();

    const expected = {
      sites: searchResults.sites
        .slice(10, 20)
        .map((site) => new DiveSite(fetcher, site)),
      totalCount: searchResults.totalCount,
    };
    const searchSpy = jest
      .spyOn(client.diveSites, 'searchDiveSites')
      .mockResolvedValue(expected);

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
    await flushPromises();

    expect(searchSpy).toHaveBeenCalledWith({
      difficulty: { max: 3.5, min: 1 },
      freeToDive: true,
      location: { lat: 24.99129899138199, lon: -76.36965622408646 },
      query: 'cove',
      radius: 150,
      rating: { max: 5, min: 3 },
      shoreAccess: false,
    });

    const items = wrapper.findAllComponents(DiveSitesListItem);
    expect(items).toHaveLength(expected.sites.length);
    items.forEach((item, i) => {
      expect(item.props('site')).toEqual(expected.sites[i].toJSON());
    });
  });

  it('will load more results upon request', async () => {
    const wrapper = mount(DiveSitesView, opts);
    await flushPromises();

    const results = {
      sites: searchResults.sites
        .slice(10, 20)
        .map((site) => new DiveSite(fetcher, site)),
      totalCount: searchResults.totalCount,
    };
    const loadMoreSpy = jest
      .spyOn(client.diveSites, 'searchDiveSites')
      .mockResolvedValue(results);

    await wrapper.get('[data-testid="load-more"]').trigger('click');
    await flushPromises();

    const items = wrapper.findAllComponents(DiveSitesListItem);
    expect(items).toHaveLength(20);

    items.forEach((item, index) => {
      const site = searchResults.sites[index];
      expect(item.props('site')).toEqual(site);
    });
    expect(loadMoreSpy).toHaveBeenCalledWith({ skip: 10 });
  });

  it('will load more results building on the previous query', async () => {
    await router.push(
      '/diveSites?query=cove&freeToDive=true&shoreAccess=false&difficulty=1%2C3.5&rating=3%2C5&location=24.99129899138199%2C-76.36965622408646&radius=150&limit=10',
    );
    const wrapper = mount(DiveSitesView, opts);
    await flushPromises();

    const expected = {
      sites: searchResults.sites
        .slice(10, 20)
        .map((site) => new DiveSite(fetcher, site)),
      totalCount: searchResults.totalCount,
    };
    const loadMoreSpy = jest
      .spyOn(client.diveSites, 'searchDiveSites')
      .mockResolvedValue(expected);

    await wrapper.get('[data-testid="load-more"]').trigger('click');
    await flushPromises();

    expect(loadMoreSpy).toHaveBeenCalledWith({
      query: 'cove',
      location: { lat: 24.99129899138199, lon: -76.36965622408646 },
      radius: 150,
      freeToDive: true,
      shoreAccess: false,
      rating: { min: 3, max: 5 },
      difficulty: { min: 1, max: 3.5 },
      limit: 10,
      skip: 10,
    });

    const items = wrapper.findAllComponents(DiveSitesListItem);
    expect(items).toHaveLength(20);
  });
});
