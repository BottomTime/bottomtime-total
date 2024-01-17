import {
  UserCertificationDTO,
  ProfileDTO,
  UpdateProfileParamsDTO,
} from '@bottomtime/api';
import { ProfileData, UserDocument } from '../schemas/user.document';
import { Maybe } from '../common';
import { Types } from 'mongoose';

export type UpdateProfileOptions = UpdateProfileParamsDTO;
export type UserCertification = UserCertificationDTO;

export class Profile {
  constructor(private readonly data: UserDocument) {}

  private get profile(): ProfileData {
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

  get bio(): Maybe<string> {
    return this.profile.bio;
  }

  get birthdate(): Maybe<string> {
    return this.profile.birthdate;
  }

  get customData(): Maybe<Record<string, unknown>> {
    return this.profile.customData;
  }

  get certifications(): UserCertification[] | undefined {
    return this.profile.certifications?.map((c) => c.toJSON());
  }

  get experienceLevel(): Maybe<string> {
    return this.profile.experienceLevel;
  }

  get location(): Maybe<string> {
    return this.profile.location;
  }

  get name(): Maybe<string> {
    return this.profile.name;
  }

  get startedDiving(): Maybe<string> {
    return this.profile.startedDiving;
  }

  async update(
    params: UpdateProfileOptions,
    ignoreUndefined = false,
  ): Promise<void> {
    if (!!params.avatar || !ignoreUndefined)
      this.profile.avatar = params.avatar;

    if (!!params.bio || !ignoreUndefined) this.profile.bio = params.bio;

    if (!!params.birthdate || !ignoreUndefined)
      this.profile.birthdate = params.birthdate;

    if (!!params.certifications || !ignoreUndefined)
      this.profile.certifications = params.certifications
        ? new Types.DocumentArray(params.certifications)
        : undefined;

    if (!!params.customData || !ignoreUndefined)
      this.profile.customData = params.customData;

    if (!!params.experienceLevel || !ignoreUndefined)
      this.profile.experienceLevel = params.experienceLevel;

    if (!!params.location || !ignoreUndefined)
      this.profile.location = params.location;

    if (!!params.name || !ignoreUndefined) this.profile.name = params.name;

    if (!!params.startedDiving || !ignoreUndefined)
      this.profile.startedDiving = params.startedDiving;

    await this.data.save();
  }

  toJSON(): ProfileDTO {
    return {
      avatar: this.avatar ?? undefined,
      bio: this.bio ?? undefined,
      birthdate: this.birthdate ?? undefined,
      certifications: this.certifications,
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
