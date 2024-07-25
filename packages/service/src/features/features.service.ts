import { CreateOrUpdateFeatureDTO } from '@bottomtime/api';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { FeatureEntity } from '../data';
import { Feature } from './feature';

export type CreateFeatureOptions = CreateOrUpdateFeatureDTO & {
  key: string;
};

@Injectable()
export class FeaturesService {
  constructor(
    @InjectRepository(FeatureEntity)
    private readonly features: Repository<FeatureEntity>,
  ) {}

  async listFeatures(): Promise<Feature[]> {
    const data = await this.features.find({ order: { name: 'ASC' } });
    return data.map((feature) => new Feature(this.features, feature));
  }

  async getFeature(key: string): Promise<Feature | undefined> {
    const data = await this.features.findOneBy({ key });
    return data ? new Feature(this.features, data) : undefined;
  }

  async featureExists(key: string): Promise<boolean> {
    return await this.features.existsBy({ key });
  }

  async createFeature(options: CreateFeatureOptions): Promise<Feature> {
    const data = new FeatureEntity();
    data.id = uuid();
    data.key = options.key;

    const feature = new Feature(this.features, data);
    feature.name = options.name;
    feature.description = options.description;
    feature.enabled = options.enabled ?? false;

    await feature.save();
    return feature;
  }
}
