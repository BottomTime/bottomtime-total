import { AxiosInstance } from 'axios';

import {
  CreateOrUpdateTankParamsDTO,
  ListTanksResponseSchema,
  TankSchema,
} from '../types';
import { Tank } from './tank';

type ListTanksOptions = { username?: string; includeSystem?: boolean };

export class TanksApiClient {
  constructor(private readonly apiClient: AxiosInstance) {}

  private getUrl(username?: string): string {
    return username ? `/api/users/${username}/tanks` : '/api/admin/tanks';
  }

  async createTank(
    options: CreateOrUpdateTankParamsDTO,
    username?: string,
  ): Promise<Tank> {
    const { data } = await this.apiClient.post(this.getUrl(username), options);
    return new Tank(this.apiClient, TankSchema.parse(data), username);
  }

  async getTank(tankId: string, username?: string): Promise<Tank> {
    const { data } = await this.apiClient.get(
      `${this.getUrl(username)}/${tankId}`,
    );
    return new Tank(this.apiClient, TankSchema.parse(data), username);
  }

  async listTanks(
    options?: ListTanksOptions,
  ): Promise<{ tanks: Tank[]; totalCount: number }> {
    const { data } = await this.apiClient.get(this.getUrl(options?.username), {
      params: options?.username
        ? { includeSystem: options?.includeSystem }
        : undefined,
    });

    const result = ListTanksResponseSchema.parse(data);
    return {
      tanks: result.tanks.map(
        (tank) =>
          new Tank(
            this.apiClient,
            tank,
            tank.isSystem ? undefined : options?.username,
          ),
      ),
      totalCount: result.totalCount,
    };
  }

  wrapDTO(tank: unknown, username?: string): Tank {
    return new Tank(this.apiClient, TankSchema.parse(tank), username);
  }
}
