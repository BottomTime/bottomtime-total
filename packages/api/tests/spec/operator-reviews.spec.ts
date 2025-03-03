import mockFetch from 'fetch-mock-jest';

import {
  ApiClient,
  CreateOrUpdateOperatorReviewDTO,
  ListOperatorReviewsParams,
  LogBookSharing,
  OperatorReviewDTO,
  OperatorReviewSortBy,
  SortOrder,
} from '../../src';

const OperatorKey = 'best-operator';
const Reviews: OperatorReviewDTO[] = [
  {
    createdAt: 1737737746569,
    creator: {
      accountTier: 0,
      logBookSharing: LogBookSharing.Private,
      memberSince: 1683848454111,
      userId: '6dc6df21-5032-4245-80f0-676a8ea1b9f4',
      username: 'Kattie.Larson',
      avatar:
        'https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1045.jpg',
      name: 'Kattie Larson',
      location: 'El Paso, MI, NE',
    },
    comments:
      'Vulgo arcus corrupti decretum varietas clibanus aestas. Sapiente adnuo comedo cotidie aggredior eum ars omnis sol debitis. Aequus deleo impedit odit demum anser cado.\nTero auxilium necessitatibus sollicito. Benigne compello cito. Certe allatus sodalitas avaritia adipiscor adeptio pecus laudantium.\nSuppellex summisse animadverto. Amplexus terror sonitus denego. Voluptates amo recusandae deleo totus timor annus.',
    id: '0e46ead7-df78-4f76-bd41-2cd02154f814',
    rating: 4.3,
    updatedAt: 1737737746569,
  },
  {
    createdAt: 1737658463117,
    creator: {
      accountTier: 0,
      logBookSharing: LogBookSharing.Private,
      memberSince: 1701284399758,
      userId: '9df9bdd2-fb0e-4b49-a4a5-a9026c869277',
      username: 'Greyson.Bailey',
      avatar:
        'https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1162.jpg',
      name: 'Greyson Bailey',
      location: 'Whitecester, UT, AE',
    },
    comments:
      'Defessus repellat antiquus volaticus spes arbustum bellicus thesaurus verto vel. Tolero tergum ambitus tandem expedita curso damno aperte creptio. Valetudo tui tot.\nArcesso coepi subseco. Ante taceo adnuo fugiat atrocitas nobis approbo torqueo cupiditate modi. Valeo truculenter abstergo amor eos commodo.\nCoadunatio utrimque beatus ventus tempore confido. Tum autus sit sumptus aestus. Conqueror cupio degenero aqua anser sulum utilis casso templum odio.',
    id: 'f5913269-088a-405f-8d55-39b2e9ca1a7e',
    rating: 3.9,
    updatedAt: 1737658463117,
  },
] as const;

describe('Operator Reviews API client', () => {
  let client: ApiClient;

  beforeAll(() => {
    client = new ApiClient();
  });

  afterEach(() => {
    mockFetch.restore();
  });

  it('will list reviews', async () => {
    const options: ListOperatorReviewsParams = {
      query: 'great',
      limit: 10,
      skip: 10,
      creator: 'user123',
      sortBy: OperatorReviewSortBy.Age,
      sortOrder: SortOrder.Ascending,
    };
    mockFetch.get(
      {
        url: `/api/operators/${OperatorKey}/reviews?query=great&limit=10&skip=10&creator=user123&sortBy=createdAt&sortOrder=asc`,
      },
      {
        status: 200,
        body: {
          data: Reviews,
          totalCount: Reviews.length,
        },
      },
    );

    const results = await client.operatorReviews.listReviews(
      OperatorKey,
      options,
    );

    expect(mockFetch.done()).toBe(true);
    expect(results).toMatchSnapshot();
  });

  it('will retrieve a single review', async () => {
    mockFetch.get(`/api/operators/${OperatorKey}/reviews/${Reviews[0].id}`, {
      status: 200,
      body: Reviews[0],
    });

    const result = await client.operatorReviews.getReview(
      OperatorKey,
      Reviews[0].id,
    );

    expect(mockFetch.done()).toBe(true);
    expect(result).toMatchSnapshot();
  });

  it('will create a new review', async () => {
    const options: CreateOrUpdateOperatorReviewDTO = {
      rating: 4.5,
      comments: 'Great experience!',
    };
    mockFetch.post(
      {
        url: `/api/operators/${OperatorKey}/reviews`,
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

    const result = await client.operatorReviews.createReview(
      OperatorKey,
      options,
    );

    expect(mockFetch.done()).toBe(true);
    expect(result).toMatchSnapshot();
  });

  it('will update an existing review', async () => {
    const reviewId = '1ee111e2-fa1d-4bd0-8424-4fc30dfb954a';
    const options: CreateOrUpdateOperatorReviewDTO = {
      rating: 4.5,
      comments: 'Great experience!',
    };
    mockFetch.put(
      {
        url: `/api/operators/${OperatorKey}/reviews/${reviewId}`,
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

    const result = await client.operatorReviews.updateReview(
      OperatorKey,
      reviewId,
      options,
    );
    expect(mockFetch.done()).toBe(true);
    expect(result).toMatchSnapshot();
  });

  it('will delete a review', async () => {
    const reviewId = '1ee111e2-fa1d-4bd0-8424-4fc30dfb954a';
    mockFetch.delete(`/api/operators/${OperatorKey}/reviews/${reviewId}`, 204);
    await client.operatorReviews.deleteReview(OperatorKey, reviewId);
    expect(mockFetch.done()).toBe(true);
  });
});
