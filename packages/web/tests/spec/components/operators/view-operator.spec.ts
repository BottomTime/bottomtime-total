import { ApiClient, VerificationStatus } from '@bottomtime/api';

import { ComponentMountingOptions, mount } from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { ApiClientKey } from 'src/api-client';
import ViewOperator from 'src/components/operators/view-operator.vue';

import { FullOperator, PartialOperator } from '../../../fixtures/operators';

describe('ViewOperator component', () => {
  let client: ApiClient;

  let pinia: Pinia;
  let opts: ComponentMountingOptions<typeof ViewOperator>;

  beforeAll(() => {
    client = new ApiClient();
  });

  beforeEach(() => {
    pinia = createPinia();
    opts = {
      props: {
        operator: FullOperator,
      },
      global: {
        plugins: [pinia],
        provide: {
          [ApiClientKey as symbol]: client,
        },
      },
    };
  });

  it('will render with partial properties', async () => {
    const wrapper = mount(ViewOperator, opts);
    await wrapper.setProps({ operator: PartialOperator });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render with all properties', () => {
    const wrapper = mount(ViewOperator, opts);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will show verified badge for verified operators', async () => {
    const wrapper = mount(ViewOperator, opts);
    await wrapper.setProps({
      operator: {
        ...FullOperator,
        verificationStatus: VerificationStatus.Verified,
      },
    });
    expect(wrapper.find('[data-testid="operator-verified"]').isVisible()).toBe(
      true,
    );
  });
});
