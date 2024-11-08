import mockFetch from 'fetch-mock-jest';

import {
  AlertDTO,
  CreateOrUpdateAlertParamsDTO,
  ListAlertsParamsDTO,
} from '../../src';
import { Alert } from '../../src/client';
import { AlertsApiClient } from '../../src/client/alerts';
import { Fetcher } from '../../src/client/fetcher';

const AlertData: AlertDTO[] = [
  {
    id: '5d7db90d-95d1-45c1-8e50-c6e783f63ecd',
    icon: 'fas fa-info',
    title: 'Informational Alert',
    message: 'This is an informational alert.',
    active: new Date('2024-03-27T14:56:09.288Z'),
    expires: new Date('2024-04-27T14:56:09.288Z'),
  },
  {
    id: 'aaac1bec-e089-4944-b11c-c595c068493b',
    icon: 'fas fa-exclamation',
    title: 'Warning Alert',
    message: 'This is a warning alert.',
    active: new Date('2024-05-27T14:56:09.288Z'),
    expires: new Date('2024-06-27T14:56:09.288Z'),
  },
  {
    id: '53f52538-c296-4f3c-a40f-c8b494c750a8',
    icon: 'fas fa-ban',
    title: 'Error Alert',
    message: 'This is an error alert.',
    active: new Date('2024-07-27T14:56:09.288Z'),
    expires: new Date('2024-08-27T14:56:09.288Z'),
  },
];

describe('Alerts API client', () => {
  let fetcher: Fetcher;
  let apiClient: AlertsApiClient;

  beforeAll(() => {
    fetcher = new Fetcher();
    apiClient = new AlertsApiClient(fetcher);
  });

  afterEach(() => {
    mockFetch.restore();
  });

  it('will perform searches for alerts', async () => {
    const options: ListAlertsParamsDTO = {
      showDismissed: true,
      skip: 4,
      limit: 10,
    };
    mockFetch.get('/api/alerts?showDismissed=true&skip=4&limit=10', {
      status: 200,
      body: JSON.parse(
        JSON.stringify({
          data: AlertData,
          totalCount: 13,
        }),
      ),
    });

    const result = await apiClient.listAlerts(options);
    expect(result.data).toHaveLength(AlertData.length);
    expect(result.totalCount).toBe(13);

    expect(mockFetch.done()).toBe(true);
  });

  it('will retrieve a single alert', async () => {
    mockFetch.get(`/api/alerts/${AlertData[1].id}`, {
      status: 200,
      body: JSON.stringify(AlertData[1]),
    });

    const result = await apiClient.getAlert(AlertData[1].id);

    expect(result.active).toEqual(AlertData[1].active);
    expect(result.toJSON()).toEqual(AlertData[1]);
    expect(mockFetch.done()).toBe(true);
  });

  it('will create a new alert', async () => {
    const alertId = '5e9b3b76-32b0-4305-8875-9d5dc37dd674';
    const options: CreateOrUpdateAlertParamsDTO = {
      icon: 'fas fa-bell',
      title: 'Wow! A new alert!',
      message: 'Alert body goes here.',
      active: new Date('2024-03-27T14:56:09.288Z'),
    };
    mockFetch.post(
      {
        url: '/api/alerts',
        body: JSON.parse(JSON.stringify(options)),
      },
      {
        status: 200,
        body: JSON.stringify({
          id: alertId,
          ...options,
        }),
      },
    );

    const result = await apiClient.createAlert(options);
    expect(result).toBeInstanceOf(Alert);
    expect(result.active).toEqual(options.active);
    expect(result.toJSON()).toEqual({
      id: alertId,
      ...options,
    });

    expect(mockFetch.done()).toBe(true);
  });

  it('will wrap a DTO in an alert object', () => {
    const alert = apiClient.wrapDTO(AlertData[2]);
    expect(alert).toBeInstanceOf(Alert);
    expect(alert.active).toEqual(AlertData[2].active);
    expect(alert.toJSON()).toEqual(AlertData[2]);
  });
});
