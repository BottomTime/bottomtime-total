import { ApiClient, DepthUnit, DiveSiteDTO, WaterType } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { ApiClientKey } from 'src/api-client';
import CreateSiteWizard from 'src/components/diveSites/create-site-wizard.vue';
import OfferedByOperatorList from 'src/components/diveSites/selectSite/offered-by-operator-list.vue';
import RecentSitesList from 'src/components/diveSites/selectSite/recent-sites-list.vue';
import SearchDiveSitesForm from 'src/components/diveSites/selectSite/search-dive-sites-form.vue';
import SelectDiveSiteListItem from 'src/components/diveSites/selectSite/select-dive-site-list-item.vue';
import SelectSite from 'src/components/diveSites/selectSite/select-site.vue';
import { GeolocationKey } from 'src/geolocation';
import { useCurrentUser } from 'src/store';
import { createRouter } from 'tests/fixtures/create-router';
import { PartialOperator } from 'tests/fixtures/operators';
import { BasicUser } from 'tests/fixtures/users';
import { MockGeolocation } from 'tests/mock-geolocation';
import StarRatingStub from 'tests/stubs/star-rating-stub.vue';
import { Router } from 'vue-router';

const TestSite: DiveSiteDTO = {
  createdOn: Date.now(),
  creator: BasicUser.profile,
  id: '48ec1303-6330-484f-8f5b-b56ee427c221',
  location: 'Place Town',
  name: 'A Very Real Site',
  averageDifficulty: 0.9,
  averageRating: 4.2,
  depth: {
    depth: 30,
    unit: DepthUnit.Feet,
  },
  description: 'A very real dive site',
  freeToDive: true,
  shoreAccess: true,
  waterType: WaterType.Fresh,
};

describe('SelectSite component', () => {
  let client: ApiClient;
  let router: Router;
  let geolocation: MockGeolocation;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof SelectSite>;
  let recentSitesSpy: jest.SpyInstance;

  beforeAll(() => {
    client = new ApiClient();
    router = createRouter([
      {
        path: '/test/:username',
        component: { template: '<div></div>' },
      },
    ]);
    geolocation = new MockGeolocation();
  });

  beforeEach(async () => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    currentUser.user = BasicUser;
    opts = {
      global: {
        plugins: [pinia, router],
        provide: {
          [ApiClientKey as symbol]: client,
          [GeolocationKey as symbol]: geolocation,
        },
        stubs: {
          StarRating: StarRatingStub,
        },
      },
    };
    recentSitesSpy = jest
      .spyOn(client.logEntries, 'getMostRecentDiveSites')
      .mockResolvedValue([TestSite]);
    await router.push(`/test/${BasicUser.username}`);
  });

  it('will default to recent sites tab', async () => {
    const wrapper = mount(SelectSite, opts);
    await flushPromises();
    expect(recentSitesSpy).toHaveBeenCalledWith(BasicUser.username);
    expect(wrapper.getComponent(RecentSitesList).isVisible()).toBe(true);

    const item = wrapper.getComponent(SelectDiveSiteListItem);
    expect(item.props('site')).toEqual(TestSite);

    await item
      .get(`[data-testid="select-site-${TestSite.id}"]`)
      .trigger('click');
    expect(wrapper.emitted('site-selected')).toEqual([[TestSite]]);
  });

  it('will default to search tab if recent sites is not enabled', async () => {
    const wrapper = mount(SelectSite, {
      ...opts,
      props: {
        showRecent: false,
      },
    });
    await flushPromises();

    const tabs = wrapper.get('[role="tablist"]');
    expect(tabs.findAll('li')).toHaveLength(2);
    expect(wrapper.getComponent(SearchDiveSitesForm).isVisible()).toBe(true);
  });

  it('will show operators tab if currentOperator is set', async () => {
    const spy = jest
      .spyOn(client.operators, 'listDiveSites')
      .mockResolvedValue({ data: [], totalCount: 0 });
    const wrapper = mount(SelectSite, opts);
    await wrapper.setProps({ currentOperator: PartialOperator });
    await flushPromises();

    await wrapper.get('[data-testid="tab-fromOperator"]').trigger('click');
    await flushPromises();

    expect(wrapper.getComponent(OfferedByOperatorList).isVisible()).toBe(true);
    expect(spy).toHaveBeenCalled();
  });

  it('will allow a user to create a new dive site', async () => {
    const newSite: DiveSiteDTO = {
      createdOn: Date.now(),
      creator: BasicUser.profile,
      id: '3df85f7e-2a83-45a4-8df3-ff7f8b4e2465',
      location: 'Place Town',
      name: 'New Dive Site',
    };
    const createSpy = jest
      .spyOn(client.diveSites, 'createDiveSite')
      .mockResolvedValue(newSite);
    const wrapper = mount(SelectSite, opts);
    await wrapper.get('[data-testid="tab-create"]').trigger('click');

    const createWizard = wrapper.getComponent(CreateSiteWizard);
    expect(createWizard.isVisible()).toBe(true);
    createWizard.vm.$emit('save', newSite);
    await flushPromises();

    expect(wrapper.emitted('site-selected')).toEqual([[newSite]]);
    expect(createSpy).toHaveBeenCalledWith(newSite);
  });

  it('will allow a user to search for a dive site', async () => {
    const wrapper = mount(SelectSite, opts);
    await wrapper.get('[data-testid="tab-search"]').trigger('click');
    await flushPromises();

    const searchForm = wrapper.getComponent(SearchDiveSitesForm);
    expect(searchForm.isVisible()).toBe(true);
    searchForm.vm.$emit('site-selected', TestSite);

    expect(wrapper.emitted('site-selected')).toEqual([[TestSite]]);
  });
});
