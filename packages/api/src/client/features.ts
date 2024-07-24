import { FeatureSchema } from '../types';
import { Feature } from './feature';
import { Fetcher } from './fetcher';

export class FeaturesApiClient {
  constructor(private readonly apiClient: Fetcher) {}

  async getFeature() {}

  async createFeature() {}

  async listFeatures() {}

  wrapDTO(data: unknown) {
    return new Feature(this.apiClient, FeatureSchema.parse(data));
  }
}
