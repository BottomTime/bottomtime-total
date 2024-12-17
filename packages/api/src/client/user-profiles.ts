import { z } from 'zod';

import {
  ApiList,
  ImageBoundaryDTO,
  ListAvatarURLsResponseDTO,
  NotificationType,
  NotificationWhitelists,
  ProfileDTO,
  ProfileSchema,
  SearchProfilesResponseSchema,
  SearchUserProfilesParamsDTO,
  UpdateProfileParamsDTO,
  UserDTO,
  UserSettingsDTO,
} from '../types';
import { Fetcher } from './fetcher';

export class UserProfilesApiClient {
  constructor(private readonly apiClient: Fetcher) {}

  async searchProfiles(
    query: SearchUserProfilesParamsDTO,
  ): Promise<ApiList<ProfileDTO>> {
    const { data } = await this.apiClient.get(
      '/api/users',
      query,
      SearchProfilesResponseSchema,
    );
    return data;
  }

  async getProfile(username: string): Promise<ProfileDTO> {
    const { data } = await this.apiClient.get(
      `/api/users/${username}`,
      undefined,
      ProfileSchema,
    );
    return data;
  }

  async updateProfile(
    user: UserDTO,
    update: UpdateProfileParamsDTO,
  ): Promise<UserDTO> {
    await this.apiClient.put(`/api/users/${user.username}`, update);
    return {
      ...user,
      profile: {
        ...user.profile,
        ...update,
      },
    };
  }

  async uploadAvatar(
    usernameOrEmail: string,
    avatar: File,
    region?: ImageBoundaryDTO,
  ): Promise<ListAvatarURLsResponseDTO> {
    const formData = new FormData();
    formData.append('avatar', avatar);

    if (region && 'left' in region) {
      formData.append('left', region.left.toString());
      formData.append('top', region.top.toString());
      formData.append('width', region.width.toString());
      formData.append('height', region.height.toString());
    }

    const { data } =
      await this.apiClient.postFormData<ListAvatarURLsResponseDTO>(
        `/api/users/${usernameOrEmail}/avatar`,
        formData,
      );

    return data;
  }

  async deleteAvatar(usernameOrEmail: string): Promise<void> {
    await this.apiClient.delete(`/api/users/${usernameOrEmail}/avatar`);
  }

  async updateSettings(
    user: UserDTO,
    settings: UserSettingsDTO,
  ): Promise<UserDTO> {
    await this.apiClient.put(`/api/users/${user.username}/settings`, settings);
    return {
      ...user,
      settings,
    };
  }

  async getNotificationWhitelists(
    username: string,
  ): Promise<NotificationWhitelists> {
    const [{ data: emailWhitelist }, { data: pushNotificationWhitelist }] =
      await Promise.all([
        this.apiClient.get(
          `/api/users/${username}/notifications/permissions/${NotificationType.Email}`,
          undefined,
          z.string().array(),
        ),
        this.apiClient.get(
          `/api/users/${username}/notifications/permissions/${NotificationType.PushNotification}`,
          undefined,
          z.string().array(),
        ),
      ]);
    return {
      [NotificationType.Email]: emailWhitelist,
      [NotificationType.PushNotification]: pushNotificationWhitelist,
    };
  }

  async updateNotificationWhitelist(
    username: string,
    type: NotificationType,
    whitelist: string[],
  ): Promise<void> {
    await this.apiClient.put(
      `/api/users/${username}/notifications/permissions/${type}`,
      whitelist,
    );
  }
}
