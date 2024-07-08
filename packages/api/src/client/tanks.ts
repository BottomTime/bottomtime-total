import {
  CreateOrUpdateTankParamsDTO,
  ListTanksResponseSchema,
  TankSchema,
} from '../types';
import { Fetcher } from './fetcher';
import { Tank } from './tank';

type ListTanksOptions = { username?: string; includeSystem?: boolean };

export class TanksApiClient {
  constructor(private readonly apiClient: Fetcher) {}

  private getUrl(username?: string): string {
    return username ? `/api/users/${username}/tanks` : '/api/admin/tanks';
  }

  async createTank(
    options: CreateOrUpdateTankParamsDTO,
    username?: string,
  ): Promise<Tank> {
    const { data } = await this.apiClient.post(
      this.getUrl(username),
      options,
      TankSchema,
    );
    return new Tank(this.apiClient, data, username);
  }

  async getTank(tankId: string, username?: string): Promise<Tank> {
    const { data } = await this.apiClient.get(
      `${this.getUrl(username)}/${tankId}`,
      undefined,
      TankSchema,
    );
    return new Tank(this.apiClient, data, username);
  }

  async listTanks(
    options?: ListTanksOptions,
  ): Promise<{ tanks: Tank[]; totalCount: number }> {
    const { data: result } = await this.apiClient.get(
      this.getUrl(options?.username),
      options?.username ? { includeSystem: options?.includeSystem } : undefined,
      ListTanksResponseSchema,
    );

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
