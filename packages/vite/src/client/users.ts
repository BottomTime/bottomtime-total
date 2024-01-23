import { CurrentUserDTO } from '@bottomtime/api';
import { AxiosInstance } from 'axios';

export class UsersApiClient {
  constructor(private readonly apiClient: AxiosInstance) {}

  async getCurrentUser(): Promise<CurrentUserDTO> {
    const { data } = await this.apiClient.get<CurrentUserDTO>('/auth/me');
    return data;
  }
}
