import {
  CreateOrUpdateDiveOperatorDTO,
  DiveOperatorSchema,
  SearchDiveOperatorsParams,
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

  async isSlugAvailable(key: string): Promise<boolean> {
    const status = await this.apiClient.head(`/api/operators/${key}`);
    return status === 404;
  }

  async getDiveOperator(key: string): Promise<DiveOperator> {
    const { data } = await this.apiClient.get(
      `/api/operators/${key}`,
      undefined,
      DiveOperatorSchema,
    );
    return new DiveOperator(this.apiClient, data);
  }

  async searchDiveOperators(options?: SearchDiveOperatorsParams): Promise<{
    operators: DiveOperator[];
    totalCount: number;
  }> {
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

    return {
      operators: data.operators.map(
        (dto) => new DiveOperator(this.apiClient, dto),
      ),
      totalCount: data.totalCount,
    };
  }

  wrapDTO(dto: unknown): DiveOperator {
    return new DiveOperator(this.apiClient, DiveOperatorSchema.parse(dto));
  }
}
