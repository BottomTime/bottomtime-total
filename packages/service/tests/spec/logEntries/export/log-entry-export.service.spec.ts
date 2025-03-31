import { bufferCount, lastValueFrom } from 'rxjs';
import { LogEntryAirEntity, LogEntryEntity, UserEntity } from 'src/data';
import { LogEntryFactory } from 'src/logEntries';
import { LogEntryExportService } from 'src/logEntries/export/log-entry-export.service';
import { User } from 'src/users';
import { dataSource } from 'tests/data-source';
import {
  createTestLogEntry,
  createTestUser,
  createUserFactory,
} from 'tests/utils';
import { createLogEntryFactory } from 'tests/utils/create-log-entry-factory';
import { Repository } from 'typeorm';

describe('LogEntryExportService', () => {
  let Air: Repository<LogEntryAirEntity>;
  let Entries: Repository<LogEntryEntity>;
  let Users: Repository<UserEntity>;

  let entryFactory: LogEntryFactory;
  let owner: User;
  let entries: LogEntryEntity[];
  let air: LogEntryAirEntity[];
  let service: LogEntryExportService;

  beforeAll(() => {
    Air = dataSource.getRepository(LogEntryAirEntity);
    Entries = dataSource.getRepository(LogEntryEntity);
    Users = dataSource.getRepository(UserEntity);

    owner = createUserFactory().createUser(createTestUser());
    entries = Array.from({ length: 450 }, () =>
      createTestLogEntry(owner.toEntity()),
    ).sort((a, b) => b.entryTime.valueOf() - a.entryTime.valueOf());
    air = entries.reduce<LogEntryAirEntity[]>((acc, entry) => {
      if (entry.air) acc.push(...entry.air);
      return acc;
    }, []);

    entryFactory = createLogEntryFactory();
    service = new LogEntryExportService(Entries, entryFactory);
  });

  beforeEach(async () => {
    await Users.save(owner.toEntity());
    await Entries.save(entries);
    await Air.save(air);
  });

  it('will stream log entries, unfiltered', async () => {
    const results = await lastValueFrom(
      service.beginExport({ owner }).pipe(bufferCount(500)),
    );
    expect(results).toHaveLength(entries.length);
    results.forEach((entry, index) => {
      expect(entry.toJSON()).toEqual(
        entryFactory.createLogEntry(entries[index]).toJSON(),
      );
    });
  });
});
