import { Repository } from 'typeorm';

import { FeatureEntity } from '../../../src/data';
import { CreateFeatureOptions, FeaturesService } from '../../../src/features';
import { dataSource } from '../../data-source';

const TestData: FeatureEntity[] = [
  {
    id: '3db66852-686e-4212-920f-f1475e7e0e58',
    createdAt: new Date('2021-01-01T00:00:00.000Z'),
    updatedAt: new Date('2021-01-01T00:00:00.000Z'),
    key: 'awesome_feature',
    name: 'Latest Awesome Thing',
    description: 'This is a test feature',
    enabled: true,
  },
  {
    id: 'fe52ca62-235a-445c-91fb-e37798e67180',
    createdAt: new Date('2021-01-01T00:00:00.000Z'),
    updatedAt: new Date('2021-01-01T00:00:00.000Z'),
    key: 'secret_feature',
    name: 'Top Secret Feature',
    description: 'Shhh! No one is supposed to know about this',
    enabled: false,
  },
  {
    id: '879ef106-98cf-48b0-922f-a7dd4ee43945',
    createdAt: new Date('2021-01-01T00:00:00.000Z'),
    updatedAt: new Date('2021-01-01T00:00:00.000Z'),
    key: 'old_feature',
    name: 'Old and Busted',
    description: 'This is a test feature',
    enabled: false,
  },
];

describe('Features service', () => {
  let features: Repository<FeatureEntity>;
  let service: FeaturesService;

  beforeAll(() => {
    features = dataSource.getRepository(FeatureEntity);
    service = new FeaturesService(features);
  });

  beforeEach(async () => {
    await features.save(TestData);
  });

  it('will indicate if a feature exists', async () => {
    await expect(service.featureExists(TestData[0].key)).resolves.toBe(true);
  });

  it('will indicate if a feature does not exist', async () => {
    await expect(service.featureExists('not_a_feature')).resolves.toBe(false);
  });

  it('will list all features', async () => {
    const list = await service.listFeatures();
    expect(list).toHaveLength(TestData.length);
    expect(list).toMatchSnapshot();
  });

  it('will return an empty list if no features are found', async () => {
    await features.delete({});
    await expect(service.listFeatures()).resolves.toEqual([]);
  });

  it('will get a single feature by key', async () => {
    const feature = await service.getFeature(TestData[1].key);
    expect(feature).toBeDefined();
    expect(feature!.key).toBe(TestData[1].key);
    expect(feature!.name).toBe(TestData[1].name);
    expect(feature!.description).toBe(TestData[1].description);
    expect(feature!.enabled).toBe(TestData[1].enabled);
  });

  it('will return undefined if feature key is not found', async () => {
    await expect(service.getFeature('not_a_feature')).resolves.toBeUndefined();
  });

  it('will create a new feature with all options set', async () => {
    const options: CreateFeatureOptions = {
      key: 'new_bestest_feature',
      name: 'Brand New Feature',
      description: 'OMG! I hope this feature works!!',
      enabled: true,
    };

    const feature = await service.createFeature(options);
    expect(feature.key).toBe(options.key);
    expect(feature.name).toBe(options.name);
    expect(feature.description).toBe(options.description);
    expect(feature.enabled).toBe(options.enabled);

    const savedFeature = await features.findOneByOrFail({ key: options.key });
    expect(savedFeature).toEqual({
      ...options,
      id: savedFeature.id,
      createdAt: feature.createdAt,
      updatedAt: feature.updatedAt,
    });
  });

  it('will create a new feature with default options', async () => {
    const options: CreateFeatureOptions = {
      key: 'new_bestest_feature',
      name: 'Brand New Feature',
      enabled: false,
    };

    const feature = await service.createFeature(options);
    expect(feature.key).toBe(options.key);
    expect(feature.name).toBe(options.name);
    expect(feature.description).toBeUndefined();
    expect(feature.enabled).toBe(false);

    const savedFeature = await features.findOneByOrFail({ key: options.key });
    expect(savedFeature).toEqual({
      ...options,
      id: savedFeature.id,
      createdAt: feature.createdAt,
      updatedAt: feature.updatedAt,
      description: null,
      enabled: false,
    });
  });
});
