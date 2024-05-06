import { mount } from '@vue/test-utils';

import LogbookSearch from '../../../../src/components/logbook/logbook-search.vue';

const SearchBox = '[data-testid="search-query"]';
const SearchButton = '[data-testid="btn-search"]';

describe('LogbookSearch component', () => {
  it('will render correctly with no params', () => {
    const wrapper = mount(LogbookSearch, { props: { params: {} } });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render correctly with params', () => {
    const wrapper = mount(LogbookSearch, {
      props: {
        params: {
          query: 'yo!',
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-02-01T00:00:00Z'),
        },
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will emit "search" event when search is performed from the search box', async () => {
    const query = 'weeeee!!!';
    const wrapper = mount(LogbookSearch, { props: { params: {} } });
    const searchBox = wrapper.get(SearchBox);
    await searchBox.setValue(query);
    await searchBox.trigger('keyup.enter');
    expect(wrapper.emitted('search')).toEqual([[{ query }]]);
  });

  it('will perform a robust search with all options', async () => {
    const query = 'weeeee!!!';
    const startDate = new Date('2024-01-01T00:00:00Z');
    const endDate = new Date('2024-02-01T00:00:00Z');
    const wrapper = mount(LogbookSearch, {
      props: { params: { startDate, endDate } },
    });
    await wrapper.get(SearchBox).setValue(query);
    await wrapper.get(SearchButton).trigger('click');
    expect(wrapper.emitted('search')).toEqual([
      [{ query, startDate, endDate }],
    ]);
  });
});
