import { ComponentMountingOptions, mount } from '@vue/test-utils';

import AgenciesListItem from 'src/components/admin/agencies-list-item.vue';
import { TestAgencies } from 'tests/fixtures/agencies';

describe('AgenciesListItem component', () => {
  let opts: ComponentMountingOptions<typeof AgenciesListItem>;

  beforeEach(() => {
    opts = {
      props: {
        agency: TestAgencies[0],
      },
    };
  });

  it('will render information about an agency', () => {
    const wrapper = mount(AgenciesListItem, opts);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will emit edit event when edit button is pressed', async () => {
    const wrapper = mount(AgenciesListItem, opts);
    await wrapper
      .get(`[data-testid="edit-agency-${TestAgencies[0].name}"]`)
      .trigger('click');
    expect(wrapper.emitted('edit')).toEqual([[TestAgencies[0]]]);
  });

  it('will emit delete event when delete button is pressed', async () => {
    const wrapper = mount(AgenciesListItem, opts);
    await wrapper
      .get(`[data-testid="delete-agency-${TestAgencies[0].name}"]`)
      .trigger('click');
    expect(wrapper.emitted('delete')).toEqual([[TestAgencies[0]]]);
  });
});
