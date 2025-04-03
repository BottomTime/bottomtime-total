import { LogEntrySortBy, SortOrder } from '@bottomtime/api';

import { bufferCount, defaultIfEmpty, lastValueFrom } from 'rxjs';
import { LogEntryAirEntity, LogEntryEntity, UserEntity } from 'src/data';
import { LogEntryFactory } from 'src/logEntries';
import { LogEntryExportService } from 'src/logEntries/export/log-entry-export.service';
import { User, UserFactory } from 'src/users';
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
  let userFactory: UserFactory;
  let owner: User;
  let entries: LogEntryEntity[];
  let air: LogEntryAirEntity[];
  let service: LogEntryExportService;

  beforeAll(() => {
    Air = dataSource.getRepository(LogEntryAirEntity);
    Entries = dataSource.getRepository(LogEntryEntity);
    Users = dataSource.getRepository(UserEntity);

    userFactory = createUserFactory();
    owner = userFactory.createUser(createTestUser());
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

  it('will stream log entries with some search filters', async () => {
    const startDate = Date.now() - 1000 * 60 * 60 * 24 * 100;
    const expected = entries.filter(
      (entry) =>
        (entry.rating ?? 0) >= 2.5 &&
        (entry.rating ?? 0) <= 5 &&
        entry.entryTime.valueOf() >= startDate,
    );
    const results = await lastValueFrom(
      service
        .beginExport({
          owner,
          maxRating: 5,
          minRating: 2.5,
          startDate,
          endDate: Date.now(),
        })
        .pipe(bufferCount(500)),
    );
    expect(results).toHaveLength(expected.length);
    results.forEach((entry, index) => {
      expect(entry.toJSON()).toEqual(
        entryFactory.createLogEntry(expected[index]).toJSON(),
      );
    });
  });

  it('will limit results to specific ids', async () => {
    const ids = [
      entries[0].id,
      entries[13].id,
      entries[26].id,
      entries[303].id,
      entries[411].id,
    ];
    const idSet = new Set(ids);
    const results = await lastValueFrom(
      service
        .beginExport({
          owner,
          include: ids,
        })
        .pipe(bufferCount(500)),
    );
    expect(results).toHaveLength(ids.length);
    results.forEach((entry) => {
      expect(idSet.has(entry.id)).toBe(true);
    });
  });

  it('will omit specific ids', async () => {
    const ids = [
      entries[0].id,
      entries[13].id,
      entries[26].id,
      entries[303].id,
      entries[411].id,
    ];
    const idSet = new Set(ids);
    const results = await lastValueFrom(
      service
        .beginExport({
          owner,
          omit: ids,
        })
        .pipe(bufferCount(500)),
    );
    expect(results).toHaveLength(entries.length - ids.length);
    results.forEach((entry) => {
      expect(idSet.has(entry.id)).toBe(false);
    });
  });

  it('will stream log entries with a different sort order', async () => {
    const expected = entries.sort(
      (a, b) => a.entryTime.valueOf() - b.entryTime.valueOf(),
    );
    const results = await lastValueFrom(
      service
        .beginExport({
          owner,
          sortBy: LogEntrySortBy.EntryTime,
          sortOrder: SortOrder.Ascending,
        })
        .pipe(bufferCount(500)),
    );
    expect(results).toHaveLength(expected.length);
    results.forEach((entry, index) => {
      expect(entry.toJSON()).toEqual(
        entryFactory.createLogEntry(expected[index]).toJSON(),
      );
    });
  });

  it('will return an empty stream if no log entries are returned by the filter', async () => {
    const otherUser = createTestUser();
    await Users.save(otherUser);
    const result = await lastValueFrom(
      service
        .beginExport({ owner: userFactory.createUser(otherUser) })
        .pipe(defaultIfEmpty(null)),
    );
    expect(result).toBeNull();
  });
});
