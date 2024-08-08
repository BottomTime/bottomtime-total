import {
  CreatePaymentSessionResponseDTO,
  CreatePaymentSessionResponseSchema,
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
}
