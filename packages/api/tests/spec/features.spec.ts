import mockFetch from 'fetch-mock-jest';

import {
  CreateOrUpdateFeatureDTO,
  Feature,
  FeatureDTO,
  Fetcher,
  HttpException,
} from '../../src';
import { FeaturesApiClient } from '../../src/client/features';

const TestData: FeatureDTO[] = [
  {
    createdAt: new Date('2021-01-01T00:00:00.000Z'),
    updatedAt: new Date('2021-01-01T00:00:00.000Z'),
    key: 'awesome_feature',
    name: 'Latest Awesome Thing',
    description: 'This is a test feature',
    enabled: true,
  },
  {
    createdAt: new Date('2021-01-01T00:00:00.000Z'),
    updatedAt: new Date('2021-01-01T00:00:00.000Z'),
    key: 'secret_feature',
    name: 'Top Secret Feature',
    description: 'Shhh! No one is supposed to know about this',
    enabled: false,
  },
  {
    createdAt: new Date('2021-01-01T00:00:00.000Z'),
    updatedAt: new Date('2021-01-01T00:00:00.000Z'),
    key: 'old_feature',
    name: 'Old and Busted',
    description: 'This is a test feature',
    enabled: false,
  },
];

describe('Features API client', () => {
  let fetcher: Fetcher;
  let client: FeaturesApiClient;

  beforeAll(() => {
    fetcher = new Fetcher();
    client = new FeaturesApiClient(fetcher);
  });

  afterEach(() => {
    mockFetch.restore();
  });

  it('will retrieve a single feature flag', async () => {
    const key = TestData[1].key;
    mockFetch.get(`/api/features/${key}`, {
      status: 200,
      body: TestData[1],
    });

    const feature = await client.getFeature(key);
    expect(feature.toJSON()).toEqual(TestData[1]);
    expect(mockFetch.done()).toBe(true);
  });

  it('will throw an HttpException if the requested feature flag is not found', async () => {
    const key = 'no_such_flag';
    mockFetch.get(`/api/features/${key}`, 404);
    await expect(client.getFeature(key)).rejects.toThrow(HttpException);
    expect(mockFetch.done()).toBe(true);
  });

  it('will create a new feature flag', async () => {
    const key = 'newest_flag';
    const options: CreateOrUpdateFeatureDTO = {
      name: 'Newish Flag',
      description: 'This is a flag',
      enabled: true,
    };
    const expected: FeatureDTO = {
      key,
      createdAt: new Date('2024-07-25T07:42:48Z'),
      updatedAt: new Date('2024-07-25T07:42:48Z'),
      ...options,
    };
    mockFetch.put(
      {
        url: `/api/features/${key}`,
        body: options,
      },
      {
        status: 201,
        body: expected,
      },
    );

    const feature = await client.createFeature(key, options);

    expect(feature.toJSON()).toEqual(expected);
    expect(mockFetch.done()).toBe(true);
  });

  it('will list all existing feature flags', async () => {
    mockFetch.get('/api/features', TestData);

    const features = await client.listFeatures();

    expect(features).toHaveLength(TestData.length);
    features.forEach((feature, index) => {
      expect(feature).toBeInstanceOf(Feature);
      expect(feature.name).toBe(TestData[index].name);
      expect(feature.description).toBe(TestData[index].description);
      expect(feature.enabled).toBe(TestData[index].enabled);
    });
    expect(mockFetch.done()).toBe(true);
  });

  it('will wrap a DTO into a Feature class', () => {
    const dto = TestData[0];
    const feature = client.wrapDTO(dto);
    expect(feature.name).toBe(dto.name);
    expect(feature.description).toBe(dto.description);
    expect(feature.enabled).toBe(dto.enabled);
  });
});
