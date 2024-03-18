import { mount } from '@vue/test-utils';

import NotFoundView from '../../../src/views/not-found-view.vue';

describe('Not Found View', () => {
  it('will render correctly', () => {
    const wrapper = mount(NotFoundView);
    expect(wrapper.html()).toMatchSnapshot();
  });
});
