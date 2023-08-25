import { SuperAgentStatic } from 'superagent';
import { DefaultProfile } from './default-profile';
import { Profile, User, UserData, UserDataSchema } from './interfaces';
import { UserRole } from '@/constants';
import { assertValid } from '@/helpers';

export class DefaultUser implements User {
  private _profile: Profile | undefined;

  constructor(
    private readonly agent: SuperAgentStatic,
    private readonly data: UserData,
  ) {}

  get profile(): Profile {
    if (!this._profile) {
      this._profile = new DefaultProfile(this.agent, this.data);
    }
    return this._profile;
  }

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

  get role(): UserRole {
    return this.data.role;
  }

  get username(): string {
    return this.data.username;
  }

  async changeEmail(newEmail: string): Promise<void> {
    await this.agent
      .post(`/api/users/${this.data.username}/changeEmail`)
      .send({ newEmail });

    Object.assign(this.data, {
      email: newEmail,
      emailVerified: false,
    });
  }

  async changePassword(
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    await this.agent
      .post(`/api/users/${this.data.username}/changePassword`)
      .send({ oldPassword, newPassword });
  }

  async changeUsername(newUsername: string): Promise<void> {
    await this.agent
      .post(`/api/users/${this.data.username}/changeUsername`)
      .send({ newUsername });

    Object.assign(this.data, {
      username: newUsername,
    });
  }

  async requestVerificationEmail(): Promise<void> {
    await this.agent.post(
      `/api/users/${this.data.username}/requestEmailVerification`,
    );
  }

  async verifyEmail(token: string): Promise<boolean> {
    const {
      body: { verified },
    } = await this.agent
      .post(`/api/users/${this.data.username}/verifyEmail`)
      .send({ token });
    return verified === true;
  }

  toJSON(): UserData {
    return assertValid(this.data, UserDataSchema);
  }
}
