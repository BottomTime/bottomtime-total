import { SuperAgentStatic } from 'superagent';
import { User, UserData } from './interfaces';

export class DefaultUser implements User {
  constructor(
    private readonly agent: SuperAgentStatic,
    private readonly data: UserData,
  ) {}

  get id(): string {
    return this.data.id;
  }

  get email(): string | undefined {
    return this.data.email;
  }

  get emailVerified(): boolean {
    return this.data.emailVerified;
  }

  get hasPassword(): boolean {
    return this.data.hasPassword;
  }

  get isLockedOut(): boolean {
    return this.data.isLockedOut;
  }

  get lastLogin(): Date | undefined {
    return this.data.lastLogin;
  }

  get lastPasswordChange(): Date | undefined {
    return this.data.lastPasswordChange;
  }

  get memberSince(): Date {
    return this.data.memberSince;
  }

  get role(): string {
    return this.data.role;
  }

  get username(): string {
    return this.data.username;
  }

  toJSON(): UserData {
    return Object.assign({}, this.data);
  }
}
