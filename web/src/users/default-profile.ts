import Joi from 'joi';
import { SuperAgentStatic } from 'superagent';
import { Profile, ProfileCertificationData, UserData } from './interfaces';

export const ProfileSchema = Joi.object({
  avatar: Joi.string().trim(),
  bio: Joi.string().trim(),
  birthdate: Joi.string().trim(),
  customData: Joi.any(),
  certifications: Joi.array().items(
    Joi.object({
      agency: Joi.string().trim(),
      course: Joi.string().trim(),
      date: Joi.string().trim(),
    }),
  ),
  experienceLevel: Joi.string().trim(),
  location: Joi.string().trim(),
  name: Joi.string().trim(),
  profileVisibility: Joi.string().trim(),
  startedDiving: Joi.string().trim(),
});

export class DefaultProfile implements Profile {
  private static readonly JsonOmitKeys = new Set([
    'userId',
    'memberSince',
    'username',
  ]);

  constructor(
    private readonly agent: SuperAgentStatic,
    private readonly data: UserData,
  ) {}

  get userId(): string {
    return this.data.id;
  }
  get memberSince(): Date {
    return this.data.memberSince;
  }
  get username(): string {
    return this.data.username;
  }

  get avatar(): string | undefined {
    return this.data.profile.avatar;
  }
  set avatar(value: string | undefined) {
    this.data.profile.avatar = value;
  }

  get bio(): string | undefined {
    return this.data.profile.bio;
  }
  set bio(value: string | undefined) {
    this.data.profile.bio = value;
  }

  get birthdate(): string | undefined {
    return this.data.profile.birthdate;
  }
  set birthdate(value: string | undefined) {
    this.data.profile.birthdate = value;
  }

  get customData(): object | undefined {
    return this.data.profile.customData;
  }
  set customData(value: object | undefined) {
    this.data.profile.customData = value;
  }

  get certifications(): ProfileCertificationData[] | undefined {
    return this.data.profile.certifications;
  }
  set certifications(value: ProfileCertificationData[] | undefined) {
    this.data.profile.certifications = value;
  }

  get experienceLevel(): string | undefined {
    return this.data.profile.experienceLevel;
  }
  set experienceLevel(value: string | undefined) {
    this.data.profile.experienceLevel = value;
  }

  get location(): string | undefined {
    return this.data.profile.location;
  }
  set location(value: string | undefined) {
    this.data.profile.location = value;
  }

  get name(): string | undefined {
    return this.data.profile.name;
  }
  set name(value: string | undefined) {
    this.data.profile.name = value;
  }

  get profileVisibility(): string {
    return this.data.profile.profileVisibility;
  }
  set profileVisibility(value: string) {
    this.data.profile.profileVisibility = value;
  }

  get startedDiving(): string | undefined {
    return this.data.profile.startedDiving;
  }
  set startedDiving(value: string | undefined) {
    this.data.profile.startedDiving = value;
  }

  async save(): Promise<void> {
    await this.agent.put(`/api/profiles/${this.username}`).send(this.toJSON());
  }

  toJSON(): object {
    const { value: parsed } = ProfileSchema.validate(this.data.profile);
    Object.entries(parsed).forEach(([key, value]) => {
      if (value === '' || DefaultProfile.JsonOmitKeys.has(key))
        delete parsed[key];
    });
    return parsed;
  }
}
