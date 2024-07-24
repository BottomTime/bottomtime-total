import { Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Repository } from 'typeorm';

import { FeatureEntity } from '../../../src/data';
import { Feature, FeaturesModule, InjectFeature } from '../../../src/features';
import { dataSource, postgresConfig } from '../../data-source';

const Key = 'test_flag';

@Injectable()
class TestService {
  constructor(@InjectFeature(Key) private readonly feature: Feature) {}

  getEnabled(): boolean {
    return this.feature.enabled;
  }
}

const TestData: FeatureEntity = {
  id: '30bbb1dc-416d-4063-a60f-0a2841ac317e',
  createdAt: new Date(),
  updatedAt: new Date(),
  key: Key,
  name: 'Test Flag',
  description: null,
  enabled: true,
};

describe('Feature consumption', () => {
  let features: Repository<FeatureEntity>;

  beforeAll(() => {
    features = dataSource.getRepository(FeatureEntity);
  });

  beforeEach(async () => {
    await features.save(TestData);
    const blah = await features.findOneByOrFail({ key: Key });
    console.log('inserted', blah);
  });

  it('will inject a feature flag', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRootAsync({
          useFactory: () => postgresConfig,
        }),
        FeaturesModule.forFeature(Key),
      ],
      providers: [TestService],
    }).compile();

    const service = moduleRef.get<TestService>(TestService);
    expect(service.getEnabled()).toBe(true);
  });
});
