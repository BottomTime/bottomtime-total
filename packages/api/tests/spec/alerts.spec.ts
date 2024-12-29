import mockFetch from 'fetch-mock-jest';

import {
  AlertDTO,
  CreateOrUpdateAlertParamsDTO,
  ListAlertsParamsDTO,
} from '../../src';
import { AlertsApiClient } from '../../src/client/alerts';
import { Fetcher } from '../../src/client/fetcher';

const AlertData: AlertDTO[] = [
  {
    id: '5d7db90d-95d1-45c1-8e50-c6e783f63ecd',
    icon: 'fas fa-info',
    title: 'Informational Alert',
    message: 'This is an informational alert.',
    active: new Date('2024-03-27T14:56:09.288Z').valueOf(),
    expires: new Date('2024-04-27T14:56:09.288Z').valueOf(),
  },
  {
    id: 'aaac1bec-e089-4944-b11c-c595c068493b',
    icon: 'fas fa-exclamation',
    title: 'Warning Alert',
    message: 'This is a warning alert.',
    active: new Date('2024-05-27T14:56:09.288Z').valueOf(),
    expires: new Date('2024-06-27T14:56:09.288Z').valueOf(),
  },
  {
    id: '53f52538-c296-4f3c-a40f-c8b494c750a8',
    icon: 'fas fa-ban',
    title: 'Error Alert',
    message: 'This is an error alert.',
    active: new Date('2024-07-27T14:56:09.288Z').valueOf(),
    expires: new Date('2024-08-27T14:56:09.288Z').valueOf(),
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

    expect(result).toEqual(AlertData[1]);
    expect(mockFetch.done()).toBe(true);
  });

  it('will create a new alert', async () => {
    const alertId = '5e9b3b76-32b0-4305-8875-9d5dc37dd674';
    const options: CreateOrUpdateAlertParamsDTO = {
      icon: 'fas fa-bell',
      title: 'Wow! A new alert!',
      message: 'Alert body goes here.',
      active: new Date('2024-03-27T14:56:09.288Z').valueOf(),
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
    expect(result).toEqual({
      id: alertId,
      ...options,
    });

    expect(mockFetch.done()).toBe(true);
  });

  it('will save changes to an alert', async () => {
    const update: CreateOrUpdateAlertParamsDTO = {
      icon: AlertData[0].icon,
      title: AlertData[0].title,
      message: AlertData[0].message,
      active: AlertData[0].active,
      expires: AlertData[0].expires,
    };
    mockFetch.put(
      {
        url: `/api/alerts/${AlertData[0].id}`,
        body: JSON.parse(JSON.stringify(update)),
      },
      {
        status: 200,
        body: AlertData[0],
      },
    );

    await apiClient.updateAlert(AlertData[0]);

    expect(mockFetch.done()).toBe(true);
  });

  it('will delete an alert', async () => {
    const id = '1f54d768-025b-4fc5-a82c-3bc21fd42e17';
    mockFetch.delete(`/api/alerts/${id}`, 204);
    await apiClient.deleteAlert(id);
    expect(mockFetch.done()).toBe(true);
  });
});
