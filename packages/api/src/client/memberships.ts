import {
  AccountTier,
  ListMembershipsResponseDTO,
  ListMembershipsResponseSchema,
  MembershipStatusDTO,
  MembershipStatusSchema,
  PaymentSessionDTO,
  PaymentSessionSchema,
} from '../types';
import { Fetcher } from './fetcher';

export class MembershipsApiClient {
  constructor(private readonly fetcher: Fetcher) {}

  async listMemberships(): Promise<ListMembershipsResponseDTO> {
    const { data } = await this.fetcher.get(
      '/api/membership',
      undefined,
      ListMembershipsResponseSchema,
    );
    return data;
  }

  async cancelMembership(username: string): Promise<void> {
    await this.fetcher.delete(`/api/membership/${username}`);
  }

  async updateMembership(
    username: string,
    newAccountTier: AccountTier,
  ): Promise<MembershipStatusDTO> {
    const { data } = await this.fetcher.put(
      `/api/membership/${username}`,
      {
        newAccountTier,
      },
      MembershipStatusSchema,
    );
    return data;
  }

  async createSession(username: string): Promise<PaymentSessionDTO> {
    const { data } = await this.fetcher.post(
      `/api/membership/${username}/session`,
      undefined,
      PaymentSessionSchema,
    );
    return data;
  }

  async getMembershipStatus(username: string): Promise<MembershipStatusDTO> {
    const { data } = await this.fetcher.get(
      `/api/membership/${username}`,
      undefined,
      MembershipStatusSchema,
    );

    return data;
  }
}
