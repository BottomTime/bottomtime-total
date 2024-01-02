import { UserCertificationDTO, ProfileDTO } from '@bottomtime/api';
import { ProfileData, UserDocument } from '../schemas/user.document';
import { Maybe } from '../maybe';

export class Profile {
  private _certifications: UserCertificationDTO[] | undefined;

  constructor(private readonly data: UserDocument) {}

  get profile(): ProfileData {
    if (this.data.profile) {
      return this.data.profile;
    }

    const profileData = {};
    this.data.profile = profileData;
    return profileData;
  }

  get avatar(): Maybe<string> {
    return this.profile.avatar;
  }
  set avatar(value: Maybe<string>) {
    this.profile.avatar = value;
  }

  get bio(): Maybe<string> {
    return this.profile.bio;
  }
  set bio(value: Maybe<string>) {
    this.profile.bio = value;
  }

  get birthdate(): Maybe<string> {
    return this.profile.birthdate;
  }
  set birthdate(value: Maybe<string>) {
    this.profile.birthdate = value;
  }

  get customData(): Maybe<Record<string, unknown>> {
    return this.profile.customData;
  }
  set customData(value: Maybe<Record<string, unknown>>) {
    this.profile.customData = value;
  }

  // get certifications(): UserCertificationDTO[] {
  //   if (this._certifications) {
  //     return this._certifications;
  //   }

  //   this._certifications = this.data.profile?.certifications ?? [];
  //   return this._certifications;
  // }
  // set certifications(value: UserCertificationDTO[]) {
  //   this._certifications = value;
  // }

  get experienceLevel(): Maybe<string> {
    return this.profile.experienceLevel;
  }
  set experienceLevel(value: Maybe<string>) {
    this.profile.experienceLevel = value;
  }

  get location(): Maybe<string> {
    return this.profile.location;
  }
  set location(value: Maybe<string>) {
    this.profile.location = value;
  }

  get name(): Maybe<string> {
    return this.profile.name;
  }
  set name(value: Maybe<string>) {
    this.profile.name = value;
  }

  get startedDiving(): Maybe<string> {
    return this.profile.startedDiving;
  }
  set startedDiving(value: Maybe<string>) {
    this.profile.startedDiving = value;
  }

  async save(): Promise<void> {
    /* TODO */
  }

  toJSON(): ProfileDTO {
    return {
      avatar: this.avatar ?? undefined,
      bio: this.bio ?? undefined,
      birthdate: this.birthdate ?? undefined,
      customData: this.customData ?? undefined,
      experienceLevel: this.experienceLevel ?? undefined,
      location: this.location ?? undefined,
      memberSince: this.data.memberSince,
      name: this.name ?? undefined,
      startedDiving: this.startedDiving ?? undefined,
      userId: this.data._id,
      username: this.data.username,
    };
  }
}
