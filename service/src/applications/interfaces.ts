import { User } from '../users';

export interface ApplicationData {
  readonly id: string;
  readonly created: Date;
  readonly token: string;
  readonly userId: string;

  active: boolean;
  allowedOrigins?: string[];
  description?: string;
  name: string;
}

export interface Application extends ApplicationData {
  getUser(): Promise<User>;
  delete(): Promise<void>;
  regenerateToken(): void;
  save(): Promise<void>;
  toJSON(): object;
}

export interface CreateApplicationOptions {
  name: string;
  owner: User;
  active?: boolean;
  allowedOrigins?: string[];
  description?: string;
}

export interface SearchApplicationsOptions {
  active?: boolean;
  query?: string;
  userId?: string;
  skip?: number;
  limit?: number;
}

export interface ApplicationManager {
  createApplication(options: CreateApplicationOptions): Promise<Application>;
  getApplication(id: string): Promise<Application | undefined>;
  getApplicationsForUser(userId: string): Promise<Application[]>;
  searchApplications(
    options?: SearchApplicationsOptions,
  ): Promise<Application[]>;
}
