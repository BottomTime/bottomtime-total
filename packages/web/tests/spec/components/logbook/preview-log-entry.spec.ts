import { ApiClient } from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { ApiClientKey } from 'src/api-client';
import PreviewLogEntry from 'src/components/logbook/preview-log-entry.vue';
import { FullLogEntry, MinimalLogEntry } from 'tests/fixtures/log-entries';

describe('PreviewLogEntry component', () => {
  let client: ApiClient;
  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof PreviewLogEntry>;

  beforeAll(() => {
    client = new ApiClient();
  });

  beforeEach(() => {
    pinia = createPinia();
    opts = {
      global: {
        plugins: [pinia],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    };
  });

  it('will render with a full log entry', () => {
    const wrapper = mount(PreviewLogEntry, {
      ...opts,
      props: { entry: FullLogEntry },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render with a minimal log entry', () => {
    const wrapper = mount(PreviewLogEntry, {
      ...opts,
      props: { entry: MinimalLogEntry },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
