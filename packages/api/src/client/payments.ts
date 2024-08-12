import {
  CreatePaymentSessionDTO,
  CreatePaymentSessionResponseDTO,
  CreatePaymentSessionResponseSchema,
} from '../types';
import { Fetcher } from './fetcher';

export class PaymentsApiClient {
  constructor(private readonly fetcher: Fetcher) {}

  async createSession(
    options: CreatePaymentSessionDTO,
  ): Promise<CreatePaymentSessionResponseDTO> {
    const { data } = await this.fetcher.post(
      '/api/payments/session',
      options,
      CreatePaymentSessionResponseSchema,
    );
    return data;
  }
}
