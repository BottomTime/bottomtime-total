import Joi from 'joi';
import { SuperAgentStatic } from 'superagent';

import { DefaultUser } from './default-user';
import { CreateUserOptions, User, UserManager } from './interfaces';

const UserDataSchema = Joi.object({
  email: Joi.string(),
  emailVerified: Joi.bool(),
  hasPassword: Joi.bool(),
  id: Joi.string(),
  isLockedOut: Joi.bool(),
  lastLogin: Joi.date(),
  lastPasswordChange: Joi.date(),
  memberSince: Joi.date(),
  role: Joi.number(),
  username: Joi.string(),
});

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
    const { value: userData } = UserDataSchema.validate(body);
    return new DefaultUser(this.agent, userData);
  }

  async createUser(options: CreateUserOptions): Promise<User> {
    const { body } = await this.agent
      .put(`/api/users/${options.username}`)
      .send({
        email: options.email,
        password: options.password,
      });

    const { value: userData } = UserDataSchema.validate(body);
    return new DefaultUser(this.agent, userData);
  }

  async getCurrentUser(): Promise<User | undefined> {
    const { body } = await this.agent.get('/api/auth/me');
    if (body.anonymous) {
      return undefined;
    }

    delete body.anonymous;
    const { value: userData } = UserDataSchema.validate(body);
    return new DefaultUser(this.agent, userData);
  }

  async getUserByUsername(username: string): Promise<User> {
    const { body } = await this.agent.get(`/api/users/${username}`);
    const { value: userData } = UserDataSchema.validate(body);
    return new DefaultUser(this.agent, userData);
  }
}
