import { AppMetricsDTO } from '../types';
import { AlertsApiClient } from './alerts';
import { ApiClientOptions } from './api-client-options';
import { DiveSitesApiClient } from './dive-sites';
import { FeaturesApiClient } from './features';
import { Fetcher } from './fetcher';
import { FriendsApiClient } from './friends';
import { LogEntriesApiClient } from './log-entries';
import { TanksApiClient } from './tanks';
import { UsersApiClient } from './users';

export class ApiClient {
  private readonly client: Fetcher;
  readonly alerts: AlertsApiClient;
  readonly features: FeaturesApiClient;
  readonly friends: FriendsApiClient;
  readonly users: UsersApiClient;
  readonly diveSites: DiveSitesApiClient;
  readonly logEntries: LogEntriesApiClient;
  readonly tanks: TanksApiClient;

  constructor(options?: ApiClientOptions) {
    this.client = options?.fetcher ?? new Fetcher(options);
    this.alerts = new AlertsApiClient(this.client);
    this.features = new FeaturesApiClient(this.client);
    this.friends = new FriendsApiClient(this.client);
    this.users = new UsersApiClient(this.client);
    this.diveSites = new DiveSitesApiClient(this.client);
    this.logEntries = new LogEntriesApiClient(this.client);
    this.tanks = new TanksApiClient(this.client);
  }

  async getAppMetrics(): Promise<AppMetricsDTO> {
    const { data } = await this.client.get<AppMetricsDTO>('/api/metrics');
    return data;
  }
}
