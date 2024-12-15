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

  async updateOperator(
    operatorSlug: string,
    update: CreateOrUpdateOperatorDTO,
  ): Promise<OperatorDTO> {
    const { data } = await this.apiClient.put<OperatorDTO>(
      `/api/operators/${operatorSlug}`,
      CreateOrUpdateOperatorSchema.parse(update),
      OperatorSchema,
    );
    return data;
  }

  async deleteOperator(operatorSlug: string): Promise<void> {
    await this.apiClient.delete(`/api/operators/${operatorSlug}`);
  }

  async transferOwnership(
    operator: OperatorDTO,
    newOwner: string,
  ): Promise<OperatorDTO> {
    const { data } = await this.apiClient.post(
      `/api/operators/${operator.slug}/transfer`,
      { newOwner },
      OperatorSchema,
    );

    return {
      ...operator,
      updatedAt: data.updatedAt,
      owner: data.owner,
    };
  }

  async requestVerification(operator: OperatorDTO): Promise<OperatorDTO> {
    await this.apiClient.post(
      `/api/operators/${operator.slug}/requestVerification`,
    );
    return {
      ...operator,
      verificationStatus: VerificationStatus.Pending,
      updatedAt: new Date(),
    };
  }

  async setVerified(
    operator: OperatorDTO,
    verified: boolean,
    message?: string,
  ): Promise<OperatorDTO> {
    await this.apiClient.post(`/api/operators/${operator.slug}/verify`, {
      verified,
      message,
    });
    return {
      ...operator,
      verificationStatus: verified
        ? VerificationStatus.Verified
        : VerificationStatus.Rejected,
      verificationMessage: message,
      updatedAt: new Date(),
    };
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
