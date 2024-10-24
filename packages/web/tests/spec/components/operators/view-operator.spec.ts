import { VerificationStatus } from '@bottomtime/api';

import { mount } from '@vue/test-utils';

import ViewOperator from '../../../../src/components/operators/view-operator.vue';
import { FullOperator, PartialOperator } from '../../../fixtures/operators';

describe('ViewOperator component', () => {
  it('will render with partial properties', () => {
    const wrapper = mount(ViewOperator, {
      props: {
        operator: PartialOperator,
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render with all properties', () => {
    const wrapper = mount(ViewOperator, {
      props: {
        operator: FullOperator,
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will show verified badge for verified operators', () => {
    const wrapper = mount(ViewOperator, {
      props: {
        operator: {
          ...FullOperator,
          verificationStatus: VerificationStatus.Verified,
        },
      },
    });
    expect(wrapper.find('[data-testid="operator-verified"]').isVisible()).toBe(
      true,
    );
  });
});
