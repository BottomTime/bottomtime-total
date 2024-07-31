import {
  CreateOrUpdateDiveOperatorDTO,
  DiveOperatorSchema,
  SearchDiveOperatorsParams,
  SearchDiveOperatorsResponseDTO,
  SearchDiveOperatorsResponseSchema,
} from '../types';
import { DiveOperator } from './dive-operator';
import { Fetcher } from './fetcher';

export class DiveOperatorsApiClient {
  constructor(private readonly apiClient: Fetcher) {}

  async createDiveOperator(
    options: CreateOrUpdateDiveOperatorDTO,
  ): Promise<DiveOperator> {
    const { data } = await this.apiClient.post(
      '/api/operators',
      options,
      DiveOperatorSchema,
    );
    return new DiveOperator(this.apiClient, data);
  }

  async getDiveOperator(key: string): Promise<DiveOperator> {
    const { data } = await this.apiClient.get(
      `/api/operators/${key}`,
      undefined,
      DiveOperatorSchema,
    );
    return new DiveOperator(this.apiClient, data);
  }

  async searchDiveOperators(
    options?: SearchDiveOperatorsParams,
  ): Promise<SearchDiveOperatorsResponseDTO> {
    const { data } = await this.apiClient.get(
      '/api/operators',
      {
        ...options,
        ...(options?.location
          ? {
              location: `${options.location.lat},${options.location.lon}`,
            }
          : {}),
      },
      SearchDiveOperatorsResponseSchema,
    );

    return data;
  }

  wrapDTO(dto: unknown): DiveOperator {
    return new DiveOperator(this.apiClient, DiveOperatorSchema.parse(dto));
  }
}
