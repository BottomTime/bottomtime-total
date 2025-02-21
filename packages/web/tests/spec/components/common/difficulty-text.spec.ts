import { mount } from '@vue/test-utils';

import DifficultyText from 'src/components/common/difficulty-text.vue';

describe('DifficultyText component', () => {
  [undefined, 0.1, 0.7, 1.7, 2.8, 3.5, 4.8].forEach((difficulty) => {
    it(`will render correctly for difficulty ${difficulty}`, () => {
      const wrapper = mount(DifficultyText, {
        props: { difficulty },
      });
      expect(wrapper.text()).toMatchSnapshot();
    });
  });
});
