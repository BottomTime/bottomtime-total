import { mount } from '@vue/test-utils';

import FormSearchBox from '../../../../src/components/common/form-search-box.vue';

describe('FormSearchBox component', () => {
  it('will render correctly', () => {
    const wrapper = mount(FormSearchBox, {
      props: {
        modelValue: '',
        autofocus: true,
        controlId: 'search-box',
        placeholder: 'Search',
        testId: 'search-box',
        maxlength: 200,
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render correctly with a query value', () => {
    const wrapper = mount(FormSearchBox, {
      props: { modelValue: 'search term' },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will emit "search" event when enter key is pressed in input', async () => {
    const wrapper = mount(FormSearchBox);
    const input = wrapper.get('input');
    await input.setValue('search term');
    await input.trigger('keyup.enter');
    expect(wrapper.emitted('search')).toEqual([[]]);
  });

  it('will emit "search" event when search button is clicked with input value', async () => {
    const wrapper = mount(FormSearchBox);
    await wrapper.get('input').setValue('search term');
    await wrapper.get('button').trigger('click');
    expect(wrapper.emitted('search')).toEqual([[]]);
  });
});
