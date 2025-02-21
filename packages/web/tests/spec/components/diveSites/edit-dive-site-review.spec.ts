import { DiveSiteReviewDTO } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import DifficultyInput from 'src/components/common/difficulty-input.vue';
import EditDiveSiteReview from 'src/components/diveSites/edit-dive-site-review.vue';
import { BasicUser } from 'tests/fixtures/users';
import StarRatingStub from 'tests/star-rating-stub.vue';

const TestReview: DiveSiteReviewDTO = {
  createdOn: new Date('2021-01-01T00:00:00Z').valueOf(),
  creator: BasicUser.profile,
  id: '7cda48eb-25ee-4823-bfbb-97d651a2afe6',
  rating: 3.33,
  comments: 'This is a test review.',
  difficulty: 0.88,
  updatedOn: new Date('2021-01-01T00:00:00Z').valueOf(),
} as const;

const CommentsInput = '#dive-site-review-comments';
const SaveButton = '#dive-site-review-save';
const CancelButton = '#dive-site-review-cancel';

describe('EditDiveSiteReview component', () => {
  let opts: ComponentMountingOptions<typeof EditDiveSiteReview>;

  beforeEach(() => {
    opts = {
      props: {
        review: { ...TestReview },
      },
      global: {
        stubs: {
          StarRating: StarRatingStub,
        },
      },
    };
  });

  it('will render with a review', () => {
    const wrapper = mount(EditDiveSiteReview, opts);
    expect(wrapper.getComponent(StarRatingStub).props('modelValue')).toBe(
      TestReview.rating,
    );
    expect(wrapper.getComponent(DifficultyInput).props('modelValue')).toBe(
      TestReview.difficulty,
    );
    expect(wrapper.get<HTMLTextAreaElement>(CommentsInput).element.value).toBe(
      TestReview.comments,
    );
  });

  it('will allow a user to edit a site review', async () => {
    const newRating = 4.5;
    const newDifficulty = 2.1;
    const newComments = 'This is an updated review.';
    const wrapper = mount(EditDiveSiteReview, opts);
    await wrapper.getComponent(StarRatingStub).setValue(newRating);
    await wrapper.getComponent(DifficultyInput).setValue(newDifficulty);
    await wrapper.get(CommentsInput).setValue(newComments);
    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.emitted('save')).toEqual([
      [
        {
          ...TestReview,
          rating: newRating,
          difficulty: newDifficulty,
          comments: newComments,
        },
      ],
    ]);
  });

  it('will validate new ratings', async () => {
    const wrapper = mount(EditDiveSiteReview, opts);
    await wrapper.setProps({
      review: {
        ...TestReview,
        comments: undefined,
        difficulty: undefined,
        rating: -1,
      },
    });

    await wrapper.get(SaveButton).trigger('click');
    await flushPromises();

    expect(wrapper.emitted('save')).toBeUndefined();
    expect(
      wrapper.get('[data-testid="dive-site-review-rating-error"]').text(),
    ).toMatchSnapshot();
  });

  it('will emit cancel event if editing is canceled', async () => {
    const wrapper = mount(EditDiveSiteReview, opts);
    await wrapper.get(CancelButton).trigger('click');
  });
});
