import { AlertDTO } from '@bottomtime/api';

import axios, { AxiosInstance } from 'axios';

import { Alert } from '../../src/client';

const AlertData: AlertDTO = {
  id: 'b80cad85-108d-4113-92db-be9ec9fe0aae',
  icon: 'fas fa-info',
  title: 'Informational Alert',
  message: 'This is an informational alert.',
  active: new Date('2024-03-27T14:56:09.288Z'),
  expires: new Date('2024-04-27T14:56:09.288Z'),
};

describe('Alert API class', () => {
  let client: AxiosInstance;
  let alert: Alert;

  beforeAll(() => {
    client = axios.create();
  });

  beforeEach(() => {
    alert = new Alert(client, { ...AlertData });
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
    const spy = jest
      .spyOn(client, 'put')
      .mockResolvedValueOnce({ data: { ...AlertData } });

    await alert.save();

    expect(spy).toHaveBeenCalledWith(`/api/alerts/${AlertData.id}`, {
      icon: AlertData.icon,
      title: AlertData.title,
      message: AlertData.message,
      active: AlertData.active,
      expires: AlertData.expires,
    });
  });

  it('will delete an alert', async () => {
    const spy = jest.spyOn(client, 'delete').mockResolvedValueOnce({});
    await alert.delete();
    expect(spy).toHaveBeenCalledWith(`/api/alerts/${AlertData.id}`);
  });
});
