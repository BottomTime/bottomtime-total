import request from 'superagent';
import { SuperAgentStatic } from 'superagent';
import { z } from 'zod';

import { DefaultUser } from './default-user';
import {
  CreateUserOptions,
  User,
  UserData,
  UserDataSchema,
  UserManager,
} from './interfaces';
import { assertValid } from '@/helpers';

const ResetPasswordResponseSchema = z.object({
  succeeded: z.coerce.boolean(),
});
type ResetPasswordResponse = z.infer<typeof ResetPasswordResponseSchema>;

export class DefaultUserManager implements UserManager {
  constructor(private readonly agent: SuperAgentStatic) {}

  async authenticateUser(
    usernameOrEmail: string,
    password: string,
  ): Promise<User> {
    const { body } = await this.agent.post('/api/auth/login').send({
      usernameOrEmail,
      password,
    });
    const userData = assertValid<UserData>(body, UserDataSchema);
    return new DefaultUser(this.agent, userData);
  }

  async createUser(options: CreateUserOptions): Promise<User> {
    const { body } = await this.agent
      .put(`/api/users/${options.username}`)
      .send({
        email: options.email,
        password: options.password,
        profile: options.profile,
      });

    const userData = assertValid(body, UserDataSchema);
    return new DefaultUser(this.agent, userData);
  }

  async getCurrentUser(): Promise<User | undefined> {
    const { body } = await this.agent.get('/api/auth/me');
    if (body.anonymous) {
      return undefined;
    }

    const userData = assertValid(body, UserDataSchema);
    return new DefaultUser(this.agent, userData);
  }

  async getUserByUsername(username: string): Promise<User> {
    const { body } = await this.agent.get(`/api/users/${username}`);
    const userData = assertValid(body, UserDataSchema);
    return new DefaultUser(this.agent, userData);
  }

  isUsernameOrEmailAvailable(usernameOrEmail: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Why the hell does Superagent not support HEAD requests!?
      request
        .head(`/api/users/${usernameOrEmail}`)
        .then(() => {
          resolve(false);
        })
        .catch((error) => {
          if (error.status === 404) resolve(true);
          else reject(error);
        });
    });
  }

  async requestPasswordReset(usernameOrEmail: string): Promise<void> {
    await this.agent.post(`/api/users/${usernameOrEmail}/requestPasswordReset`);
  }

  async resetPassword(
    username: string,
    token: string,
    newPassword: string,
  ): Promise<boolean> {
    const { body } = await this.agent
      .post(`/api/users/${username}/`)
      .send({ token, newPassword });

    const { succeeded } = assertValid<ResetPasswordResponse>(
      body,
      ResetPasswordResponseSchema,
    );
    return succeeded;
  }
}
