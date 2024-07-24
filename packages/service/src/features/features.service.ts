import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { FeatureEntity } from '../data';
import { Feature } from './feature';
import { CreateFeatureOptions } from './types';

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
    console.log(key, data);
    return data ? new Feature(this.features, data) : undefined;
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
