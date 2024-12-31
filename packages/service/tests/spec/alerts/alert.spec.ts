import { Repository } from 'typeorm';

import { Alert } from '../../../src/alerts';
import { AlertEntity, UserEntity } from '../../../src/data';
import { dataSource } from '../../data-source';
import { createTestAlert } from '../../utils/create-test-alert';
import { createTestUser } from '../../utils/create-test-user';

const UserId = 'ef22d6c2-b0f1-48de-8c60-a6c043badd27';
const AlertMessage = `
## Test Message

This message is awesome and supports markdown.
* Markdown is cool.
* Just need to render it as HTML.
`;
const AlertData: Partial<AlertEntity> = {
  id: '73dc64a0-5e67-4c00-836e-28716acfb497',
  icon: 'fas fa-exclamation-triangle',
  title: 'Test Alert',
  message: AlertMessage,
  active: new Date('2024-03-26T15:02:14.037Z'),
  expires: new Date('2024-04-26T15:02:14.037Z'),
};

describe('Alert class', () => {
  let Alerts: Repository<AlertEntity>;
  let Users: Repository<UserEntity>;

  let alertData: AlertEntity;
  let alert: Alert;

  beforeAll(() => {
    Alerts = dataSource.getRepository(AlertEntity);
    Users = dataSource.getRepository(UserEntity);
  });

  beforeEach(() => {
    alertData = createTestAlert(AlertData);
    alert = new Alert(Alerts, alertData);
  });

  it('will return properties correctly', () => {
    expect(alert.id).toBe(alertData.id);
    expect(alert.icon).toBe(alertData.icon);
    expect(alert.title).toBe(alertData.title);
    expect(alert.message).toBe(alertData.message);
    expect(alert.active).toEqual(alertData.active);
    expect(alert.expires).toEqual(alertData.expires);
  });

  it('will return optional fields as undefined if they are not set', () => {
    alertData.expires = null;
    expect(alert.expires).toBeUndefined();
  });

  it('will allow properties to be updated', () => {
    const newIcon = 'fas fa-user';
    const newTitle = 'New Title';
    const newMessage = 'New Message';
    const newActive = new Date('2023-03-26T15:02:14.037Z');
    const newExpires = new Date('2025-04-26T15:02:14.037Z');

    alert.icon = newIcon;
    alert.title = newTitle;
    alert.message = newMessage;
    alert.active = newActive;
    alert.expires = newExpires;

    expect(alert.icon).toBe(newIcon);
    expect(alert.title).toBe(newTitle);
    expect(alert.message).toBe(newMessage);
    expect(alert.active).toEqual(newActive);
    expect(alert.expires).toEqual(newExpires);
  });

  it('will render the alert as JSON', () => {
    expect(alert.toJSON()).toEqual({
      id: alertData.id,
      icon: alertData.icon,
      title: alertData.title,
      message: alertData.message,
      active: alertData.active.valueOf(),
      expires: alertData.expires?.valueOf(),
    });
  });

  it('will save a new alert', async () => {
    await alert.save();

    const result = await Alerts.findOneByOrFail({ id: alert.id });
    expect(result.icon).toBe(alert.icon);
    expect(result.title).toBe(alert.title);
    expect(result.message).toBe(alert.message);
    expect(result.active).toEqual(alert.active);
    expect(result.expires).toEqual(alert.expires);
  });

  it('will update an existing alert', async () => {
    await Alerts.save(alertData);

    const newIcon = 'fas fa-user';
    const newTitle = 'New Title';
    const newMessage = 'New Message';
    const newActive = new Date('2023-03-26T15:02:14.037Z');
    const newExpires = new Date('2025-04-26T15:02:14.037Z');

    alert.icon = newIcon;
    alert.title = newTitle;
    alert.message = newMessage;
    alert.active = newActive;
    alert.expires = newExpires;

    await alert.save();

    const result = await Alerts.findOneByOrFail({ id: alert.id });
    expect(result.icon).toBe(newIcon);
    expect(result.title).toBe(newTitle);
    expect(result.message).toBe(newMessage);
    expect(result.active).toEqual(newActive);
    expect(result.expires).toEqual(newExpires);
  });

  it('will delete an existing alert', async () => {
    await Alerts.save(alertData);
    await alert.delete();
    await expect(Alerts.findOneBy({ id: alertData.id })).resolves.toBeNull();
  });

  it('will do nothing if delete is called against an alert that does not exist in the database', async () => {
    await alert.delete();
    await expect(Alerts.findOneBy({ id: alertData.id })).resolves.toBeNull();
  });

  it('will delete all dismissals associated with an alert', async () => {
    const userData: UserEntity[] = [
      createTestUser(),
      createTestUser(),
      createTestUser(),
      createTestUser(),
      createTestUser(),
    ];
    await Users.save(userData);
    await Alerts.save(alertData);
    await Alerts.createQueryBuilder()
      .relation(AlertEntity, 'dismissals')
      .of(alertData)
      .add(userData);

    await alert.delete();

    const dismissals = await Alerts.query(`SELECT * FROM alert_dismissals`);
    expect(dismissals).toHaveLength(0);
  });

  it('will mark an alert as dismissed for a user', async () => {
    const userData = createTestUser({ id: UserId });
    await Users.save(userData);
    await Alerts.save(alertData);

    await alert.dismiss(UserId);

    await Alerts.findOneOrFail({
      relations: ['dismissals'],
      where: { id: alert.id, dismissals: { id: UserId } },
      select: ['id'],
    });
  });

  it('will do nothing if an alert is already dismissed for a user', async () => {
    const userData = createTestUser({ id: UserId });
    await Users.save(userData);
    await Alerts.save(alertData);

    await alert.dismiss(UserId);
    await alert.dismiss(UserId);

    await Alerts.findOneOrFail({
      relations: ['dismissals'],
      where: { id: alert.id, dismissals: { id: UserId } },
      select: ['id'],
    });
  });

  it("will not mess with other user's dismissals when dismissing an alert for a user", async () => {
    const userData = createTestUser({ id: UserId });
    const otherUserId = 'f6c6f6b9-7c6b-4b2f-8c7b-4c6b6f6b6f6b';
    const otherUserData = createTestUser({ id: otherUserId });
    await Users.save([userData, otherUserData]);
    await Alerts.save(alertData);
    await Alerts.createQueryBuilder()
      .relation(AlertEntity, 'dismissals')
      .of(alertData)
      .add({ id: otherUserId });

    await alert.dismiss(UserId);

    await Promise.all([
      Alerts.findOneOrFail({
        relations: ['dismissals'],
        where: { id: alert.id, dismissals: { id: UserId } },
        select: ['id'],
      }),

      Alerts.findOneOrFail({
        relations: ['dismissals'],
        where: { id: alert.id, dismissals: { id: otherUserId } },
        select: ['id'],
      }),
    ]);
  });
});
