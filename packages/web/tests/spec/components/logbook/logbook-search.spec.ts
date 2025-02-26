import { ComponentMountingOptions, mount } from '@vue/test-utils';

import StarRatingStub from 'tests/stubs/star-rating-stub.vue';

import LogbookSearch from '../../../../src/components/logbook/logbook-search.vue';

const SearchBox = '[data-testid="search-query"]';
const SearchButton = '[data-testid="btn-search"]';

describe('LogbookSearch component', () => {
  let opts: ComponentMountingOptions<typeof LogbookSearch>;

  beforeEach(() => {
    opts = {
      props: {
        params: {},
      },
      global: {
        stubs: {
          StarRating: StarRatingStub,
        },
      },
    };
  });

  it('will render correctly with no params', () => {
    const wrapper = mount(LogbookSearch, opts);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render correctly with params', async () => {
    const wrapper = mount(LogbookSearch, opts);
    await wrapper.setProps({
      params: {
        query: 'yo!',
        startDate: new Date('2024-01-01T00:00:00Z').valueOf(),
        endDate: new Date('2024-02-01T00:00:00Z').valueOf(),
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will emit "search" event when search is performed from the search box', async () => {
    const query = 'weeeee!!!';
    const wrapper = mount(LogbookSearch, opts);
    const searchBox = wrapper.get(SearchBox);
    await searchBox.setValue(query);
    await searchBox.trigger('keyup.enter');
    expect(wrapper.emitted('search')).toEqual([[{ query }]]);
  });

  it('will perform a robust search with all options', async () => {
    const query = 'weeeee!!!';
    const startDate = new Date('2024-01-01T00:00:00Z').valueOf();
    const endDate = new Date('2024-02-01T00:00:00Z').valueOf();
    const wrapper = mount(LogbookSearch, opts);
    await wrapper.setProps({ params: { startDate, endDate } });
    await wrapper.get(SearchBox).setValue(query);
    await wrapper.get(SearchButton).trigger('click');
    expect(wrapper.emitted('search')).toEqual([
      [{ query, startDate, endDate }],
    ]);
  });
});
