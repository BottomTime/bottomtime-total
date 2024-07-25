import { Repository } from 'typeorm';

import { FeatureEntity } from '../../../src/data';
import { Feature } from '../../../src/features/feature';
import { dataSource } from '../../data-source';

const TestData: FeatureEntity = {
  id: '4ba55e5e-99e3-4487-8277-e2f7be8111d3',
  createdAt: new Date('2021-01-01T00:00:00.000Z'),
  updatedAt: new Date('2024-07-23T16:07:08Z'),
  key: 'mah_test_feature',
  name: 'Test Feature',
  description: 'This is a test feature',
  enabled: true,
};

describe('Feature class', () => {
  let features: Repository<FeatureEntity>;
  let feature: Feature;

  beforeAll(() => {
    features = dataSource.getRepository(FeatureEntity);
  });

  beforeEach(() => {
    feature = new Feature(features, { ...TestData });
  });

  it('will return properties correctly', () => {
    expect(feature.key).toBe(TestData.key);
    expect(feature.name).toBe(TestData.name);
    expect(feature.description).toBe(TestData.description);
    expect(feature.enabled).toBe(TestData.enabled);
  });

  it('will update properties correctly', () => {
    feature.name = 'New Name';
    feature.description = 'New Description';
    feature.enabled = false;

    expect(feature.name).toBe('New Name');
    expect(feature.description).toBe('New Description');
    expect(feature.enabled).toBe(false);
  });

  it('will save a new feature', async () => {
    await features.save(TestData);
    const savedFeature = await features.findOneByOrFail({ id: TestData.id });
    expect(savedFeature).toEqual(TestData);
  });

  it('will save changes to a feature', async () => {
    await features.save(TestData);

    feature.name = 'New Name';
    feature.description = 'New Description';
    feature.enabled = false;
    await feature.save();

    const updatedFeature = await features.findOneByOrFail({ id: TestData.id });
    expect(updatedFeature).toEqual({
      ...TestData,
      name: 'New Name',
      description: 'New Description',
      enabled: false,
      updatedAt: feature.updatedAt,
    });
  });

  it('will delete a feature', async () => {
    await features.save(TestData);
    await feature.delete();
    const deletedFeature = await features.findOneBy({ id: TestData.id });
    expect(deletedFeature).toBeNull();
  });
});
