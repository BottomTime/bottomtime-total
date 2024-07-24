import mockFetch from 'fetch-mock-jest';

import { FeatureDTO, Fetcher } from '../../src';
import { Feature } from '../../src/client/feature';

const TestData: FeatureDTO = {
  createdAt: new Date('2023-12-01'),
  updatedAt: new Date('2023-12-01'),
  key: 'feature_key',
  name: 'Feature Name',
  description: 'Feature description',
  enabled: true,
};

describe('Feature class', () => {
  let client: Fetcher;
  let data: FeatureDTO;

  let feature: Feature;

  beforeAll(() => {
    client = new Fetcher();
  });

  beforeEach(() => {
    data = { ...TestData };
    feature = new Feature(client, data);
  });

  afterEach(() => {
    mockFetch.restore();
  });

  it('will return properties correctly', () => {
    expect(feature.key).toBe(TestData.key);
    expect(feature.name).toBe(TestData.name);
    expect(feature.description).toBe(TestData.description);
    expect(feature.enabled).toBe(TestData.enabled);
    expect(feature.createdAt).toEqual(TestData.createdAt);
    expect(feature.updatedAt).toEqual(TestData.updatedAt);
  });

  it('will allow properties to be set', () => {
    const newName = 'New Feature Name';
    const newDescription = 'New Feature description';
    const newEnabled = false;

    feature.name = newName;
    feature.description = newDescription;
    feature.enabled = newEnabled;

    expect(feature.name).toBe(newName);
    expect(feature.description).toBe(newDescription);
    expect(feature.enabled).toBe(newEnabled);
  });

  it('will render as JSON correctly', () => {
    expect(feature.toJSON()).toEqual(TestData);
  });

  it('will save changes to a feature', async () => {
    const expected = {
      ...TestData,
      name: 'New Feature Name',
      description: 'New Feature description',
      enabled: false,
    };
    mockFetch.put(
      {
        url: `/api/features/${TestData.key}`,
        body: {
          name: expected.name,
          description: expected.description,
          enabled: expected.enabled,
        },
      },
      {
        status: 204,
        body: {
          ...expected,
          updatedAt: new Date(),
        },
      },
    );

    feature.name = expected.name;
    feature.description = expected.description;
    feature.enabled = expected.enabled;
    await feature.save();

    expect(mockFetch.done()).toBe(true);
    expect(feature.updatedAt.valueOf()).toBeCloseTo(Date.now(), -3);
  });

  it('will delete a feature', async () => {
    mockFetch.delete(`/api/features/${TestData.key}`, 204);
    await feature.delete();
    expect(mockFetch.done()).toBe(true);
  });
});
