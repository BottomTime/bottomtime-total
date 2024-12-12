import mockFetch from 'fetch-mock-jest';

import {
  AccountTier,
  ApiList,
  CreateOrUpdateOperatorDTO,
  LogBookSharing,
  OperatorDTO,
  SearchOperatorsParams,
  SearchOperatorsResponseSchema,
  VerificationStatus,
} from '../../src';
import { Fetcher } from '../../src/client';
import { OperatorsApiClient } from '../../src/client/operators';
import TestData from '../fixtures/dive-operator-search-results.json';

describe('Operators API client', () => {
  let fetcher: Fetcher;
  let client: OperatorsApiClient;
  let testData: ApiList<OperatorDTO>;

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new OperatorsApiClient(fetcher);
    testData = SearchOperatorsResponseSchema.parse(TestData);
  });

  afterEach(() => {
    mockFetch.restore();
  });

  it('will retrieve a single operator', async () => {
    const key = 'test-operator';
    const expected: OperatorDTO = {
      active: true,
      createdAt: new Date(),
      id: 'fd5b16ef-0693-469f-a9f3-57d8885029b9',
      name: 'Test Operator',
      updatedAt: new Date(),
      owner: {
        accountTier: AccountTier.Basic,
        userId: '16dc9384-82bf-4ac3-bad2-b46456ed786e',
        username: 'test-user',
        memberSince: new Date(),
        logBookSharing: LogBookSharing.FriendsOnly,
      },
      verificationStatus: VerificationStatus.Verified,
      address: '123 Test St',
      banner: 'https://example.com/banner.jpg',
      description: 'This is a test operator.',
      email: 'test@email.org',
      gps: {
        lat: 0,
        lon: 0,
      },
      phone: '123-456-7890',
      logo: 'https://example.com/logo.jpg',
      slug: key,
      website: 'https://example.com',
    };

    mockFetch.get(`/api/operators/${key}`, {
      status: 200,
      body: expected,
    });

    const operator = await client.getOperator(key);

    expect(mockFetch.done()).toBe(true);
    expect(operator).toEqual(expected);
  });

  it('will perform a basic search of operators', async () => {
    mockFetch.get('/api/operators', {
      status: 200,
      body: testData,
    });

    const results = await client.searchOperators();

    expect(mockFetch.done()).toBe(true);
    expect(results.data).toHaveLength(testData.data.length);
    expect(results.totalCount).toBe(testData.totalCount);
    results.data.forEach((operator, index) => {
      expect(operator).toEqual(testData.data[index]);
    });
  });

  it('will perform a search with search parameters', async () => {
    const options: SearchOperatorsParams = {
      limit: 100,
      skip: 0,
      location: {
        lat: -10.23,
        lon: 45.67,
      },
      owner: 'razmataz82',
      radius: 120,
      query: 'test',
      showInactive: false,
    };

    mockFetch.get(
      {
        url: '/api/operators',
        query: {
          ...options,
          location: `${options.location!.lat},${options.location!.lon}`,
        },
      },
      {
        status: 200,
        body: testData,
      },
    );

    const results = await client.searchOperators(options);

    expect(mockFetch.calls()).toMatchSnapshot();
    expect(results.data).toHaveLength(testData.data.length);
    expect(results.totalCount).toBe(testData.totalCount);
    results.data.forEach((operator, index) => {
      expect(operator).toEqual(testData.data[index]);
    });
  });

  it('will create a new operator', async () => {
    const key = 'test-operator';
    const options: CreateOrUpdateOperatorDTO = {
      active: false,
      name: 'Test Operator',
      address: '123 Test St',
      description: 'This is a test operator.',
      email: 'test@email.org',
      gps: {
        lat: 0,
        lon: 0,
      },
      phone: '123-456-7890',
      slug: key,
      website: 'https://example.com',
    };
    const expected: OperatorDTO = {
      ...options,
      id: 'fd5b16ef-0693-469f-a9f3-57d8885029b9',
      createdAt: new Date(),
      updatedAt: new Date(),
      owner: {
        accountTier: AccountTier.Basic,
        userId: '16dc9384-82bf-4ac3-bad2-b46456ed786e',
        username: 'test-user',
        memberSince: new Date(),
        logBookSharing: LogBookSharing.FriendsOnly,
      },
      verificationStatus: VerificationStatus.Unverified,
      banner: 'https://example.com/banner.jpg',
      logo: 'https://example.com/logo.jpg',
    };

    mockFetch.post(
      {
        url: '/api/operators',
        body: options,
      },
      {
        status: 201,
        body: expected,
      },
    );

    const operator = await client.createOperator(options);

    expect(mockFetch.done()).toBe(true);
    expect(operator).toEqual(expected);
  });

  it.todo(
    'write some new tests to cover the remaining methods transferred from the old Operator class',
  );
});
