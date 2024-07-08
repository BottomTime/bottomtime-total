import { AlertDTO } from '@bottomtime/api';

import mockFetch from 'fetch-mock-jest';

import { Alert } from '../../src/client';
import { Fetcher } from '../../src/client/fetcher';

const AlertData: AlertDTO = {
  id: 'b80cad85-108d-4113-92db-be9ec9fe0aae',
  icon: 'fas fa-info',
  title: 'Informational Alert',
  message: 'This is an informational alert.',
  active: new Date('2024-03-27T14:56:09.288Z'),
  expires: new Date('2024-04-27T14:56:09.288Z'),
};

describe('Alert API class', () => {
  let client: Fetcher;
  let alert: Alert;

  beforeAll(() => {
    client = new Fetcher();
  });

  beforeEach(() => {
    alert = new Alert(client, { ...AlertData });
  });

  afterEach(() => {
    mockFetch.restore();
  });

  it('will return properties correctly', () => {
    expect(alert.id).toBe(AlertData.id);
    expect(alert.icon).toBe(AlertData.icon);
    expect(alert.title).toBe(AlertData.title);
    expect(alert.message).toBe(AlertData.message);
    expect(alert.active).toEqual(AlertData.active);
    expect(alert.expires).toEqual(AlertData.expires);
  });

  it('will return an alert as a JSON DTO', () => {
    expect(alert.toJSON()).toEqual(AlertData);
  });

  it('will allow properties to be updated', () => {
    const newIcon = 'fas fa-exclamation';
    const newTitle = 'Warning Alert';
    const newMessage = 'This is a warning alert.';
    const newActive = new Date('2024-05-27T14:56:09.288Z');

    alert.icon = newIcon;
    alert.title = newTitle;
    alert.message = newMessage;
    alert.active = newActive;
    alert.expires = undefined;

    expect(alert.icon).toBe(newIcon);
    expect(alert.title).toBe(newTitle);
    expect(alert.message).toBe(newMessage);
    expect(alert.active).toEqual(newActive);
    expect(alert.expires).toBeUndefined();
  });

  it('will save changes to an alert', async () => {
    mockFetch.put(`/api/alerts/${alert.id}`, {
      status: 200,
      body: alert.toJSON(),
    });

    await alert.save();

    expect(mockFetch.done()).toBe(true);
    expect(mockFetch.lastCall()?.[1]?.body).toBe(
      JSON.stringify({
        icon: alert.icon,
        title: alert.title,
        message: alert.message,
        active: alert.active,
        expires: alert.expires,
      }),
    );
  });

  it('will delete an alert', async () => {
    mockFetch.delete(`/api/alerts/${alert.id}`, 200);
    await alert.delete();
    expect(mockFetch.done()).toBe(true);
  });
});
