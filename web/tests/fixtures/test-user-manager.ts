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
  isUsernameOrEmailAvailable(usernameOrEmail: string): Promise<boolean> {
    throw new Error('Method not implemented.');
  }
  requestPasswordReset(usernameOrEmail: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
  resetPassword(
    username: string,
    token: string,
    newPassword: string,
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
