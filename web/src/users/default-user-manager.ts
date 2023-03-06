import { SuperAgentStatic } from 'superagent';
import { DefaultUser } from './default-user';
import { CreateUserOptions, User, UserManager } from './interfaces';

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
    return new DefaultUser();
  }

  async createUser(options: CreateUserOptions): Promise<User> {
    throw new Error('Method not implemented.');
  }

  async getCurrentUser(): Promise<User | undefined> {
    throw new Error('Method not implemented.');
  }
}
