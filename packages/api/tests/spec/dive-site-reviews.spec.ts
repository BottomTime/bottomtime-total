import mockFetch from 'fetch-mock-jest';

import {
  ApiClient,
  CreateOrUpdateDiveSiteReviewDTO,
  DiveSiteReviewsSortBy,
  ListDiveSiteReviewsParamsDTO,
  SortOrder,
} from '../../src';

const SiteId = '387ce3cf-44cf-426b-9f82-33fb529587df';
const ReviewId = '4b8c46d0-d748-461d-aebd-bce739c10240';

const Reviews = [
  {
    id: '019500a7-2808-7ff0-8a8c-8a04fa81a3cc',
    creator: {
      accountTier: 200,
      memberSince: 1713361114242,
      userId: '4177d67c-10d3-4f9e-a51b-1afc62477bc9',
      username: 'Jack.S',
      logBookSharing: 'private',
      name: 'Jack Sparrow',
      avatar: '/api/users/Jack.S/avatar',
      location: 'Nassau, Bahamas',
    },
    createdOn: 1739472709639,
    updatedOn: 1739472709640,
    rating: 3.7,
    difficulty: 0.6,
    comments: 'Huzzah! A review.',
  },
] as const;

describe('Dive Site Reviews API client', () => {
  let client: ApiClient;

  beforeAll(() => {
    client = new ApiClient();
  });

  afterEach(() => {
    mockFetch.restore();
  });

  it('will list reviews for a site', async () => {
    const options: ListDiveSiteReviewsParamsDTO = {
      creator: 'Jack.S',
      limit: 10,
      skip: 10,
      sortBy: DiveSiteReviewsSortBy.Rating,
      sortOrder: SortOrder.Descending,
    };
    mockFetch.get(
      `/api/diveSites/${SiteId}/reviews?creator=Jack.S&sortBy=rating&sortOrder=desc&skip=10&limit=10`,
      {
        status: 200,
        body: {
          data: Reviews,
          totalCount: Reviews.length,
        },
      },
    );

    const results = await client.diveSiteReviews.listReviews(SiteId, options);

    expect(results).toMatchSnapshot();
    expect(mockFetch.done()).toBe(true);
  });

  it('will retrieve a single review', async () => {
    mockFetch.get(`/api/diveSites/${SiteId}/reviews/${ReviewId}`, {
      status: 200,
      body: Reviews[0],
    });

    const result = await client.diveSiteReviews.getReview(SiteId, ReviewId);

    expect(mockFetch.done()).toBe(true);
    expect(result).toMatchSnapshot();
  });

  it('will create a new review', async () => {
    const options: CreateOrUpdateDiveSiteReviewDTO = {
      rating: 5,
      difficulty: 1.2,
      comments: 'Great site!',
    };
    mockFetch.post(
      {
        url: `/api/diveSites/${SiteId}/reviews`,
        body: options,
      },
      {
        status: 201,
        body: {
          ...Reviews[0],
          ...options,
        },
      },
    );

    const result = await client.diveSiteReviews.createReview(SiteId, options);

    expect(mockFetch.done()).toBe(true);
    expect(result).toMatchSnapshot();
  });

  it('will update an existing review', async () => {
    const options: CreateOrUpdateDiveSiteReviewDTO = {
      rating: 5,
      difficulty: 1.2,
      comments: 'Great site!',
    };
    mockFetch.put(
      {
        url: `/api/diveSites/${SiteId}/reviews/${ReviewId}`,
        body: options,
      },
      {
        status: 200,
        body: {
          ...Reviews[0],
          ...options,
        },
      },
    );

    const result = await client.diveSiteReviews.updateReview(
      SiteId,
      ReviewId,
      options,
    );

    expect(mockFetch.done()).toBe(true);
    expect(result).toMatchSnapshot();
  });

  it('will delete a review', async () => {
    mockFetch.delete(`/api/diveSites/${SiteId}/reviews/${ReviewId}`, 204);
    await client.diveSiteReviews.deleteReview(SiteId, ReviewId);
    expect(mockFetch.done()).toBe(true);
  });
});
