import {
  ApiClient,
  ApiList,
  DiveSiteDTO,
  SearchDiveSitesResponseSchema,
} from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { ApiClientKey } from 'src/api-client';
import DiveSitesListItem from 'src/components/diveSites/dive-sites-list-item.vue';
import OfferedByOperatorList from 'src/components/diveSites/selectSite/offered-by-operator-list.vue';
import SiteData from 'tests/fixtures/dive-sites-search-results.json';
import { PartialOperator } from 'tests/fixtures/operators';
import StarRatingStub from 'tests/star-rating-stub.vue';

describe('OfferedByOperatorList component', () => {
  let client: ApiClient;
  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof OfferedByOperatorList>;
  let testSites: ApiList<DiveSiteDTO>;

  beforeAll(() => {
    client = new ApiClient();
    testSites = SearchDiveSitesResponseSchema.parse({
      data: SiteData.data.slice(0, 10),
      totalCount: SiteData.totalCount,
    });
  });

  beforeEach(() => {
    pinia = createPinia();
    opts = {
      props: {
        operator: PartialOperator,
      },
      global: {
        plugins: [pinia],
        provide: {
          [ApiClientKey as symbol]: client,
        },
        stubs: {
          StarRating: StarRatingStub,
        },
      },
    };
  });

  it('will display the list of sites offered by a dive operator', async () => {
    const spy = jest
      .spyOn(client.operators, 'listDiveSites')
      .mockResolvedValue(testSites);
    const wrapper = mount(OfferedByOperatorList, opts);
    await flushPromises();
    expect(
      wrapper.get('[data-testid="offered-by-operator-list-counts"]').text(),
    ).toMatchSnapshot();

    const sites = wrapper.findAllComponents(DiveSitesListItem);
    expect(sites).toHaveLength(testSites.data.length);
    sites.forEach((site, index) => {
      expect(site.props('site')).toEqual(testSites.data[index]);
    });

    expect(spy).toHaveBeenCalledWith(PartialOperator.slug, { limit: 30 });
  });

  it('will emit event when a site is selected', async () => {
    jest.spyOn(client.operators, 'listDiveSites').mockResolvedValue(testSites);
    const wrapper = mount(OfferedByOperatorList, opts);
    await flushPromises();

    const site = wrapper.findAllComponents(DiveSitesListItem).at(2)!;
    await site.get('h1').trigger('click');

    expect(wrapper.emitted('site-selected')).toEqual([[testSites.data[2]]]);
  });

  it('will allow user to load more sites', async () => {
    const spy = jest
      .spyOn(client.operators, 'listDiveSites')
      .mockResolvedValueOnce({
        data: testSites.data.slice(0, 5),
        totalCount: testSites.totalCount,
      })
      .mockResolvedValueOnce({
        data: testSites.data.slice(5, 10),
        totalCount: testSites.totalCount,
      });
    const wrapper = mount(OfferedByOperatorList, opts);
    await flushPromises();

    await wrapper.get('[data-testid="load-more"]').trigger('click');
    await flushPromises();

    const sites = wrapper.findAllComponents(DiveSitesListItem);
    expect(sites).toHaveLength(10);
    sites.forEach((site, index) => {
      expect(site.props('site')).toEqual(testSites.data[index]);
    });

    expect(spy).toHaveBeenLastCalledWith(PartialOperator.slug, {
      skip: 5,
      limit: 30,
    });
  });
});
