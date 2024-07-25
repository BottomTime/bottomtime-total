import { CreateOrUpdateFeatureDTO, FeatureDTO, FeatureSchema } from '../types';
import { Feature } from './feature';
import { Fetcher } from './fetcher';

export class FeaturesApiClient {
  constructor(private readonly apiClient: Fetcher) {}

  async getFeature(key: string): Promise<Feature> {
    const { data } = await this.apiClient.get(
      `/api/features/${key}`,
      undefined,
      FeatureSchema,
    );

    return new Feature(this.apiClient, data);
  }

  async createFeature(key: string, options: CreateOrUpdateFeatureDTO) {
    const { data } = await this.apiClient.put(
      `/api/features/${key}`,
      options,
      FeatureSchema,
    );
    return new Feature(this.apiClient, data);
  }

  async listFeatures(): Promise<Feature[]> {
    const { data } = await this.apiClient.get(
      '/api/features',
      undefined,
      FeatureSchema.array(),
    );
    return data.map((feature) => new Feature(this.apiClient, feature));
  }

  wrapDTO(data: unknown) {
    return new Feature(this.apiClient, FeatureSchema.parse(data));
  }
}
