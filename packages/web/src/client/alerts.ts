import {
  AlertSchema,
  CreateOrUpdateAlertParamsDTO,
  ListAlertsParamsDTO,
  ListAlertsResponseSchema,
} from '@bottomtime/api';

import { AxiosInstance } from 'axios';

import { Alert } from './alert';

export class AlertsApiClient {
  constructor(private readonly apiClient: AxiosInstance) {}

  async listAlerts(options?: ListAlertsParamsDTO): Promise<{
    alerts: Alert[];
    totalCount: number;
  }> {
    const { data } = await this.apiClient.get('/api/alerts', {
      params: options,
    });

    const parsed = ListAlertsResponseSchema.parse(data);
    return {
      alerts: parsed.alerts.map((alert) => new Alert(this.apiClient, alert)),
      totalCount: parsed.totalCount,
    };
  }

  async getAlert(alertId: string): Promise<Alert> {
    const { data } = await this.apiClient.get(`/api/alerts/${alertId}`);
    return new Alert(this.apiClient, AlertSchema.parse(data));
  }

  async createAlert(options: CreateOrUpdateAlertParamsDTO): Promise<Alert> {
    const { data } = await this.apiClient.post('/api/alerts', options);
    return new Alert(this.apiClient, AlertSchema.parse(data));
  }

  wrapDTO(data: unknown): Alert {
    return new Alert(this.apiClient, AlertSchema.parse(data));
  }
}
