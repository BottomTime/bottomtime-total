import {
  AccountTier,
  CreatePaymentSessionResponseDTO,
  CreatePaymentSessionResponseSchema,
  MembershipStatusDTO,
  MembershipStatusSchema,
} from '../types';
import { Fetcher } from './fetcher';

export class PaymentsApiClient {
  constructor(private readonly fetcher: Fetcher) {}

  async cancelMembership(username: string): Promise<void> {
    await this.fetcher.delete(`/api/payments/membership/${username}`);
  }

  async createMemberhsip(
    username: string,
    newAccountTier: AccountTier,
  ): Promise<MembershipStatusDTO> {
    const { data } = await this.fetcher.put(
      `/api/payments/membership/${username}`,
      {
        newAccountTier,
      },
      MembershipStatusSchema,
    );
    return data;
  }

  async createSession(): Promise<CreatePaymentSessionResponseDTO> {
    const { data } = await this.fetcher.post(
      '/api/payments/session',
      undefined,
      CreatePaymentSessionResponseSchema,
    );
    return data;
  }

  async getMembershipStatus(username: string): Promise<MembershipStatusDTO> {
    const { data } = await this.fetcher.get(
      `/api/payments/membership/${username}`,
      undefined,
      MembershipStatusSchema,
    );

    return data;
  }
}
