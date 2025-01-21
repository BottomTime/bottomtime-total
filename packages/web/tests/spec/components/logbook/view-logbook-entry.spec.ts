import { ComponentMountingOptions, mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';

import ViewLogbookEntry from '../../../../src/components/logbook/view-logbook-entry.vue';
import '../../../dayjs';
import { FullLogEntry, MinimalLogEntry } from '../../../fixtures/log-entries';
import StarRatingStub from '../../../star-rating-stub.vue';

describe('ViewLogbookEntry component', () => {
  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof ViewLogbookEntry>;

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
