import {
  ApiClient,
  ApiList,
  DiveSiteReviewDTO,
  DiveSiteReviewsSortBy,
  ListDiveSiteReviewsResponseSchema,
  SortOrder,
} from '@bottomtime/api';

import {
  ComponentMountingOptions,
  flushPromises,
  mount,
} from '@vue/test-utils';

import { Pinia, createPinia } from 'pinia';
import { ApiClientKey } from 'src/api-client';
import DifficultyInput from 'src/components/common/difficulty-input.vue';
import DiveSiteReviewsListItem from 'src/components/diveSites/dive-site-reviews-list-item.vue';
import EditDiveSiteReview from 'src/components/diveSites/edit-dive-site-review.vue';
import ViewDiveSite from 'src/components/diveSites/view-dive-site.vue';
import { GeolocationKey } from 'src/geolocation';
import { useCurrentUser } from 'src/store';
import { BasicUser } from 'tests/fixtures/users';
import { MockGeolocation } from 'tests/mock-geolocation';

import TestReviews from '../../../fixtures/dive-site-reviews.json';
import {
  DiveSiteWithFullProperties,
  DiveSiteWithMinimalProperties,
} from '../../../fixtures/sites';
import StarRatingStub from '../../../stubs/star-rating-stub.vue';

const SubmitReviewButton = '#site-reviews-submit';
const LoadMoreButton = '[data-testid="site-reviews-load-more"]';
const SortOrderSelect = '#site-reviews-sort-order';

describe('View Dive Site component', () => {
  let client: ApiClient;

  let pinia: Pinia;
  let currentUser: ReturnType<typeof useCurrentUser>;
  let location: MockGeolocation;
  let opts: ComponentMountingOptions<typeof ViewDiveSite>;
  let testReviews: ApiList<DiveSiteReviewDTO>;

  beforeAll(() => {
    client = new ApiClient();
    testReviews = ListDiveSiteReviewsResponseSchema.parse(TestReviews);
  });

  beforeEach(() => {
    location = new MockGeolocation({
      lat: 45.44914,
      lon: -73.7909,
    });
    pinia = createPinia();
    currentUser = useCurrentUser(pinia);
    opts = {
      props: {
        site: { ...DiveSiteWithFullProperties },
      },
      global: {
        plugins: [pinia],
        provide: {
          [ApiClientKey as symbol]: client,
          [GeolocationKey as symbol]: location,
        },
        stubs: {
          teleport: true,
          StarRating: StarRatingStub,
        },
      },
    };

    currentUser.user = BasicUser;

    jest.useFakeTimers({
      now: new Date('2024-08-01T00:00:00Z'),
      doNotFake: ['nextTick', 'setImmediate'],
    });
    jest.spyOn(client.diveSiteReviews, 'listReviews').mockResolvedValue({
      data: [],
      totalCount: 0,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('will render site with full details', () => {
    const wrapper = mount(ViewDiveSite, opts);
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render site with minimal details', async () => {
    const wrapper = mount(ViewDiveSite, opts);
    await wrapper.setProps({ site: DiveSiteWithMinimalProperties });
    expect(wrapper.html()).toMatchSnapshot();
  });

  it('will render a list of reviews', async () => {
    const spy = jest
      .spyOn(client.diveSiteReviews, 'listReviews')
      .mockResolvedValue(testReviews);
    const wrapper = mount(ViewDiveSite, opts);
    await flushPromises();

    const reviews = wrapper.findAllComponents(DiveSiteReviewsListItem);
    expect(reviews).toHaveLength(testReviews.data.length);
    reviews.forEach((review, index) => {
      expect(review.props('review')).toEqual(testReviews.data[index]);
    });
    expect(wrapper.get(LoadMoreButton).isVisible()).toBe(true);

    expect(spy).toHaveBeenCalledWith(DiveSiteWithFullProperties.id, {
      sortBy: DiveSiteReviewsSortBy.CreatedOn,
      sortOrder: SortOrder.Descending,
    });
  });

  it('will allow user to change reviews sort order', async () => {
    const sortedReviews = {
      data: testReviews.data.sort((a, b) =>
        a.rating === b.rating ? a.createdOn - b.createdOn : a.rating - b.rating,
      ),
      totalCount: testReviews.totalCount,
    };

    const spy = jest
      .spyOn(client.diveSiteReviews, 'listReviews')
      .mockResolvedValue(testReviews);
    const wrapper = mount(ViewDiveSite, opts);
    await flushPromises();

    spy.mockResolvedValue(sortedReviews);
    await wrapper
      .get(SortOrderSelect)
      .setValue(`${DiveSiteReviewsSortBy.Rating}-${SortOrder.Ascending}`);
    await flushPromises();

    expect(spy).toHaveBeenCalledWith(DiveSiteWithFullProperties.id, {
      sortBy: DiveSiteReviewsSortBy.Rating,
      sortOrder: SortOrder.Ascending,
    });

    const reviews = wrapper.findAllComponents(DiveSiteReviewsListItem);
    expect(reviews).toHaveLength(sortedReviews.data.length);
    reviews.forEach((review, index) => {
      expect(review.props('review')).toEqual(sortedReviews.data[index]);
    });
  });

  describe('when managing reviews', () => {
    let reviewData: ApiList<DiveSiteReviewDTO>;

    beforeEach(() => {
      reviewData = {
        data: [
          {
            ...testReviews.data[0],
            creator: BasicUser.profile,
          },
        ],
        totalCount: 1,
      };
    });

    it('will allow a user to delete one of their reviews', async () => {
      jest
        .spyOn(client.diveSiteReviews, 'listReviews')
        .mockResolvedValue(reviewData);
      const deleteSpy = jest
        .spyOn(client.diveSiteReviews, 'deleteReview')
        .mockResolvedValue();
      const wrapper = mount(ViewDiveSite, opts);
      await flushPromises();

      const review = wrapper.getComponent(DiveSiteReviewsListItem);
      await review
        .get(`#delete-review-${reviewData.data[0].id}`)
        .trigger('click');
      await wrapper
        .get('[data-testid="dialog-confirm-button"]')
        .trigger('click');
      await flushPromises();

      expect(wrapper.findComponent(DiveSiteReviewsListItem).exists()).toBe(
        false,
      );
      expect(deleteSpy).toHaveBeenCalledWith(
        DiveSiteWithFullProperties.id,
        testReviews.data[0].id,
      );
    });

    it('will allow a user to change their mind about deleting a review', async () => {
      jest
        .spyOn(client.diveSiteReviews, 'listReviews')
        .mockResolvedValue(reviewData);
      const deleteSpy = jest
        .spyOn(client.diveSiteReviews, 'deleteReview')
        .mockResolvedValue();
      const wrapper = mount(ViewDiveSite, opts);
      await flushPromises();

      const review = wrapper.getComponent(DiveSiteReviewsListItem);
      await review
        .get(`#delete-review-${reviewData.data[0].id}`)
        .trigger('click');
      await wrapper
        .get('[data-testid="dialog-cancel-button"]')
        .trigger('click');
      await flushPromises();

      expect(
        wrapper.find('[data-testid="dialog-cancel-button"]').exists(),
      ).toBe(false);
      expect(wrapper.getComponent(DiveSiteReviewsListItem).isVisible()).toBe(
        true,
      );
      expect(deleteSpy).not.toHaveBeenCalled();
    });

    it('will allow a user to edit one of their reviews', async () => {
      const newRating = 3.91;
      const newDifficulty = 2.33;
      const newComments = 'Huzzah! An updated review!';
      const expected: DiveSiteReviewDTO = {
        ...reviewData.data[0],
        rating: newRating,
        difficulty: newDifficulty,
        comments: newComments,
      };
      jest
        .spyOn(client.diveSiteReviews, 'listReviews')
        .mockResolvedValue(reviewData);
      const saveSpy = jest
        .spyOn(client.diveSiteReviews, 'updateReview')
        .mockResolvedValue(expected);
      const wrapper = mount(ViewDiveSite, opts);
      await flushPromises();

      const review = wrapper.getComponent(DiveSiteReviewsListItem);
      await review
        .get(`#edit-review-${reviewData.data[0].id}`)
        .trigger('click');
      await review.getComponent(StarRatingStub).setValue(newRating);
      await review.getComponent(DifficultyInput).setValue(newDifficulty);
      await review.get('textarea').setValue(newComments);
      await review.get('#dive-site-review-save').trigger('click');
      await flushPromises();

      expect(saveSpy).toHaveBeenCalledWith(
        DiveSiteWithFullProperties.id,
        reviewData.data[0].id,
        expected,
      );
      expect(
        wrapper.getComponent(DiveSiteReviewsListItem).props('review'),
      ).toEqual(expected);
    });

    it('will allow a user to cancel editing a review', async () => {
      const newRating = 3.91;
      const newDifficulty = 2.33;
      const newComments = 'Huzzah! An updated review!';
      const expected: DiveSiteReviewDTO = {
        ...reviewData.data[0],
        rating: newRating,
        difficulty: newDifficulty,
        comments: newComments,
      };
      jest
        .spyOn(client.diveSiteReviews, 'listReviews')
        .mockResolvedValue(reviewData);
      const saveSpy = jest
        .spyOn(client.diveSiteReviews, 'updateReview')
        .mockResolvedValue(expected);
      const wrapper = mount(ViewDiveSite, opts);
      await flushPromises();

      const review = wrapper.getComponent(DiveSiteReviewsListItem);
      await review
        .get(`#edit-review-${reviewData.data[0].id}`)
        .trigger('click');
      await review.getComponent(StarRatingStub).setValue(newRating);
      await review.getComponent(DifficultyInput).setValue(newDifficulty);
      await review.get('textarea').setValue(newComments);
      await review.get('#dive-site-review-cancel').trigger('click');
      await flushPromises();

      expect(wrapper.find('#dive-site-review-cancel').exists()).toBe(false);
      expect(saveSpy).not.toHaveBeenCalled();
      expect(
        wrapper.getComponent(DiveSiteReviewsListItem).props('review'),
      ).toEqual(reviewData.data[0]);
    });

    it('will allow a user to load more reviews', async () => {
      jest
        .spyOn(client.diveSiteReviews, 'listReviews')
        .mockImplementation(async (_siteId, options) => {
          const offset = options?.skip ?? 0;
          return {
            data: testReviews.data.slice(offset, offset + 10),
            totalCount: testReviews.totalCount,
          };
        });

      const wrapper = mount(ViewDiveSite, opts);
      await flushPromises();

      await wrapper.get(LoadMoreButton).trigger('click');
      await flushPromises();

      const reviews = wrapper.findAllComponents(DiveSiteReviewsListItem);
      expect(reviews).toHaveLength(20);
      reviews.forEach((review, index) => {
        expect(review.props('review')).toEqual(testReviews.data[index]);
      });
    });

    it('will allow a user to submit a new review', async () => {
      const newRating = 3.91;
      const newDifficulty = 2.33;
      const newComments = 'Huzzah! An updated review!';
      const expected: DiveSiteReviewDTO = {
        ...reviewData.data[0],
        rating: newRating,
        difficulty: newDifficulty,
        comments: newComments,
      };
      jest.spyOn(client.diveSiteReviews, 'listReviews').mockResolvedValue({
        data: [],
        totalCount: 0,
      });
      const saveSpy = jest
        .spyOn(client.diveSiteReviews, 'createReview')
        .mockResolvedValue(expected);
      const wrapper = mount(ViewDiveSite, opts);
      await flushPromises();
      await wrapper.get(SubmitReviewButton).trigger('click');

      const editReview = wrapper.getComponent(EditDiveSiteReview);
      await editReview.getComponent(StarRatingStub).setValue(newRating);
      await editReview.getComponent(DifficultyInput).setValue(newDifficulty);
      await editReview.get('textarea').setValue(newComments);
      await editReview.get('#dive-site-review-save').trigger('click');
      await flushPromises();

      expect(saveSpy).toHaveBeenCalled();
      expect(wrapper.findComponent(EditDiveSiteReview).exists()).toBe(false);

      const newReview = wrapper.getComponent(DiveSiteReviewsListItem);
      expect(newReview.props('review')).toEqual(expected);
    });

    it('will allow a user to cancel submitting a new review', async () => {
      const newRating = 3.91;
      const newDifficulty = 2.33;
      const newComments = 'Huzzah! An updated review!';
      const expected: DiveSiteReviewDTO = {
        ...reviewData.data[0],
        rating: newRating,
        difficulty: newDifficulty,
        comments: newComments,
      };
      jest.spyOn(client.diveSiteReviews, 'listReviews').mockResolvedValue({
        data: [],
        totalCount: 0,
      });
      const saveSpy = jest
        .spyOn(client.diveSiteReviews, 'createReview')
        .mockResolvedValue(expected);
      const wrapper = mount(ViewDiveSite, opts);
      await flushPromises();
      await wrapper.get(SubmitReviewButton).trigger('click');

      const editReview = wrapper.getComponent(EditDiveSiteReview);
      await editReview.getComponent(StarRatingStub).setValue(newRating);
      await editReview.getComponent(DifficultyInput).setValue(newDifficulty);
      await editReview.get('textarea').setValue(newComments);
      await editReview.get('#dive-site-review-cancel').trigger('click');
      await flushPromises();

      expect(saveSpy).not.toHaveBeenCalled();
      expect(wrapper.findComponent(EditDiveSiteReview).exists()).toBe(false);
      expect(wrapper.findComponent(DiveSiteReviewsListItem).exists()).toBe(
        false,
      );
    });
  });
});
