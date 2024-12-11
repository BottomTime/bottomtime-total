import {
  AlertDTO,
  AlertSchema,
  ApiList,
  CreateOrUpdateAlertParamsDTO,
  CreateOrUpdateAlertParamsSchema,
  ListAlertsParamsDTO,
  ListAlertsResponseSchema,
} from '../types';
import { Fetcher } from './fetcher';

export class AlertsApiClient {
  constructor(private readonly apiClient: Fetcher) {}

  async listAlerts(options?: ListAlertsParamsDTO): Promise<ApiList<AlertDTO>> {
    const { data: response } = await this.apiClient.get(
      '/api/alerts',
      options,
      ListAlertsResponseSchema,
    );
    return response;
  }

  async getAlert(alertId: string): Promise<AlertDTO> {
    const { data } = await this.apiClient.get(
      `/api/alerts/${alertId}`,
      undefined,
      AlertSchema,
    );
    return data;
  }

  async createAlert(options: CreateOrUpdateAlertParamsDTO): Promise<AlertDTO> {
    const { data } = await this.apiClient.post(
      '/api/alerts',
      options,
      AlertSchema,
    );
    return data;
  }

  async updateAlert(alert: AlertDTO): Promise<void> {
    await this.apiClient.put(
      `/api/alerts/${alert.id}`,
      CreateOrUpdateAlertParamsSchema.parse(alert),
    );
  }

  async deleteAlert(alertId: string): Promise<void> {
    await this.apiClient.delete(`/api/alerts/${alertId}`);
  }
}
