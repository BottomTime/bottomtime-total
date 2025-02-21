import { DiveSiteReviewDTO } from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import DifficultyInput from 'src/components/common/difficulty-input.vue';
import DiveSiteReviewsListItem from 'src/components/diveSites/dive-site-reviews-list-item.vue';
import { useCurrentUser } from 'src/store';
import 'tests/dayjs';
import { AdminUser, BasicUser } from 'tests/fixtures/users';
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

const EditButton = `#edit-review-${TestReview.id}`;
const DeleteButton = `#delete-review-${TestReview.id}`;

describe('DiveSiteReviewsListItem component', () => {
  let opts: ComponentMountingOptions<typeof DiveSiteReviewsListItem>;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;

  beforeEach(() => {
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    opts = {
      props: {
        review: { ...TestReview },
      },
      global: {
        plugins: [pinia],
        stubs: {
          StarRating: StarRatingStub,
        },
      },
    };
  });

  it('will render with all review properties set', () => {
    const wrapper = mount(DiveSiteReviewsListItem, opts);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render with only required review properties set', async () => {
    const review: DiveSiteReviewDTO = {
      createdOn: TestReview.createdOn,
      creator: TestReview.creator,
      id: TestReview.id,
      rating: TestReview.rating,
    };
    const wrapper = mount(DiveSiteReviewsListItem, opts);
    await wrapper.setProps({ review });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will show edit and delete buttons if the user is the creator', () => {
    currentUser.user = BasicUser;
    const wrapper = mount(DiveSiteReviewsListItem, opts);
    expect(wrapper.get(EditButton).isVisible()).toBe(true);
    expect(wrapper.get(DeleteButton).isVisible()).toBe(true);
  });

  it('will show edit and delete buttons if the user is an admin', () => {
    currentUser.user = AdminUser;
    const wrapper = mount(DiveSiteReviewsListItem, opts);
    expect(wrapper.get(EditButton).isVisible()).toBe(true);
    expect(wrapper.get(DeleteButton).isVisible()).toBe(true);
  });

  it('will emit event if user clicks edit button', async () => {
    currentUser.user = BasicUser;
    const wrapper = mount(DiveSiteReviewsListItem, opts);
    await wrapper.get(EditButton).trigger('click');
    expect(wrapper.emitted('edit')).toEqual([[TestReview]]);
  });

  it('will emit event if user clicks the delete button', async () => {
    currentUser.user = BasicUser;
    const wrapper = mount(DiveSiteReviewsListItem, opts);
    await wrapper.get(DeleteButton).trigger('click');
    expect(wrapper.emitted('delete')).toEqual([[TestReview]]);
  });

  it('will allow review to be modified in edit mode', async () => {
    const newRating = 4.5;
    const newDifficulty = 0.5;
    const newComments = 'This is a new review.';
    const wrapper = mount(DiveSiteReviewsListItem, opts);

    await wrapper.setProps({ editMode: true });
    await wrapper.getComponent(StarRatingStub).setValue(newRating);
    await wrapper.getComponent(DifficultyInput).setValue(newDifficulty);
    await wrapper.find('textarea').setValue(newComments);
    await wrapper.get('#dive-site-review-save').trigger('click');
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
});
