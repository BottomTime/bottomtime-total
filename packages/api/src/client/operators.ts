import {
  ApiList,
  CreateOrUpdateOperatorDTO,
  OperatorSchema,
  SearchOperatorsParams,
  SearchOperatorsResponseSchema,
} from '../types';
import { Fetcher } from './fetcher';
import { Operator } from './operator';

export class OperatorsApiClient {
  constructor(private readonly apiClient: Fetcher) {}

  async createOperator(options: CreateOrUpdateOperatorDTO): Promise<Operator> {
    const { data } = await this.apiClient.post(
      '/api/operators',
      options,
      OperatorSchema,
    );
    return new Operator(this.apiClient, data);
  }

  async isSlugAvailable(key: string): Promise<boolean> {
    const status = await this.apiClient.head(`/api/operators/${key}`);
    return status === 404;
  }

  async getOperator(key: string): Promise<Operator> {
    const { data } = await this.apiClient.get(
      `/api/operators/${key}`,
      undefined,
      OperatorSchema,
    );
    return new Operator(this.apiClient, data);
  }

  async searchOperators(
    options?: SearchOperatorsParams,
  ): Promise<ApiList<Operator>> {
    const { data: results } = await this.apiClient.get(
      '/api/operators',
      {
        ...options,
        ...(options?.location
          ? {
              location: `${options.location.lat},${options.location.lon}`,
            }
          : {}),
      },
      SearchOperatorsResponseSchema,
    );

    return {
      data: results.data.map((dto) => new Operator(this.apiClient, dto)),
      totalCount: results.totalCount,
    };
  }

  wrapDTO(dto: unknown): Operator {
    return new Operator(this.apiClient, OperatorSchema.parse(dto));
  }
}
