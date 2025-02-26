import {
  ApiClient,
  ApiList,
  DiveSiteDTO,
  DiveSiteSchema,
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
import SelectSite from 'src/components/diveSites/selectSite/select-site.vue';
import EditOperatorSites from 'src/components/operators/editor/edit-operator-sites.vue';
import { GeolocationKey } from 'src/geolocation';
import { ConfirmDialog, DrawerPanel } from 'tests/constants';
import 'tests/dayjs';
import SiteData from 'tests/fixtures/dive-sites-search-results.json';
import { PartialOperator } from 'tests/fixtures/operators';
import { MockGeolocation } from 'tests/mock-geolocation';
import StarRatingStub from 'tests/stubs/star-rating-stub.vue';

const CountsText = '[data-testid="operator-site-counts"]';
const AddSitesButton = '#btn-add-sites';
const RemoveSitesButton = '#btn-remove-sites';

describe('EditOperatorSites component', () => {
  let client: ApiClient;
  let geolocation: MockGeolocation;

  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof EditOperatorSites>;
  let testSites: ApiList<DiveSiteDTO>;

  beforeAll(() => {
    client = new ApiClient();
    geolocation = new MockGeolocation();
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
          [GeolocationKey as symbol]: geolocation,
        },
        stubs: {
          teleport: true,
          StarRating: StarRatingStub,
        },
      },
    };

    testSites = SearchDiveSitesResponseSchema.parse({
      data: SiteData.data.slice(0, 10),
      totalCount: 110,
    });
    jest.spyOn(client.operators, 'listDiveSites').mockResolvedValue(testSites);
  });

  it('will render a list of sites', async () => {
    const wrapper = mount(EditOperatorSites, opts);
    await flushPromises();

    expect(wrapper.get(CountsText).text()).toBe(
      'Showing 10 of 110 dive sites.',
    );
    const items = wrapper.findAllComponents(DiveSitesListItem);
    expect(items).toHaveLength(10);
    items.forEach((item, index) => {
      expect(item.props('site')).toEqual(testSites.data[index]);
    });
  });

  it('will load more sites when the load more button is clicked', async () => {
    jest.restoreAllMocks();
    const loadSpy = jest
      .spyOn(client.operators, 'listDiveSites')
      .mockResolvedValueOnce({
        data: testSites.data.slice(0, 5),
        totalCount: testSites.totalCount,
      })
      .mockResolvedValueOnce({
        data: testSites.data.slice(5, 10),
        totalCount: testSites.totalCount,
      });
    const wrapper = mount(EditOperatorSites, opts);
    await flushPromises();

    await wrapper.get('[data-testid="load-more"]').trigger('click');
    await flushPromises();

    const items = wrapper.findAllComponents(DiveSitesListItem);
    expect(items).toHaveLength(10);
    items.forEach((item, index) => {
      expect(item.props('site')).toEqual(testSites.data[index]);
    });

    expect(loadSpy).toHaveBeenCalledTimes(2);
    expect(loadSpy).toHaveBeenCalledWith(PartialOperator.slug, { skip: 5 });
  });

  it('will allow a user to add additional sites', async () => {
    const newSites = DiveSiteSchema.array().parse(SiteData.data.slice(10, 12));
    const addSpy = jest
      .spyOn(client.operators, 'addDiveSites')
      .mockResolvedValue(newSites.length);
    const wrapper = mount(EditOperatorSites, opts);
    await flushPromises();

    await wrapper.get(AddSitesButton).trigger('click');
    wrapper.getComponent(SelectSite).vm.$emit('multi-select', newSites);
    await flushPromises();

    expect(addSpy).toHaveBeenCalledWith(
      PartialOperator.slug,
      newSites.map((site) => site.id),
    );

    const items = await wrapper.findAllComponents(DiveSitesListItem);
    expect(items).toHaveLength(12);
  });

  it('will allow a user to cancel adding additional sites', async () => {
    const wrapper = mount(EditOperatorSites, opts);
    await flushPromises();

    await wrapper.get(AddSitesButton).trigger('click');
    await wrapper.get(DrawerPanel.CloseButton).trigger('click');

    expect(wrapper.findComponent(SelectSite).exists()).toBe(false);
    expect(wrapper.findAllComponents(DiveSitesListItem)).toHaveLength(10);
  });

  it('will allow a user to remove sites', async () => {
    const removeSpy = jest
      .spyOn(client.operators, 'removeDiveSites')
      .mockResolvedValue(2);
    const removeIds = [testSites.data[1].id, testSites.data[3].id];
    const wrapper = mount(EditOperatorSites, opts);
    await flushPromises();

    removeIds.forEach(async (id) => {
      await wrapper.get(`[data-testid="select-site-${id}"]`).setValue(true);
    });
    await flushPromises();
    await wrapper.get(RemoveSitesButton).trigger('click');
    await wrapper.get(ConfirmDialog.Confirm).trigger('click');
    await flushPromises();

    expect(removeSpy).toHaveBeenCalledWith(PartialOperator.slug, removeIds);
    expect(wrapper.findAllComponents(DiveSitesListItem)).toHaveLength(8);
  });

  it('will allow a user to cancel removing sites', async () => {
    const removeSpy = jest
      .spyOn(client.operators, 'removeDiveSites')
      .mockResolvedValue(2);
    const removeIds = [testSites.data[1].id, testSites.data[3].id];
    const wrapper = mount(EditOperatorSites, opts);
    await flushPromises();

    removeIds.forEach(async (id) => {
      await wrapper.get(`[data-testid="select-site-${id}"]`).setValue(true);
    });
    await flushPromises();
    await wrapper.get(RemoveSitesButton).trigger('click');
    await wrapper.get(ConfirmDialog.Cancel).trigger('click');
    await flushPromises();

    expect(removeSpy).not.toHaveBeenCalled();
    expect(wrapper.findAllComponents(DiveSitesListItem)).toHaveLength(10);
  });
});
