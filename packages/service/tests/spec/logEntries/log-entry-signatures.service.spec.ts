import { BuddyType } from '@bottomtime/api';

import { ConflictException } from '@nestjs/common';

import { Repository } from 'typeorm';

import { AgencyFactory } from '../../../src/certifications';
import {
  AgencyEntity,
  LogEntryEntity,
  LogEntrySignatureEntity,
  UserEntity,
} from '../../../src/data';
import {
  LogEntry,
  LogEntryFactory,
  LogEntrySignatureFactory,
} from '../../../src/logEntries';
import { LogEntrySignaturesService } from '../../../src/logEntries/log-entry-signatures.service';
import { UserFactory } from '../../../src/users';
import { dataSource } from '../../data-source';
import { TestAgencies } from '../../fixtures/agencies';
import {
  createAgencyFactory,
  createLogEntrySignatureFactory,
  createTestLogEntry,
  createTestUser,
  createUserFactory,
} from '../../utils';
import { createLogEntryFactory } from '../../utils/create-log-entry-factory';

describe('Log Entries Signatures Service', () => {
  let Agencies: Repository<AgencyEntity>;
  let LogEntries: Repository<LogEntryEntity>;
  let Users: Repository<UserEntity>;
  let Signatures: Repository<LogEntrySignatureEntity>;
  let agencyFactory: AgencyFactory;
  let signatureFactory: LogEntrySignatureFactory;
  let logEntryFactory: LogEntryFactory;
  let userFactory: UserFactory;

  let service: LogEntrySignaturesService;

  let userData: UserEntity;
  let buddyData: UserEntity[];
  let entryData: LogEntryEntity;
  let signatures: LogEntrySignatureEntity[];
  let otherEntry: LogEntryEntity;
  let otherSignature: LogEntrySignatureEntity;

  let logEntry: LogEntry;

  beforeAll(() => {
    Agencies = dataSource.getRepository(AgencyEntity);
    LogEntries = dataSource.getRepository(LogEntryEntity);
    Signatures = dataSource.getRepository(LogEntrySignatureEntity);
    Users = dataSource.getRepository(UserEntity);

    agencyFactory = createAgencyFactory();
    signatureFactory = createLogEntrySignatureFactory();
    logEntryFactory = createLogEntryFactory();
    userFactory = createUserFactory();

    userData = createTestUser();
    buddyData = Array.from({ length: 4 }, () => createTestUser());
    entryData = createTestLogEntry(userData);
    signatures = [
      {
        id: 'ae465200-d2ad-4b0d-bd43-f5af23385330',
        buddy: buddyData[0],
        logEntry: entryData,
        signed: new Date('2021-01-01T00:00:00Z'),
        type: BuddyType.Buddy,
        certificationNumber: null,
      },
      {
        id: '6d299310-d2a3-4893-b156-dd8cb6594196',
        buddy: buddyData[1],
        logEntry: entryData,
        signed: new Date('2021-01-02T00:00:00Z'),
        certificationNumber: 'AB-123456',
        type: BuddyType.Divemaster,
        agency: TestAgencies[0],
      },
      {
        id: '80b19856-ab84-43f5-9f8f-91474376ae65',
        buddy: buddyData[2],
        logEntry: entryData,
        signed: new Date('2021-01-02T08:00:00Z'),
        certificationNumber: 'XY-987654',
        type: BuddyType.Instructor,
        agency: TestAgencies[1],
      },
    ];

    logEntry = logEntryFactory.createLogEntry(entryData);

    service = new LogEntrySignaturesService(Signatures, signatureFactory);
  });

  beforeEach(async () => {
    otherEntry = createTestLogEntry(userData);
    otherSignature = {
      id: '72c32c4f-ef30-4661-a610-c13e1d023a64',
      buddy: buddyData[0],
      logEntry: otherEntry,
      signed: new Date('2021-01-01T00:00:00Z'),
      type: BuddyType.Buddy,
      certificationNumber: null,
    };
    await Users.save([userData, ...buddyData]);
    await Agencies.save(TestAgencies);
    await LogEntries.save([entryData, otherEntry]);
    await Signatures.save([...signatures, otherSignature]);
  });

  it('will list signatures for a log entry', async () => {
    const results = await service.listSignatures(logEntry);

    expect(results.totalCount).toBe(3);
    expect(results.data).toHaveLength(3);
    expect(results.data[0].id).toBe(signatures[2].id);
    expect(results.data[0].buddy.id).toBe(buddyData[2].id);
    expect(results.data[0].signedOn).toEqual(signatures[2].signed);
    expect(results.data[0].agency!.id).toBe(TestAgencies[1].id);
    expect(results.data[0].certificationNumber).toBe(
      signatures[2].certificationNumber,
    );

    expect(results.data[1].id).toBe(signatures[1].id);
    expect(results.data[1].buddy.id).toBe(buddyData[1].id);
    expect(results.data[1].signedOn).toEqual(signatures[1].signed);
    expect(results.data[1].agency!.id).toBe(TestAgencies[0].id);
    expect(results.data[1].certificationNumber).toBe(
      signatures[1].certificationNumber,
    );

    expect(results.data[2].id).toBe(signatures[0].id);
    expect(results.data[2].buddy.id).toBe(buddyData[0].id);
    expect(results.data[2].signedOn).toEqual(signatures[0].signed);
    expect(results.data[2].agency).toBeUndefined();
    expect(results.data[2].certificationNumber).toBeUndefined();
  });

  describe('when retrieving a signature by ID', () => {
    it('will return the signature if it exists', async () => {
      const signature = await service.getSignature(logEntry, signatures[1].id);
      expect(signature).toBeDefined();
      expect(signature!.id).toBe(signatures[1].id);
      expect(signature!.agency!.id).toBe(TestAgencies[0].id);
      expect(signature!.certificationNumber).toBe(
        signatures[1].certificationNumber,
      );
      expect(signature!.buddy.id).toBe(buddyData[1].id);
    });

    it('will return undefined if the signature does not exist', async () => {
      await expect(
        service.getSignature(logEntry, '303b789a-a932-4125-a94d-63a766d3eb4e'),
      ).resolves.toBeUndefined;
    });

    it('will return undefined if the signature belongs to a different log entry', async () => {
      await expect(
        service.getSignature(logEntry, otherSignature.id),
      ).resolves.toBeUndefined();
    });
  });

  describe('when retrieving a signature by buddy', () => {
    it('will return the signature if it exists', async () => {
      const signature = await service.getSignatureByBuddy(
        logEntry,
        userFactory.createUser(buddyData[1]),
      );
      expect(signature).toBeDefined();
      expect(signature!.id).toBe(signatures[1].id);
      expect(signature!.agency!.id).toBe(TestAgencies[0].id);
      expect(signature!.certificationNumber).toBe(
        signatures[1].certificationNumber,
      );
      expect(signature!.buddy.id).toBe(buddyData[1].id);
    });

    it('will return undefined if the log entry was not signed by the indicated buddy', async () => {
      await expect(
        service.getSignatureByBuddy(
          logEntry,
          userFactory.createUser(buddyData[3]),
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('when adding a new signature', () => {
    it('will add the signature to the log entry', async () => {
      const options = {
        buddy: userFactory.createUser(buddyData[3]),
        buddyType: BuddyType.Instructor,
        agency: agencyFactory.createAgency(TestAgencies[2]),
        certificationNumber: 'CD-123456',
      };
      const signature = await service.addSignature(logEntry, options);
      expect(signature.agency?.id).toBe(TestAgencies[2].id);
      expect(signature.certificationNumber).toBe(options.certificationNumber);
      expect(signature.buddy.id).toBe(buddyData[3].id);
      expect(signature.buddyType).toBe(options.buddyType);
      expect(signature.signedOn.valueOf()).toBeCloseTo(Date.now(), -3);

      const saved = await Signatures.findOneOrFail({
        where: { id: signature.id },
        relations: ['buddy', 'agency'],
      });
      expect(saved.agency?.id).toBe(TestAgencies[2].id);
      expect(saved.certificationNumber).toBe(options.certificationNumber);
      expect(saved.buddy.id).toBe(buddyData[3].id);
      expect(saved.type).toBe(options.buddyType);
    });

    it('will throw an exception if the indicated buddy has already signed the log entry', async () => {
      await expect(
        service.addSignature(logEntry, {
          buddy: userFactory.createUser(buddyData[0]),
          agency: agencyFactory.createAgency(TestAgencies[2]),
          certificationNumber: 'CD-123456',
          buddyType: BuddyType.Divemaster,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });
});
