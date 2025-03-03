import { OperatorReviewDTO } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import EditOperatorReview from 'src/components/operators/edit-operator-review.vue';
import { BasicUser } from 'tests/fixtures/users';
import StarRatingStub from 'tests/stubs/star-rating-stub.vue';

const TestReview: OperatorReviewDTO = {
  createdAt: Date.now(),
  creator: BasicUser.profile,
  id: 'df900b4f-a617-4679-8693-13c884409da1',
  rating: 3.34,
  updatedAt: Date.now(),
  comments: 'What a great dive shop',
};

const NewReview: OperatorReviewDTO = {
  createdAt: Date.now(),
  creator: BasicUser.profile,
  id: '',
  rating: -1,
  updatedAt: Date.now(),
};

const SaveButton = '#operator-review-save';
const CancelButton = '#operator-review-cancel';

describe('EditOperatorReview component', () => {
  let opts: ComponentMountingOptions<typeof EditOperatorReview>;

  beforeEach(() => {
    opts = {
      props: {
        review: TestReview,
      },
      global: {
        stubs: {
          StarRating: StarRatingStub,
        },
      },
    };
  });

  it('will allow a user to create a new review', async () => {
    const newRating = 2.3;
    const newComments = 'This dive shop was ok.';
    const wrapper = mount(EditOperatorReview, opts);
    await wrapper.setProps({ review: NewReview });

    await wrapper.getComponent(StarRatingStub).setValue(newRating);
    await wrapper.get('textarea').setValue(newComments);
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.emitted('save')).toEqual([
      [{ ...NewReview, rating: newRating, comments: newComments }],
    ]);
  });

  it('will validate rating', async () => {
    const wrapper = mount(EditOperatorReview, opts);
    await wrapper.setProps({ review: NewReview });

    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.emitted('save')).toBeUndefined();
    expect(
      wrapper.get('[data-testid="operator-review-rating-error"]').text(),
    ).toMatchSnapshot();
  });

  it('will allow a user to edit their review', async () => {
    const newRating = 2.3;
    const newComments = 'This dive shop was ok.';
    const wrapper = mount(EditOperatorReview, opts);

    await wrapper
      .getComponent(StarRatingStub)
      .vm.$emit('update:modelValue', newRating);
    await wrapper.get('textarea').setValue(newComments);
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.emitted('save')).toEqual([
      [{ ...TestReview, rating: newRating, comments: newComments }],
    ]);
  });

  it('will emit cancel event', async () => {
    const wrapper = mount(EditOperatorReview, opts);
    await wrapper.get(CancelButton).trigger('click');
    expect(wrapper.emitted('cancel')).toEqual([[]]);
  });
});
