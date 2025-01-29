import {
  ApiList,
  CreateOrUpdateOperatorReviewDTO,
  CreateOrUpdateOperatorReviewSchema,
  ListOperatorReviewsParams,
  ListOperatorReviewsResponseSchema,
  OperatorReviewDTO,
  OperatorReviewSchema,
} from '../types';
import { Fetcher } from './fetcher';

export class OperatorReviewsApiClient {
  constructor(private readonly apiClient: Fetcher) {}

  private getUrl(operatorKey: string, reviewId?: string): string {
    let url = `/api/operators/${operatorKey}/reviews`;
    if (reviewId) url = `${url}/${reviewId}`;
    return url;
  }

  async listReviews(
    operatorKey: string,
    options: ListOperatorReviewsParams = {},
  ): Promise<ApiList<OperatorReviewDTO>> {
    const { data } = await this.apiClient.get(
      this.getUrl(operatorKey),
      options,
      ListOperatorReviewsResponseSchema,
    );
    return data;
  }

  async getReview(
    operatorKey: string,
    reviewId: string,
  ): Promise<OperatorReviewDTO> {
    const { data } = await this.apiClient.get(
      this.getUrl(operatorKey, reviewId),
      undefined,
      OperatorReviewSchema,
    );
    return data;
  }

  async createReview(
    operatorKey: string,
    review: CreateOrUpdateOperatorReviewDTO,
  ): Promise<OperatorReviewDTO> {
    const { data } = await this.apiClient.post(
      this.getUrl(operatorKey),
      CreateOrUpdateOperatorReviewSchema.parse(review),
      OperatorReviewSchema,
    );
    return data;
  }

  async updateReview(
    operatorKey: string,
    reviewId: string,
    update: CreateOrUpdateOperatorReviewDTO,
  ): Promise<OperatorReviewDTO> {
    const { data } = await this.apiClient.put(
      this.getUrl(operatorKey, reviewId),
      CreateOrUpdateOperatorReviewSchema.parse(update),
      OperatorReviewSchema,
    );
    return data;
  }

  async deleteReview(operatorKey: string, reviewId: string): Promise<void> {
    await this.apiClient.delete(this.getUrl(operatorKey, reviewId));
  }
}
