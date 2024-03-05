import {
  ProfileDTO,
  UpdateProfileParamsDTO,
  UserCertificationDTO,
} from '@bottomtime/api';

import { Repository } from 'typeorm';
import { isUndefined } from 'util';

import { UserEntity } from '../data';

export type UpdateProfileOptions = UpdateProfileParamsDTO;
export type UserCertification = UserCertificationDTO;

export class Profile {
  constructor(
    private readonly Users: Repository<UserEntity>,
    private data: UserEntity,
  ) {}

  get avatar(): string | undefined {
    return this.data.avatar ?? undefined;
  }

  get bio(): string | undefined {
    return this.data.bio ?? undefined;
  }

  get birthdate(): string | undefined {
    return this.data.birthdate ?? undefined;
  }

  get customData(): Record<string, unknown> | undefined {
    return this.data.customData ?? undefined;
  }

  get certifications(): UserCertification[] | undefined {
    return this.data.certifications?.map((c) => ({
      agency: c.agency,
      course: c.course,
      date: c.date,
    }));
  }

  get experienceLevel(): string | undefined {
    return this.data.experienceLevel ?? undefined;
  }

  get location(): string | undefined {
    return this.data.location ?? undefined;
  }

  get name(): string | undefined {
    return this.data.name ?? undefined;
  }

  get startedDiving(): string | undefined {
    return this.data.startedDiving ?? undefined;
  }

  async update(params: UpdateProfileOptions): Promise<void> {
    if (params.avatar !== undefined) this.data.avatar = params.avatar ?? null;

    if (params.bio !== undefined) this.data.bio = params.bio ?? null;

    if (params.birthdate !== undefined)
      this.data.birthdate = params.birthdate ?? null;

    // TODO
    // if (!!params.certifications || !ignoreUndefined)
    //   this.data.certifications = params.certifications;

    if (params.customData !== undefined)
      this.data.customData = params.customData ?? null;

    if (params.experienceLevel !== undefined)
      this.data.experienceLevel = params.experienceLevel ?? null;

    if (params.location !== undefined)
      this.data.location = params.location ?? null;

    if (params.name !== undefined) this.data.name = params.name ?? null;

    if (params.startedDiving !== undefined)
      this.data.startedDiving = params.startedDiving ?? null;

    this.data = await this.Users.save(this.data);
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
      userId: this.data.id,
      username: this.data.username,
    };
  }
}
