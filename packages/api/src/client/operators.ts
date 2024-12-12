import {
  ApiList,
  CreateOrUpdateOperatorDTO,
  CreateOrUpdateOperatorSchema,
  ImageBoundaryDTO,
  ListAvatarURLsResponseDTO,
  OperatorDTO,
  OperatorSchema,
  SearchOperatorsParams,
  SearchOperatorsResponseSchema,
  VerificationStatus,
} from '../types';
import { Fetcher } from './fetcher';

export class OperatorsApiClient {
  constructor(private readonly apiClient: Fetcher) {}

  async createOperator(
    options: CreateOrUpdateOperatorDTO,
  ): Promise<OperatorDTO> {
    const { data } = await this.apiClient.post(
      '/api/operators',
      options,
      OperatorSchema,
    );
    return data;
  }

  async isSlugAvailable(key: string): Promise<boolean> {
    const status = await this.apiClient.head(`/api/operators/${key}`);
    return status === 404;
  }

  async getOperator(key: string): Promise<OperatorDTO> {
    const { data } = await this.apiClient.get(
      `/api/operators/${key}`,
      undefined,
      OperatorSchema,
    );
    return data;
  }

  async searchOperators(
    options?: SearchOperatorsParams,
  ): Promise<ApiList<OperatorDTO>> {
    const { data: results } = await this.apiClient.get(
      '/api/operators',
      {
        ...options,
        ...(options?.location
          ? {
              location: `${options.location.lat},${options.location.lon}`,
            }
          : {}),
      },
      SearchOperatorsResponseSchema,
    );

    return results;
  }

  async updateOperator(data: OperatorDTO, newSlug?: string): Promise<void> {
    await this.apiClient.put(
      `/api/operators/${data.slug}`,
      CreateOrUpdateOperatorSchema.parse({
        ...data,
        slug: newSlug ?? data.slug,
      }),
      OperatorSchema,
    );

    if (newSlug) {
      data.slug = newSlug;
    }

    data.updatedAt = new Date();
  }

  async delete(operatorSlug: string): Promise<void> {
    await this.apiClient.delete(`/api/operators/${operatorSlug}`);
  }

  async transferOwnership(
    operator: OperatorDTO,
    newOwner: string,
  ): Promise<void> {
    const { data } = await this.apiClient.post(
      `/api/operators/${operator.slug}/transfer`,
      { newOwner },
      OperatorSchema,
    );

    operator.updatedAt = data.updatedAt;
    operator.owner = data.owner;
  }

  async requestVerification(operator: OperatorDTO): Promise<void> {
    await this.apiClient.post(
      `/api/operators/${operator.slug}/requestVerification`,
    );
    operator.verificationStatus = VerificationStatus.Pending;
    operator.updatedAt = new Date();
  }

  async setVerified(
    operator: OperatorDTO,
    verified: boolean,
    message?: string,
  ): Promise<void> {
    await this.apiClient.post(`/api/operators/${operator.slug}/verify`, {
      verified,
      message,
    });
    operator.verificationStatus = verified
      ? VerificationStatus.Verified
      : VerificationStatus.Rejected;
    operator.verificationMessage = message;
    operator.updatedAt = new Date();
  }

  async uploadLogo(
    operator: OperatorDTO,
    logo: File,
    region?: ImageBoundaryDTO,
  ): Promise<ListAvatarURLsResponseDTO> {
    const formData = new FormData();
    formData.append('logo', logo);

    if (region && 'left' in region) {
      formData.append('left', region.left.toString());
      formData.append('top', region.top.toString());
      formData.append('width', region.width.toString());
      formData.append('height', region.height.toString());
    }

    const { data } =
      await this.apiClient.postFormData<ListAvatarURLsResponseDTO>(
        `/api/operators/${operator.slug}/logo`,
        formData,
      );

    return data;
  }

  async deleteLogo(operatorSlug: string): Promise<void> {
    await this.apiClient.delete(`/api/operators/${operatorSlug}/logo`);
  }
}
