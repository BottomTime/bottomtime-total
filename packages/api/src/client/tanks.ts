import {
  ApiList,
  CreateOrUpdateTankParamsDTO,
  CreateOrUpdateTankParamsSchema,
  ListTanksResponseSchema,
  TankDTO,
  TankSchema,
} from '../types';
import { Fetcher } from './fetcher';

type ListTanksOptions = { username?: string; includeSystem?: boolean };

export class TanksApiClient {
  constructor(private readonly apiClient: Fetcher) {}

  private getUrl(username?: string): string {
    return username ? `/api/users/${username}/tanks` : '/api/admin/tanks';
  }

  private getTankUrl(tankId: string, ownerUsername?: string): string {
    return ownerUsername
      ? `/api/users/${ownerUsername}/tanks/${tankId}`
      : `/api/admin/tanks/${tankId}`;
  }

  async createTank(
    options: CreateOrUpdateTankParamsDTO,
    username?: string,
  ): Promise<TankDTO> {
    const { data } = await this.apiClient.post(
      this.getUrl(username),
      options,
      TankSchema,
    );
    return data;
  }

  async getTank(tankId: string, username?: string): Promise<TankDTO> {
    const { data } = await this.apiClient.get(
      `${this.getUrl(username)}/${tankId}`,
      undefined,
      TankSchema,
    );
    return data;
  }

  async listTanks(options?: ListTanksOptions): Promise<ApiList<TankDTO>> {
    const { data: results } = await this.apiClient.get(
      this.getUrl(options?.username),
      options?.username ? { includeSystem: options?.includeSystem } : undefined,
      ListTanksResponseSchema,
    );
    return results;
  }

  async updateTank(tank: TankDTO, ownerUsername?: string): Promise<void> {
    await this.apiClient.put<TankDTO>(
      this.getTankUrl(tank.id, ownerUsername),
      CreateOrUpdateTankParamsSchema.parse(tank),
    );
  }

  async deleteTank(tankId: string, ownerUsername?: string): Promise<void> {
    await this.apiClient.delete(this.getTankUrl(tankId, ownerUsername));
  }
}
