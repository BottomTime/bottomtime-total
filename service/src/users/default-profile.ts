import Logger from 'bunyan';
import { Collection, MongoClient } from 'mongodb';

import { Collections, UserDocument } from '../data';
import { assertValid } from '../helpers/validation';
import { Profile, ProfileCertificationData, ProfileData } from './interfaces';
import { ProfileSchema } from './validation';
import { ProfileVisibility } from '../constants';

export class DefaultProfile implements Profile {
  private readonly users: Collection<UserDocument>;

  constructor(
    mongoClient: MongoClient,
    private readonly log: Logger,
    private readonly data: UserDocument,
  ) {
    this.users = mongoClient.db().collection(Collections.Users);
    if (!this.data.profile) {
      this.data.profile = {
        profileVisibility: ProfileVisibility.FriendsOnly,
      };
    }
  }

  get userId(): string {
    return this.data._id;
  }

  get username(): string {
    return this.data.username;
  }

  get memberSince(): Date {
    return this.data.memberSince;
  }

  get avatar(): string | undefined {
    return this.data.profile?.avatar;
  }
  set avatar(value: string | undefined) {
    this.data.profile!.avatar = value;
  }

  get bio(): string | undefined {
    return this.data.profile?.bio;
  }
  set bio(value: string | undefined) {
    this.data.profile!.bio = value;
  }

  get birthdate(): string | undefined {
    return this.data.profile?.birthdate;
  }
  set birthdate(value: string | undefined) {
    this.data.profile!.birthdate = value;
  }

  get certifications(): ProfileCertificationData[] | undefined {
    return this.data.profile?.certifications;
  }
  set certifications(value: ProfileCertificationData[] | undefined) {
    this.data.profile!.certifications = value;
  }

  get experienceLevel(): string | undefined {
    return this.data.profile?.experienceLevel;
  }
  set experienceLevel(value: string | undefined) {
    this.data.profile!.experienceLevel = value;
  }

  get location(): string | undefined {
    return this.data.profile?.location;
  }
  set location(value: string | undefined) {
    this.data.profile!.location = value;
  }

  get name(): string | undefined {
    return this.data.profile?.name;
  }
  set name(value: string | undefined) {
    this.data.profile!.name = value;
  }

  get profileVisibility(): string {
    return this.data.profile!.profileVisibility;
  }
  set profileVisibility(value: string) {
    this.data.profile!.profileVisibility = value;
  }

  get startedDiving(): string | undefined {
    return this.data.profile?.startedDiving;
  }
  set startedDiving(value: string | undefined) {
    this.data.profile!.startedDiving = value;
  }

  async save(): Promise<void> {
    const { parsed: profile } = assertValid(this.data.profile, ProfileSchema);

    this.log.debug(
      `Attempting to save profile data for user "${this.data.username}"...`,
    );
    await this.users.updateOne(
      { _id: this.data._id },
      {
        $set: {
          profile,
        },
      },
    );
  }

  toJSON(): ProfileData {
    return {
      userId: this.userId,
      username: this.username,
      memberSince: this.memberSince,
      ...this.data.profile!,
    };
  }
}
