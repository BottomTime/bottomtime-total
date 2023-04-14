import { User } from '../users';

export interface ApplicationData {
  readonly id: string;
  readonly created: Date;
  readonly token: string;

  active: boolean;
  allowedOrigins?: string[];
  description?: string;
  name: string;
}

export interface Application extends ApplicationData {
  readonly user: User;
  save(): Promise<void>;
  toJSON(): object;
}

export interface SearchApplicationsOptions {
  active?: boolean;
  query?: string;
  userId?: string;
  skip?: number;
  limit?: number;
}

export interface ApplicationManager {
  getApplication(id: string): Promise<Application | undefined>;
  getApplicationsForUser(userId: string): Promise<Application[]>;
  searchApplications(
    options?: SearchApplicationsOptions,
  ): Promise<Application[]>;
}
