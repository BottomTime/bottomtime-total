import { mount } from '@vue/test-utils';

import ViewDiveOperator from '../../../../src/components/operators/view-dive-operator.vue';
import {
  FullDiveOperator,
  PartialDiveOperator,
} from '../../../fixtures/dive-operators';

describe('ViewDiveOperator component', () => {
  it('will render with partial properties', () => {
    const wrapper = mount(ViewDiveOperator, {
      props: {
        operator: PartialDiveOperator,
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render with all properties', () => {
    const wrapper = mount(ViewDiveOperator, {
      props: {
        operator: FullDiveOperator,
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
