import { Collection, Filter, MongoClient } from 'mongodb';
import Logger from 'bunyan';
import { v4 as uuid } from 'uuid';

import {
  Application,
  ApplicationManager,
  CreateApplicationOptions,
  SearchApplicationsOptions,
} from './interfaces';
import { ApplicationDocument, Collections } from '../data';
import { UserManager } from '../users';
import { DefaultApplication } from './default-application';

export class DefaultApplicationManager implements ApplicationManager {
  private readonly applications: Collection<ApplicationDocument>;

  constructor(
    private readonly userManager: UserManager,
    private readonly mongoClient: MongoClient,
    private readonly log: Logger,
  ) {
    this.applications = mongoClient.db().collection(Collections.Applications);
  }

  async createApplication(
    options: CreateApplicationOptions,
  ): Promise<Application> {
    const data: ApplicationDocument = {
      _id: uuid(),
      active: options.active ?? true,
      allowedOrigins: options.allowedOrigins,
      created: new Date(),
      name: options.name,
      token: '',
      description: options.description,
      user: options.owner.id,
    };

    const app = new DefaultApplication(
      this.userManager,
      this.mongoClient,
      this.log,
      data,
    );
    app.regenerateToken();
    await app.save();

    return app;
  }

  async getApplication(id: string): Promise<Application | undefined> {
    this.log.debug(`Attempting to retrieve application with ID "${id}"...`);
    const data = await this.applications.findOne({ _id: id });
    if (data) {
      return new DefaultApplication(
        this.userManager,
        this.mongoClient,
        this.log,
        data,
      );
    }

    return undefined;
  }

  async getApplicationsForUser(userId: string): Promise<Application[]> {
    const results: Application[] = [];

    const cursor = this.applications.find(
      { user: userId },
      {
        sort: { name: 1 },
      },
    );
    await cursor.forEach((data) => {
      results.push(
        new DefaultApplication(
          this.userManager,
          this.mongoClient,
          this.log,
          data,
        ),
      );
    });

    return results;
  }

  async searchApplications(
    options?: SearchApplicationsOptions | undefined,
  ): Promise<Application[]> {
    const results: Application[] = [];

    const searchFilter: Filter<ApplicationDocument> = {};

    if (options?.active !== undefined) {
      searchFilter.active = options.active;
    }

    if (options?.userId) {
      searchFilter.user = options.userId;
    }

    if (options?.query) {
      searchFilter.$text = {
        $caseSensitive: false,
        $diacriticSensitive: false,
        $search: options.query,
      };
    }

    const cursor = this.applications
      .find(searchFilter)
      .sort({ name: 1 })
      .skip(options?.skip ?? 0)
      .limit(options?.limit ?? 100);
    await cursor.forEach((data) => {
      results.push(
        new DefaultApplication(
          this.userManager,
          this.mongoClient,
          this.log,
          data,
        ),
      );
    });

    return results;
  }
}
