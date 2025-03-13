import { ComponentMountingOptions, mount } from '@vue/test-utils';

import PreviewOperator from 'src/components/operators/preview-operator.vue';
import { FullOperator, PartialOperator } from 'tests/fixtures/operators';
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

  it('will render unexpanded', () => {
    const wrapper = mount(PreviewOperator, {
      ...opts,
      props: {
        operator: FullOperator,
      },
    });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render expanded an operator with all props set', async () => {
    const wrapper = mount(PreviewOperator, {
      ...opts,
      props: {
        operator: FullOperator,
      },
    });
    await wrapper
      .get('[data-testid="expand-operator-details"]')
      .trigger('click');
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render expanded an operator with some properties omitted', async () => {
    const wrapper = mount(PreviewOperator, {
      ...opts,
      props: {
        operator: PartialOperator,
      },
    });
    await wrapper
      .get('[data-testid="expand-operator-details"]')
      .trigger('click');
    expect(wrapper.html()).toMatchSnapshot();
  });
});
