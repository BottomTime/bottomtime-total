import {
  ApiList,
  AttachDiveSitesResponseSchema,
  CreateOrUpdateOperatorDTO,
  CreateOrUpdateOperatorSchema,
  CreateOrUpdateTeamMemberDTO,
  DiveSiteDTO,
  ImageBoundaryDTO,
  ListAvatarURLsResponseDTO,
  ListTeamMembersResponseSchema,
  OperatorDTO,
  OperatorSchema,
  RemoveDiveSitesResponseSchema,
  SearchDiveSitesResponseSchema,
  SearchOperatorsParams,
  SearchOperatorsResponseSchema,
  SuccessCountSchema,
  TeamMemberDTO,
  TeamMemberSchema,
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
      updatedAt: Date.now(),
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
      updatedAt: Date.now(),
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

  async listDiveSites(operatorSlug: string): Promise<ApiList<DiveSiteDTO>> {
    const { data } = await this.apiClient.get(
      `/api/operators/${operatorSlug}/sites`,
      {},
      SearchDiveSitesResponseSchema,
    );
    return data;
  }

  async addDiveSites(operatorSlug: string, siteIds: string[]): Promise<number> {
    const { data } = await this.apiClient.post(
      `/api/operators/${operatorSlug}/sites`,
      { siteIds },
      AttachDiveSitesResponseSchema,
    );
    return data.attached;
  }

  async removeDiveSites(
    operatorSlug: string,
    siteIds: string[],
  ): Promise<number> {
    const { data } = await this.apiClient.delete(
      `/api/operators/${operatorSlug}/sites`,
      { siteIds },
      RemoveDiveSitesResponseSchema,
    );
    return data.removed;
  }

  async listTeamMembers(operatorSlug: string): Promise<ApiList<TeamMemberDTO>> {
    const { data } = await this.apiClient.get(
      `/api/operators/${operatorSlug}/team`,
      undefined,
      ListTeamMembersResponseSchema,
    );
    return data;
  }

  async addOrUpdateTeamMember(
    operatorSlug: string,
    teamMember: string,
    options: CreateOrUpdateTeamMemberDTO,
  ): Promise<TeamMemberDTO> {
    const { data } = await this.apiClient.put(
      `/api/operators/${operatorSlug}/team/${teamMember}`,
      options,
      TeamMemberSchema,
    );
    return data;
  }

  async removeTeamMembers(
    operatorSlug: string,
    teamMembers: string | string[],
  ): Promise<number> {
    if (typeof teamMembers === 'string') teamMembers = [teamMembers];
    const { data } = await this.apiClient.delete(
      `/api/operators/${operatorSlug}/team`,
      teamMembers,
      SuccessCountSchema,
    );
    return data.succeeded;
  }
}
