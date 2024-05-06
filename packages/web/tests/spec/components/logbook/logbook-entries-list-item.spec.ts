import { ComponentMountingOptions, mount } from '@vue/test-utils';

import dayjs from 'dayjs';
import localized from 'dayjs/plugin/localizedFormat';
import { Pinia, createPinia } from 'pinia';

import LogbookEntriesListItem from '../../../../src/components/logbook/logbook-entries-list-item.vue';
import { useCurrentUser } from '../../../../src/store';
import { FullLogEntry, MinimalLogEntry } from '../../../fixtures/log-entries';
import { BasicUser } from '../../../fixtures/users';

dayjs.extend(localized);

const Checkbox = `[data-testid="select-${FullLogEntry.id}"]`;

describe('LobbookEntriesListItem component', () => {
  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let opts: ComponentMountingOptions<typeof LogbookEntriesListItem>;

  beforeEach(() => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    currentUser.user = BasicUser;
    opts = {
      global: {
        plugins: [pinia],
      },
    };
  });

  it('will render correctly with full logbook entry data', () => {
    opts.props = { entry: FullLogEntry };
    const wrapper = mount(LogbookEntriesListItem, opts);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render correctly for partial logbook entry data', () => {
    opts.props = { entry: MinimalLogEntry };
    const wrapper = mount(LogbookEntriesListItem, opts);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will show checkbox when in edit mode', () => {
    opts.props = { entry: FullLogEntry, editMode: true };
    const wrapper = mount(LogbookEntriesListItem, opts);
    expect(wrapper.find(Checkbox).isVisible()).toBe(true);
  });

  it('will hide checkbox when not in edit mode', () => {
    opts.props = { entry: FullLogEntry, editMode: false };
    const wrapper = mount(LogbookEntriesListItem, opts);
    expect(wrapper.find(Checkbox).exists()).toBe(false);
  });
});
