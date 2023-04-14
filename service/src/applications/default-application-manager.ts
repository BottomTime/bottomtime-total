import { Collection, MongoClient } from 'mongodb';
import Logger from 'bunyan';

import {
  Application,
  ApplicationManager,
  SearchApplicationsOptions,
} from './interfaces';
import { ApplicationDocument, Collections } from '../data';
import { UserManager } from '../users';

export class DefaultApplicationManager implements ApplicationManager {
  private readonly applications: Collection<ApplicationDocument>;

  constructor(
    private readonly userManager: UserManager,
    private readonly mongoClient: MongoClient,
    private readonly log: Logger,
  ) {
    this.applications = mongoClient.db().collection(Collections.Applications);
  }

  async getApplication(id: string): Promise<Application | undefined> {
    throw new Error('Method not implemented.');
  }

  async getApplicationsForUser(userId: string): Promise<Application[]> {
    throw new Error('Method not implemented.');
  }

  async searchApplications(
    options?: SearchApplicationsOptions | undefined,
  ): Promise<Application[]> {
    throw new Error('Method not implemented.');
  }
}
