import { ComponentMountingOptions, mount } from '@vue/test-utils';

import SelectOperatorListItem from '../../../../../src/components/operators/selectOperator/select-operator-list-item.vue';
import { FullOperator } from '../../../../fixtures/operators';

describe('SelectOperatorListItem component', () => {
  let opts: ComponentMountingOptions<typeof SelectOperatorListItem>;

  beforeEach(() => {
    opts = {
      props: {
        operator: { ...FullOperator },
      },
    };
  });

  it('will render with operator details', () => {
    const wrapper = mount(SelectOperatorListItem, opts);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will emit select event when select button is pressed', async () => {
    const wrapper = mount(SelectOperatorListItem, opts);
    await wrapper
      .get(`[data-testid="select-operator-${FullOperator.slug}"]`)
      .trigger('click');
    expect(wrapper.emitted('select')).toEqual([[FullOperator]]);
  });

  it('will emit highlight event if the name is clicked', async () => {
    const wrapper = mount(SelectOperatorListItem, opts);
    await wrapper
      .get(`[data-testid="operator-name-${FullOperator.slug}"]`)
      .trigger('click');
    expect(wrapper.emitted('highlight')).toEqual([[FullOperator]]);
  });
});
