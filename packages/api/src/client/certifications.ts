import {
  AgencyDTO,
  ApiList,
  CreateOrUpdateProfessionalAssociationParamsDTO,
  ListAgenciesResponseSchema,
  ListProfessionalAssociationsResponseSchema,
  ProfessionalAssociationDTO,
  ProfessionalAssociationSchema,
} from '../types';
import { Fetcher } from './fetcher';

export class CertificationsApiClient {
  constructor(private readonly apiClient: Fetcher) {}

  async listAgencies(): Promise<ApiList<AgencyDTO>> {
    const { data } = await this.apiClient.get(
      '/api/agencies',
      undefined,
      ListAgenciesResponseSchema,
    );
    return data;
  }

  async listProfessionalAssociations(
    username: string,
  ): Promise<ApiList<ProfessionalAssociationDTO>> {
    const { data } = await this.apiClient.get(
      `/api/users/${username}/professionalAssociations`,
      undefined,
      ListProfessionalAssociationsResponseSchema,
    );
    return data;
  }

  async createProfessionalAssociation(
    username: string,
    options: CreateOrUpdateProfessionalAssociationParamsDTO,
  ): Promise<ProfessionalAssociationDTO> {
    const { data } = await this.apiClient.post(
      `/api/users/${username}/professionalAssociations`,
      options,
      ProfessionalAssociationSchema,
    );
    return data;
  }

  async updateProfessionalAssociation(
    username: string,
    associationId: string,
    options: CreateOrUpdateProfessionalAssociationParamsDTO,
  ): Promise<ProfessionalAssociationDTO> {
    const { data } = await this.apiClient.put(
      `/api/users/${username}/professionalAssociations/${associationId}`,
      options,
      ProfessionalAssociationSchema,
    );
    return data;
  }

  async deleteProfessionalAssociation(
    username: string,
    associationId: string,
  ): Promise<void> {
    await this.apiClient.delete(
      `/api/users/${username}/professionalAssociations/${associationId}`,
    );
  }
}
