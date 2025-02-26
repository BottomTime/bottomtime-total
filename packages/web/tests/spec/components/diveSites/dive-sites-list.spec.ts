import {
  ApiList,
  DiveSiteDTO,
  SearchDiveSitesResponseSchema,
} from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import 'tests/dayjs';

import DiveSitesListItem from '../../../../src/components/diveSites/dive-sites-list-item.vue';
import DiveSitesList from '../../../../src/components/diveSites/dive-sites-list.vue';
import SearchResults from '../../../fixtures/dive-sites-search-results.json';
import StarRatingStub from '../../../stubs/star-rating-stub.vue';

const NoResults = '[data-testid="no-results"]';
const LoadMore = '[data-testid="load-more"]';

describe('Dive Sites List component', () => {
  let searchResults: ApiList<DiveSiteDTO>;

  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof DiveSitesList>;

  beforeAll(() => {
    searchResults = SearchDiveSitesResponseSchema.parse(SearchResults);
  });

  beforeEach(() => {
    pinia = createPinia();
    opts = {
      global: {
        plugins: [pinia],
        stubs: {
          StarRating: StarRatingStub,
        },
      },
    };
  });

  it('will indicate when there are no results to show', () => {
    opts.props = {
      sites: {
        data: [],
        totalCount: 0,
      },
    };
    const wrapper = mount(DiveSitesList, opts);

    const message = wrapper.get(NoResults);
    expect(message.isVisible()).toBe(true);
    expect(message.text()).toMatchSnapshot();
  });

  it('will display the results', () => {
    opts.props = {
      sites: {
        data: searchResults.data.slice(0, 10),
        totalCount: searchResults.totalCount,
      },
    };
    const wrapper = mount(DiveSitesList, opts);

    expect(wrapper.find(NoResults).exists()).toBe(false);
    const items = wrapper.findAllComponents(DiveSitesListItem);
    expect(items).toHaveLength(10);
    items.forEach((item, index) => {
      const site = searchResults.data[index];
      expect(item.props('site')).toEqual(site);
    });
  });

  it('will emit the site-selected event when a site is clicked', async () => {
    opts.props = {
      sites: {
        data: searchResults.data.slice(0, 10),
        totalCount: searchResults.totalCount,
      },
    };
    const wrapper = mount(DiveSitesList, opts);

    const item = wrapper.findComponent(DiveSitesListItem);
    item.vm.$emit('site-selected');

    expect(wrapper.emitted('site-selected')).toEqual([[searchResults.data[0]]]);
  });

  it('will display load more if some results are not shown', () => {
    opts.props = {
      sites: {
        data: searchResults.data.slice(0, 10),
        totalCount: searchResults.totalCount,
      },
    };
    const wrapper = mount(DiveSitesList, opts);

    expect(wrapper.get(LoadMore).isVisible()).toBe(true);
  });

  it('will emit load more event when load more is clicked', async () => {
    opts.props = {
      sites: {
        data: searchResults.data.slice(0, 10),
        totalCount: searchResults.totalCount,
      },
    };
    const wrapper = mount(DiveSitesList, opts);

    await wrapper.find(LoadMore).trigger('click');

    expect(wrapper.emitted('load-more')).toBeTruthy();
  });

  it('will not display load more if all results are shown', () => {
    opts.props = {
      sites: {
        data: searchResults.data.slice(0, 10),
        totalCount: 10,
      },
    };
    const wrapper = mount(DiveSitesList, opts);

    expect(wrapper.find(LoadMore).exists()).toBe(false);
  });

  it('will show a loading spinner if actively loading more results', () => {
    opts.props = {
      sites: {
        data: searchResults.data.slice(0, 10),
        totalCount: searchResults.totalCount,
      },
      isLoadingMore: true,
    };
    const wrapper = mount(DiveSitesList, opts);

    expect(wrapper.find(LoadMore).exists()).toBe(false);
    expect(wrapper.find('[data-testid="loading-more"]').isVisible()).toBe(true);
  });
});
