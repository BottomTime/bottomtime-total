import { ComponentMountingOptions, mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import StarRatingStub from 'tests/stubs/star-rating-stub.vue';

import LogbookEntriesListItem from '../../../../src/components/logbook/logbook-entries-list-item.vue';
import { useCurrentUser } from '../../../../src/store';
import { FullLogEntry, MinimalLogEntry } from '../../../fixtures/log-entries';
import { BasicUser } from '../../../fixtures/users';

const Checkbox = `[data-testid="toggle-${FullLogEntry.id}"]`;
const EditButton = `[data-testid="edit-entry-${FullLogEntry.id}"]`;
const DeleteButton = `[data-testid="delete-entry-${FullLogEntry.id}"]`;
const Title = `[data-testid="select-${FullLogEntry.id}"]`;

describe('LogbookEntriesListItem component', () => {
  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof LogbookEntriesListItem>;

  beforeEach(() => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    currentUser.user = BasicUser;
    opts = {
      props: {
        editMode: true,
        entry: FullLogEntry,
      },
      global: {
        plugins: [pinia],
        stubs: {
          StarRating: StarRatingStub,
        },
      },
    };
  });

  it('will render correctly with full logbook entry data', () => {
    const wrapper = mount(LogbookEntriesListItem, opts);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render correctly for partial logbook entry data', async () => {
    const wrapper = mount(LogbookEntriesListItem, opts);
    await wrapper.setProps({ entry: MinimalLogEntry });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will show checkbox when in edit mode', () => {
    const wrapper = mount(LogbookEntriesListItem, opts);
    expect(wrapper.find(Checkbox).isVisible()).toBe(true);
  });

  it('will hide checkbox when not in edit mode', async () => {
    const wrapper = mount(LogbookEntriesListItem, opts);
    await wrapper.setProps({ editMode: false });
    expect(wrapper.find(Checkbox).exists()).toBe(false);
  });

  it('will emit "toggle-select" event when checkbox is clicked', async () => {
    const wrapper = mount(LogbookEntriesListItem, opts);
    await wrapper.get(Checkbox).setValue(true);
    expect(wrapper.emitted('toggle-select')).toEqual([[FullLogEntry]]);
  });

  it('will emit "edit" event if edit button is clicked', async () => {
    const wrapper = mount(LogbookEntriesListItem, opts);
    await wrapper.get(EditButton).trigger('click');
    expect(wrapper.emitted('edit')).toEqual([[FullLogEntry]]);
  });

  it('will emit "delete" event if delete button is clicked', async () => {
    const wrapper = mount(LogbookEntriesListItem, opts);
    await wrapper.get(DeleteButton).trigger('click');
    expect(wrapper.emitted('delete')).toEqual([[FullLogEntry]]);
  });

  it('will emit "highlight" event if title text is clicked', async () => {
    const wrapper = mount(LogbookEntriesListItem, opts);
    await wrapper.get(Title).trigger('click');
    expect(wrapper.emitted('highlight')).toEqual([[FullLogEntry]]);
  });
});
