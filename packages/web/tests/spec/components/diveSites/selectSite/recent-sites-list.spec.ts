import {
  ApiClient,
  DiveSiteDTO,
  Fetcher,
  SearchDiveSitesResponseSchema,
} from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { Router } from 'vue-router';

import { ApiClientKey } from '../../../../../src/api-client';
import RecentSitesList from '../../../../../src/components/diveSites/selectSite/recent-sites-list.vue';
import SelectDiveSiteListItem from '../../../../../src/components/diveSites/selectSite/select-dive-site-list-item.vue';
import { useCurrentUser } from '../../../../../src/store';
import { createRouter } from '../../../../fixtures/create-router';
import TestDiveSites from '../../../../fixtures/dive-sites-search-results.json';
import { BasicUser } from '../../../../fixtures/users';
import StarRatingStub from '../../../../stubs/star-rating-stub.vue';

describe('RecentSitesList component', () => {
  let fetcher: Fetcher;
  let client: ApiClient;
  let router: Router;
  let recentSites: DiveSiteDTO[];
  let extraSite: DiveSiteDTO;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof RecentSitesList>;

  beforeAll(async () => {
    fetcher = new Fetcher();
    client = new ApiClient({ fetcher });
    router = createRouter([
      {
        path: '/logbook/:username/:entryId',
        component: RecentSitesList,
      },
    ]);
    await router.push(
      `/logbook/${BasicUser.username}/42373d47-1e26-4875-87ed-04f21bec6951`,
    );

    const { data } = SearchDiveSitesResponseSchema.parse(TestDiveSites);
    recentSites = data.slice(0, 10);
    extraSite = data[10];
  });

  beforeEach(() => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    currentUser.user = BasicUser;
    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
        },
        stubs: {
          StarRating: StarRatingStub,
        },
      },
    };
  });

  it('will mount with an empty list of recent sites', async () => {
    const spy = jest
      .spyOn(client.logEntries, 'getMostRecentDiveSites')
      .mockResolvedValue([]);

    const wrapper = mount(RecentSitesList, opts);
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(BasicUser.username);
    expect(wrapper.find('[data-testid="recent-sites-list"]').exists()).toBe(
      false,
    );

    await wrapper.get('[data-testid="switch-to-search"]').trigger('click');
    expect(wrapper.emitted('search')).toHaveLength(1);
  });

  it('will mount with recent sites', async () => {
    const spy = jest
      .spyOn(client.logEntries, 'getMostRecentDiveSites')
      .mockResolvedValue(recentSites);

    const wrapper = mount(RecentSitesList, opts);
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(BasicUser.username);
    const items = wrapper.findAllComponents(SelectDiveSiteListItem);
    expect(items).toHaveLength(recentSites.length);
    items.forEach((item, index) => {
      expect(
        item.get(`[data-testid="site-name-${recentSites[index].id}"]`).text(),
      ).toBe(recentSites[index].name);
    });
  });

  it('will render with current site listed at the top', async () => {
    const spy = jest
      .spyOn(client.logEntries, 'getMostRecentDiveSites')
      .mockResolvedValue(recentSites);

    opts.props = {
      currentSite: extraSite,
    };
    const wrapper = mount(RecentSitesList, opts);
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(BasicUser.username);
    const items = wrapper.findAllComponents(SelectDiveSiteListItem);
    expect(items).toHaveLength(recentSites.length + 1);
    expect(
      items.at(0)?.get(`[data-testid="site-name-${extraSite.id}"]`).text(),
    ).toBe(extraSite.name);
    items.forEach((item, index) => {
      if (index === 0) return;
      expect(
        item
          .get(`[data-testid="site-name-${recentSites[index - 1].id}"]`)
          .text(),
      ).toBe(recentSites[index - 1].name);
    });
  });

  it('will re-emit select event when a site is selected', async () => {
    jest
      .spyOn(client.logEntries, 'getMostRecentDiveSites')
      .mockResolvedValue(recentSites);

    const wrapper = mount(RecentSitesList, opts);
    await flushPromises();

    const item = wrapper.findAllComponents(SelectDiveSiteListItem).at(4)!;
    expect(item).toBeDefined();

    item.vm.$emit('select', recentSites[4]);
    expect(wrapper.emitted('site-selected')).toEqual([[recentSites[4]]]);
  });

  it('will highlight the indicated site when it is clicked', async () => {
    jest
      .spyOn(client.logEntries, 'getMostRecentDiveSites')
      .mockResolvedValue(recentSites);

    const wrapper = mount(RecentSitesList, opts);
    await flushPromises();

    const item = wrapper.findAllComponents(SelectDiveSiteListItem).at(4)!;
    expect(item).toBeDefined();

    item.vm.$emit('highlight', recentSites[4]);
    await flushPromises();

    expect(item.props('selected')).toBe(true);
  });
});
