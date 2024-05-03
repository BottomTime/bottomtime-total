import { ComponentMountingOptions, mount } from '@vue/test-utils';

import dayjs from 'dayjs';
import localized from 'dayjs/plugin/localizedFormat';
import { Pinia, createPinia } from 'pinia';

import ViewLogbookEntry from '../../../../src/components/logbook/view-logbook-entry.vue';
import { FullLogEntry, MinimalLogEntry } from '../../../fixtures/log-entries';

dayjs.extend(localized);

describe('ViewLogbookEntry component', () => {
  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof ViewLogbookEntry>;

  beforeEach(() => {
    pinia = createPinia();

    opts = {
      global: {
        plugins: [pinia],
      },
    };
  });

  it('will render correctly for a full log entry', () => {
    opts.props = { entry: FullLogEntry };
    const wrapper = mount(ViewLogbookEntry, opts);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render correctly for a minimal log entry', () => {
    opts.props = { entry: MinimalLogEntry };
    const wrapper = mount(ViewLogbookEntry, opts);
    expect(wrapper.html()).toMatchSnapshot();
  });
});
