import {
  ApiList,
  CreateOrUpdateDiveSiteReviewDTO,
  CreateOrUpdateDiveSiteReviewSchema,
  DiveSiteReviewDTO,
  DiveSiteReviewSchema,
  ListDiveSiteReviewsParamsDTO,
  ListDiveSiteReviewsParamsSchema,
  ListDiveSiteReviewsResponseSchema,
} from '../types';
import { Fetcher } from './fetcher';

export class DiveSiteReviewsApiClient {
  constructor(private readonly client: Fetcher) {}

  private getUrl(siteId: string, reviewId?: string): string {
    const url = `/api/diveSites/${siteId}/reviews`;
    return reviewId ? `${url}/${reviewId}` : url;
  }

  async listReviews(
    siteId: string,
    options: ListDiveSiteReviewsParamsDTO = {},
  ): Promise<ApiList<DiveSiteReviewDTO>> {
    const { data } = await this.client.get(
      this.getUrl(siteId),
      ListDiveSiteReviewsParamsSchema.parse(options),
      ListDiveSiteReviewsResponseSchema,
    );
    return data;
  }

  async getReview(
    siteId: string,
    reviewId: string,
  ): Promise<DiveSiteReviewDTO> {
    const { data } = await this.client.get(
      this.getUrl(siteId, reviewId),
      undefined,
      DiveSiteReviewSchema,
    );
    return data;
  }

  async createReview(
    siteId: string,
    review: CreateOrUpdateDiveSiteReviewDTO,
  ): Promise<DiveSiteReviewDTO> {
    const { data } = await this.client.post(
      this.getUrl(siteId),
      CreateOrUpdateDiveSiteReviewSchema.parse(review),
      DiveSiteReviewSchema,
    );
    return data;
  }

  async updateReview(
    siteId: string,
    reviewId: string,
    review: CreateOrUpdateDiveSiteReviewDTO,
  ): Promise<DiveSiteReviewDTO> {
    const { data } = await this.client.put(
      this.getUrl(siteId, reviewId),
      CreateOrUpdateDiveSiteReviewSchema.parse(review),
      DiveSiteReviewSchema,
    );
    return data;
  }

  async deleteReview(siteId: string, reviewId: string): Promise<void> {
    await this.client.delete(this.getUrl(siteId, reviewId));
  }
}
