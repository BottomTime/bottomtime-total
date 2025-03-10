import { AppMetricsDTO } from '../types';
import { AlertsApiClient } from './alerts';
import { ApiClientOptions } from './api-client-options';
import { AuthApiClient } from './auth';
import { CertificationsApiClient } from './certifications';
import { DiveSiteReviewsApiClient } from './dive-site-reviews';
import { DiveSitesApiClient } from './dive-sites';
import { Fetcher } from './fetcher';
import { FriendsApiClient } from './friends';
import { LogEntriesApiClient } from './log-entries';
import { MembershipsApiClient } from './memberships';
import { NotificationsApiClient } from './notifications';
import { OperatorReviewsApiClient } from './operator-reviews';
import { OperatorsApiClient } from './operators';
import { TanksApiClient } from './tanks';
import { UserAccountsApiClient } from './user-accounts';
import { UserProfilesApiClient } from './user-profiles';

export class ApiClient {
  private readonly client: Fetcher;

  readonly alerts: AlertsApiClient;
  readonly auth: AuthApiClient;
  readonly certifications: CertificationsApiClient;
  readonly diveSiteReviews: DiveSiteReviewsApiClient;
  readonly diveSites: DiveSitesApiClient;
  readonly friends: FriendsApiClient;
  readonly logEntries: LogEntriesApiClient;
  readonly memberships: MembershipsApiClient;
  readonly notifications: NotificationsApiClient;
  readonly operatorReviews: OperatorReviewsApiClient;
  readonly operators: OperatorsApiClient;
  readonly tanks: TanksApiClient;
  readonly userAccounts: UserAccountsApiClient;
  readonly userProfiles: UserProfilesApiClient;

  constructor(options?: ApiClientOptions) {
    this.client = options?.fetcher ?? new Fetcher(options);

    this.alerts = new AlertsApiClient(this.client);
    this.auth = new AuthApiClient(this.client);
    this.certifications = new CertificationsApiClient(this.client);
    this.diveSiteReviews = new DiveSiteReviewsApiClient(this.client);
    this.diveSites = new DiveSitesApiClient(this.client);
    this.friends = new FriendsApiClient(this.client);
    this.logEntries = new LogEntriesApiClient(this.client);
    this.memberships = new MembershipsApiClient(this.client);
    this.notifications = new NotificationsApiClient(this.client);
    this.operatorReviews = new OperatorReviewsApiClient(this.client);
    this.operators = new OperatorsApiClient(this.client);
    this.tanks = new TanksApiClient(this.client);
    this.userAccounts = new UserAccountsApiClient(this.client);
    this.userProfiles = new UserProfilesApiClient(this.client);
  }

  async getAppMetrics(): Promise<AppMetricsDTO> {
    const { data } = await this.client.get<AppMetricsDTO>('/api/metrics');
    return data;
  }
}
