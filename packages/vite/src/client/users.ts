import { CurrentUserDTO, UserDTO } from '@bottomtime/api';
import { AxiosInstance } from 'axios';
import { User } from './user';

export class UsersApiClient {
  constructor(private readonly apiClient: AxiosInstance) {}

  async getCurrentUser(): Promise<User | null> {
    const { data } = await this.apiClient.get<CurrentUserDTO>('/api/auth/me');

    if (data.anonymous) {
      return null;
    } else {
      return new User(data as UserDTO);
    }
  }

  async login(usernameOrEmail: string, password: string): Promise<User> {
    const { data } = await this.apiClient.post<UserDTO>('/api/auth/login', {
      usernameOrEmail,
      password,
    });
    return new User(data);
  }
}
