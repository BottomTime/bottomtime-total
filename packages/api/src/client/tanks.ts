import { AxiosInstance } from 'axios';

import {
  CreateOrUpdateTankParamsDTO,
  ListTanksResponseDTO,
  TankDTO,
  TankSchema,
} from '../types';
import { Tank } from './tank';

export class TanksApiClient {
  constructor(
    private readonly apiClient: AxiosInstance,
    private readonly username?: string,
  ) {}

  private getUrl(): string {
    return this.username
      ? `/api/users/${this.username}/tanks`
      : `/api/admin/tanks`;
  }

  async listTanks(
    includeSystem = true,
  ): Promise<{ tanks: Tank[]; totalCount: number }> {
    const url = this.getUrl();
    const { data } = await this.apiClient.get<ListTanksResponseDTO>(url, {
      params: {
        includeSystem: this.username ? includeSystem : undefined,
      },
    });

    return {
      tanks: data.tanks.map(
        (dto) => new Tank(this.apiClient, this.username, dto),
      ),
      totalCount: data.totalCount,
    };
  }

  async getTank(id: string): Promise<Tank> {
    const url = `${this.getUrl()}/${id}`;
    const { data } = await this.apiClient.get<TankDTO>(url);
    return this.wrapDTO(data);
  }

  async createTank(options: CreateOrUpdateTankParamsDTO): Promise<Tank> {
    const { data } = await this.apiClient.post<TankDTO>(this.getUrl(), options);
    return this.wrapDTO(data);
  }

  wrapDTO(data: unknown): Tank {
    return new Tank(this.apiClient, this.username, TankSchema.parse(data));
  }
}
