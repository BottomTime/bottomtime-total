import { User } from './interfaces';

export class DefaultUser implements User {
  id = '';
  email?: string | undefined;
  emailVerified = false;
  hasPassword = false;
  lastLogin?: Date | undefined;
  lastPasswordChange?: Date | undefined;
  memberSince: Date = new Date();
  username = '';

  async save() {}
}
