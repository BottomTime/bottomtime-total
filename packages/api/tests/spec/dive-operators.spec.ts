import mockFetch from 'fetch-mock-jest';

import { DiveOperator, Fetcher } from '../../src/client';
import { DiveOperatorsApiClient } from '../../src/client/dive-operators';
import {
  CreateOrUpdateDiveOperatorDTO,
  DiveOperatorDTO,
  LogBookSharing,
  SearchDiveOperatorsParams,
  SearchDiveOperatorsResponseDTO,
  SearchDiveOperatorsResponseSchema,
} from '../../src/types';
import TestData from '../fixtures/dive-operator-search-results.json';

describe('Operators API client', () => {
  let fetcher: Fetcher;
  let client: DiveOperatorsApiClient;
  let testData: SearchDiveOperatorsResponseDTO;

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new DiveOperatorsApiClient(fetcher);
    testData = SearchDiveOperatorsResponseSchema.parse(TestData);
  });

  afterEach(() => {
    mockFetch.restore();
  });

  it('will retrieve a single operator', async () => {
    const key = 'test-operator';
    const expected: DiveOperatorDTO = {
      createdAt: new Date(),
      id: 'fd5b16ef-0693-469f-a9f3-57d8885029b9',
      name: 'Test Operator',
      updatedAt: new Date(),
      owner: {
        userId: '16dc9384-82bf-4ac3-bad2-b46456ed786e',
        username: 'test-user',
        memberSince: new Date(),
        logBookSharing: LogBookSharing.FriendsOnly,
      },
      verified: true,
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

    const operator = await client.getDiveOperator(key);

    expect(mockFetch.done()).toBe(true);
    expect(operator.toJSON()).toEqual(expected);
  });

  it('will perform a basic search of operators', async () => {
    mockFetch.get('/api/operators', {
      status: 200,
      body: testData,
    });

    const results = await client.searchDiveOperators();

    expect(mockFetch.done()).toBe(true);
    expect(results).toEqual(testData);
  });

  it('will perform a search with search parameters', async () => {
    const options: SearchDiveOperatorsParams = {
      limit: 100,
      skip: 0,
      location: {
        lat: -10.23,
        lon: 45.67,
      },
      radius: 120,
      query: 'test',
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

    const results = await client.searchDiveOperators(options);

    expect(mockFetch.calls()).toMatchSnapshot();
    expect(results).toEqual(testData);
  });

  it('will create a new operator', async () => {
    const key = 'test-operator';
    const options: CreateOrUpdateDiveOperatorDTO = {
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
    const expected: DiveOperatorDTO = {
      ...options,
      id: 'fd5b16ef-0693-469f-a9f3-57d8885029b9',
      createdAt: new Date(),
      updatedAt: new Date(),
      owner: {
        userId: '16dc9384-82bf-4ac3-bad2-b46456ed786e',
        username: 'test-user',
        memberSince: new Date(),
        logBookSharing: LogBookSharing.FriendsOnly,
      },
      verified: true,
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

    const operator = await client.createDiveOperator(options);

    expect(mockFetch.done()).toBe(true);
    expect(operator.toJSON()).toEqual(expected);
  });

  it('will wrap an existing DTO in a DiveOperator instance', () => {
    const key = 'test-operator';
    const expected: DiveOperatorDTO = {
      createdAt: new Date(),
      id: 'fd5b16ef-0693-469f-a9f3-57d8885029b9',
      name: 'Test Operator',
      updatedAt: new Date(),
      owner: {
        userId: '16dc9384-82bf-4ac3-bad2-b46456ed786e',
        username: 'test-user',
        memberSince: new Date(),
        logBookSharing: LogBookSharing.FriendsOnly,
      },
      verified: true,
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

    const operator = client.wrapDTO(expected);
    expect(operator).toBeInstanceOf(DiveOperator);
    expect(operator.toJSON()).toEqual(expected);
  });
});
