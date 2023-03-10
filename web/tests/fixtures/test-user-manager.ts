import { CreateUserOptions, User, UserManager } from '@/users';

export class TestUserManager implements UserManager {
  authenticateUser(usernameOrEmail: string, password: string): Promise<User> {
    throw new Error('Method not implemented.');
  }
  createUser(options: CreateUserOptions): Promise<User> {
    throw new Error('Method not implemented.');
  }
  getCurrentUser(): Promise<User | undefined> {
    throw new Error('Method not implemented.');
  }
  getUserByUsername(username: string): Promise<User> {
    throw new Error('Method not implemented.');
  }
}
