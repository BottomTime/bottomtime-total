import {
  CreatePaymentSessionResponseDTO,
  CreatePaymentSessionResponseSchema,
  MembershipStatusDTO,
  MembershipStatusSchema,
} from '../types';
import { Fetcher } from './fetcher';

export class PaymentsApiClient {
  constructor(private readonly fetcher: Fetcher) {}

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
