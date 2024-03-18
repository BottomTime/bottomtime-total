import StarRating from '@/components/common/star-rating.vue';
import { mount } from '@vue/test-utils';

describe('Star Rating component', () => {
  [
    1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4, 4.25, 4.5,
    4.75, 5,
  ].forEach((rating) => {
    it(`will correctly display a rating of ${rating} stars`, () => {
      const wrapper = mount(StarRating, {
        props: { rating, readonly: true },
      });
      expect(wrapper.html()).toMatchSnapshot();
    });
  });
});
