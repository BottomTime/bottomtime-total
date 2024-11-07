import {
  AlertSchema,
  ApiList,
  CreateOrUpdateAlertParamsDTO,
  ListAlertsParamsDTO,
  ListAlertsResponseSchema,
} from '../types';
import { Alert } from './alert';
import { Fetcher } from './fetcher';

export class AlertsApiClient {
  constructor(private readonly apiClient: Fetcher) {}

  async listAlerts(options?: ListAlertsParamsDTO): Promise<ApiList<Alert>> {
    const { data: response } = await this.apiClient.get(
      '/api/alerts',
      options,
      ListAlertsResponseSchema,
    );

    return {
      data: response.data.map((alert) => new Alert(this.apiClient, alert)),
      totalCount: response.totalCount,
    };
  }

  async getAlert(alertId: string): Promise<Alert> {
    const { data } = await this.apiClient.get(
      `/api/alerts/${alertId}`,
      undefined,
      AlertSchema,
    );
    return new Alert(this.apiClient, data);
  }

  async createAlert(options: CreateOrUpdateAlertParamsDTO): Promise<Alert> {
    const { data } = await this.apiClient.post(
      '/api/alerts',
      options,
      AlertSchema,
    );
    return new Alert(this.apiClient, data);
  }

  wrapDTO(data: unknown): Alert {
    return new Alert(this.apiClient, AlertSchema.parse(data));
  }
}
