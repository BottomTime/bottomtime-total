import { Collection, MongoClient, UpdateFilter } from 'mongodb';
import Logger from 'bunyan';

import { Application } from './interfaces';
import { ApplicationDocument, Collections } from '../data';
import { User } from '../users';
import { assertValid } from '../helpers/validation';
import { ApplicationSchema } from './validation';
import { ConflictError } from '../errors';

export class DefaultApplication implements Application {
  private readonly applications: Collection<ApplicationDocument>;

  constructor(
    mongoClient: MongoClient,
    private readonly log: Logger,
    private readonly data: ApplicationDocument,
    readonly user: User,
  ) {
    this.applications = mongoClient.db().collection(Collections.Applications);
  }

  get id(): string {
    return this.data._id;
  }

  get created(): Date {
    return this.data.created;
  }

  get active(): boolean {
    return this.data.active;
  }
  set active(value: boolean) {
    this.data.active = value;
  }

  get allowedOrigins(): string[] | undefined {
    return this.data.allowedOrigins;
  }
  set allowedOrigins(value: string[] | undefined) {
    this.data.allowedOrigins = value;
  }

  get description(): string | undefined {
    return this.data.description;
  }
  set description(value: string | undefined) {
    this.data.description = value;
  }

  get name(): string {
    return this.data.name;
  }
  set name(value: string) {
    this.data.name = value;
  }

  get token(): string {
    return this.data.token;
  }

  async save(): Promise<void> {
    const { parsed: data } = assertValid(this.data, ApplicationSchema);

    const conflict = await this.applications.findOne(
      {
        _id: { $ne: data._id },
        name: data.name,
      },
      {
        projection: { _id: true },
      },
    );

    if (conflict) {
      throw new ConflictError(
        `An application named "${data.name}" already exists. Please select another name for your application.`,
        'name',
      );
    }

    const update = {
      $set: {},
      $unset: {},
    };

    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) Object.assign(update.$unset, { [key]: true });
      else Object.assign(update.$set, { [key]: value });
    }

    await this.applications.updateOne({ _id: this.id }, update, {
      upsert: true,
    });
  }

  toJSON(): Record<string, unknown> {
    const obj: Record<string, unknown> = {
      id: this.id,
      active: this.active,
      created: this.created,
      name: this.name,
      token: this.token,
      user: {
        id: this.user.id,
        username: this.user.username,
      },
    };

    if (this.allowedOrigins) {
      obj.allowedOrigins = this.allowedOrigins;
    }

    if (this.description) {
      obj.description = this.description;
    }

    return obj;
  }
}
