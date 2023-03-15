export interface UserData {
  readonly id: string;
  readonly email?: string;
  readonly emailVerified: boolean;
  readonly hasPassword: boolean;
  readonly isLockedOut: boolean;
  readonly lastLogin?: Date;
  readonly lastPasswordChange?: Date;
  readonly memberSince: Date;
  readonly role: number;
  readonly username: string;
}

export interface User extends UserData {
  toJSON(): UserData;
}

export interface CreateUserOptions {
  username: string;
  password?: string;
  email?: string;
}

export interface UserManager {
  authenticateUser(usernameOrEmail: string, password: string): Promise<User>;
  createUser(options: CreateUserOptions): Promise<User>;
  getCurrentUser(): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User>;
}
