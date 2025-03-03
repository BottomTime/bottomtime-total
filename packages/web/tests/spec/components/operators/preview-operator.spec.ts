import { ComponentMountingOptions, mount } from '@vue/test-utils';

import PreviewOperator from 'src/components/operators/preview-operator.vue';
import { FullOperator } from 'tests/fixtures/operators';
import StarRatingStub from 'tests/stubs/star-rating-stub.vue';

describe('PreviewOperatorComponent component', () => {
  let opts: ComponentMountingOptions<typeof PreviewOperator>;

  beforeAll(() => {
    opts = {
      global: {
        stubs: {
          StarRating: StarRatingStub,
        },
      },
    };
  });

  it('will render an operator with all props set', () => {
    const wrapper = mount(PreviewOperator, {
      ...opts,
      props: {
        operator: FullOperator,
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render an operator with some properties omitted', () => {
    const wrapper = mount(PreviewOperator, {
      ...opts,
      props: {
        operator: FullOperator,
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });
});
