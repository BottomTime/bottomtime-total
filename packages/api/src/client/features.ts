import { CreateOrUpdateFeatureDTO, FeatureSchema } from '../types';
import { HttpException } from './errors';
import { Feature } from './feature';
import { Fetcher } from './fetcher';

export class FeaturesApiClient {
  constructor(private readonly apiClient: Fetcher) {}

  async featureExists(key: string): Promise<boolean> {
    const status = await this.apiClient.head(`/api/features/${key}`);
    return status === 200;
  }

  async getFeature(key: string): Promise<Feature> {
    const { data } = await this.apiClient.get(
      `/api/features/${key}`,
      undefined,
      FeatureSchema,
    );

    return new Feature(this.apiClient, data);
  }

  async createFeature(key: string, options: CreateOrUpdateFeatureDTO) {
    const exists = await this.featureExists(key);
    if (exists) {
      throw new HttpException(409, 'Conflict', 'Feature flag already exists', {
        message: 'Feature flag already exists',
        method: 'PUT',
        path: `/api/features/${key}`,
        status: 409,
      });
    }

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
