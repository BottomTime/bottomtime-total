import { CreateOrUpdateAlertParamsDTO } from '@bottomtime/api';

import { Repository } from 'typeorm';

import { AlertsService } from '../../../src/alerts';
import { AlertEntity, UserEntity } from '../../../src/data';
import { dataSource } from '../../data-source';
import AlertTestData from '../../fixtures/alerts.json';
import { parseAlertJSON } from '../../utils/create-test-alert';
import { createTestUser } from '../../utils/create-test-user';

describe('Alerts Service', () => {
  let Alerts: Repository<AlertEntity>;
  let Users: Repository<UserEntity>;
  let service: AlertsService;
  let alertData: AlertEntity[];

  beforeAll(() => {
    Alerts = dataSource.getRepository(AlertEntity);
    Users = dataSource.getRepository(UserEntity);
    service = new AlertsService(Alerts);

    alertData = AlertTestData.map((data) => parseAlertJSON(data));
  });

  describe('when listing alerts', () => {
    let user: UserEntity;

    beforeAll(() => {
      user = createTestUser();
    });

    beforeEach(async () => {
      await Promise.all([Alerts.save(alertData), Users.save(user)]);
      await Promise.all(
        alertData
          .slice(0, 8)
          .map((alert) =>
            Alerts.createQueryBuilder()
              .relation('dismissals')
              .of(alert)
              .add(user),
          ),
      );
    });

    it('will return all alerts for anonymous users', async () => {
      const results = await service.listAlerts({});

      expect(results.totalCount).toBe(alertData.length);
      expect(results.alerts).toHaveLength(10);
      expect(results.alerts).toMatchSnapshot();
    });

    it('will return non-dismissed alerts by default', async () => {
      const results = await service.listAlerts({ userId: user.id });
      expect(results.totalCount).toBe(12);
      expect(results.alerts).toHaveLength(10);
      expect(results.alerts).toMatchSnapshot();
    });

    it('will return all alerts if requested', async () => {
      const results = await service.listAlerts({
        userId: user.id,
        showDismissed: true,
      });
      expect(results.totalCount).toBe(alertData.length);
      expect(results.alerts).toHaveLength(10);
      expect(results.alerts).toMatchSnapshot();
    });

    it('will allow pagination of results', async () => {
      const results = await service.listAlerts({
        userId: user.id,
        skip: 7,
        limit: 6,
      });
      expect(results.totalCount).toBe(12);
      expect(results.alerts).toHaveLength(5);
      expect(results.alerts).toMatchSnapshot();
    });

    it('will return an empty result set if no alerts can be found', async () => {
      await Alerts.delete({});
      const results = await service.listAlerts({});
      expect(results).toEqual({
        alerts: [],
        totalCount: 0,
      });
    });
  });

  describe('when retrieving a single alert', () => {
    let userData: UserEntity;
    let alert: AlertEntity;

    beforeAll(() => {
      userData = createTestUser();
      alert = alertData[0];
    });

    beforeEach(async () => {
      await Promise.all([Users.save(userData), Alerts.save(alert)]);
    });

    it('will retrieve the indicated alert', async () => {
      const result = await service.getAlert(alert.id);
      expect(result).toBeDefined();
      expect(result?.id).toBe(alert.id);
      expect(result?.icon).toBe(alert.icon);
      expect(result?.title).toBe(alert.title);
      expect(result?.message).toBe(alert.message);
      expect(result?.active).toEqual(alert.active);
      expect(result?.expires).toEqual(alert.expires);
    });

    it('will return undefined if the alert does not exist', async () => {
      const result = await service.getAlert(
        'dc8aa023-7d70-4b10-8fae-f4cfefe10c92',
      );
      expect(result).toBeUndefined();
    });
  });

  it('will create a new alert and return it', async () => {
    const options: CreateOrUpdateAlertParamsDTO = {
      active: new Date('2023-03-26T15:02:14.037Z'),
      expires: new Date('2025-04-26T15:02:14.037Z'),
      icon: 'fas fa-user',
      message: 'This is a test alert.',
      title: 'Test Alert',
    };

    const alert = await service.createAlert(options);
    expect(alert.active).toEqual(options.active);
    expect(alert.expires).toEqual(options.expires);
    expect(alert.icon).toBe(options.icon);
    expect(alert.message).toBe(options.message);
    expect(alert.title).toBe(options.title);

    const saved = await Alerts.findOneByOrFail({ id: alert.id });
    expect(saved.active).toEqual(options.active);
    expect(saved.expires).toEqual(options.expires);
    expect(saved.icon).toBe(options.icon);
    expect(saved.message).toBe(options.message);
    expect(saved.title).toBe(options.title);
  });
});
