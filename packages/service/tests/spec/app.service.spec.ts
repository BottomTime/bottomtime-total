import { Repository } from 'typeorm';

import { AppService } from '../../src/app.service';
import { DiveSiteEntity, LogEntryEntity, UserEntity } from '../../src/data';
import { dataSource } from '../data-source';

describe('AppService', () => {
  let Users: Repository<UserEntity>;
  let DiveSites: Repository<DiveSiteEntity>;
  let LogEntries: Repository<LogEntryEntity>;

  let service: AppService;

  beforeEach(() => {
    Users = dataSource.getRepository(UserEntity);
    DiveSites = dataSource.getRepository(DiveSiteEntity);
    LogEntries = dataSource.getRepository(LogEntryEntity);

    service = new AppService(Users, DiveSites, LogEntries);
  });

  it.todo('Create a more realistic test for the getMetrics() method');

  it('will return metrics upon request', async () => {
    const metrics = await service.getMetrics();
    expect(metrics).toMatchSnapshot();
  });
});
