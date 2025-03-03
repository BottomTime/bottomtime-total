import { BuddyType } from '@bottomtime/api';

import { Repository } from 'typeorm';

import { AgencyFactory } from '../../../src/certifications';
import {
  AgencyEntity,
  LogEntryEntity,
  LogEntrySignatureEntity,
  UserEntity,
} from '../../../src/data';
import { LogEntrySignature } from '../../../src/logEntries';
import { UserFactory } from '../../../src/users';
import { dataSource } from '../../data-source';
import {
  createAgencyFactory,
  createTestLogEntry,
  createTestUser,
  createUserFactory,
} from '../../utils';

const TestAgency: AgencyEntity = {
  id: 'ee71a332-98da-4d20-953d-4b91a5551647',
  name: 'Test Agency',
  logo: '',
  longName: 'Test Agency Long Name',
  ordinal: 1,
  website: 'https://test.agency',
} as const;

const OtherAgency: AgencyEntity = {
  id: '8c6ac7bb-754d-4860-a86a-d45bdf87942c',
  name: 'New Agency',
  logo: '',
  longName: 'New Agency Long Name',
  ordinal: 2,
  website: 'https://new.agency',
} as const;

describe('LogEntrySignature class', () => {
  let Users: Repository<UserEntity>;
  let Agencies: Repository<AgencyEntity>;
  let LogEntries: Repository<LogEntryEntity>;
  let Signatures: Repository<LogEntrySignatureEntity>;

  let agencyFactory: AgencyFactory;
  let userFactory: UserFactory;

  let userData: UserEntity;
  let buddyData: UserEntity;
  let logEntryData: LogEntryEntity;
  let testData: LogEntrySignatureEntity;
  let signature: LogEntrySignature;

  beforeAll(() => {
    Signatures = dataSource.getRepository(LogEntrySignatureEntity);
    Agencies = dataSource.getRepository(AgencyEntity);
    LogEntries = dataSource.getRepository(LogEntryEntity);
    Users = dataSource.getRepository(UserEntity);

    userFactory = createUserFactory();
    agencyFactory = createAgencyFactory();
  });

  beforeEach(async () => {
    userData = createTestUser();
    buddyData = createTestUser();
    logEntryData = createTestLogEntry(userData);

    testData = {
      id: 'b0ddc28e-d7bb-4af2-8c02-355a3e14539d',
      certificationNumber: '123456',
      signed: new Date('2021-09-01T12:00:00Z'),
      type: BuddyType.Instructor,
      agency: { ...TestAgency },
      buddy: buddyData,
      logEntry: logEntryData,
    };
    signature = new LogEntrySignature(
      Signatures,
      userFactory,
      agencyFactory,
      testData,
    );

    await Users.save([userData, buddyData]);
    await Agencies.save([TestAgency, OtherAgency]);
    await LogEntries.save(logEntryData);
  });

  it('will return properties correctly', () => {
    expect(signature.id).toBe(testData.id);
    expect(signature.signedOn).toEqual(testData.signed);
    expect(signature.buddy.id).toBe(buddyData.id);
    expect(signature.buddyType).toBe(testData.type);
    expect(signature.agency?.id).toBe(TestAgency.id);
    expect(signature.certificationNumber).toBe(testData.certificationNumber);
  });

  it('will return undefined for properties that are not set', () => {
    testData.agency = undefined;
    testData.certificationNumber = null;
    expect(signature.agency).toBeUndefined();
    expect(signature.certificationNumber).toBeUndefined();
  });

  it('will allow properties to be updated', async () => {
    const newAgency = agencyFactory.createAgency(OtherAgency);
    signature.agency = newAgency;
    signature.buddyType = BuddyType.Buddy;
    signature.certificationNumber = '654321';

    expect(signature.agency?.id).toBe(newAgency.id);
    expect(signature.buddyType).toBe(BuddyType.Buddy);
    expect(signature.certificationNumber).toBe('654321');
  });

  it('will render as JSON', () => {
    expect(signature.toJSON()).toEqual({
      agency: {
        id: TestAgency.id,
        logo: TestAgency.logo,
        longName: TestAgency.longName,
        name: TestAgency.name,
        website: TestAgency.website,
      },
      buddy: {
        accountTier: buddyData.accountTier,
        avatar: buddyData.avatar,
        bio: buddyData.bio,
        experienceLevel: buddyData.experienceLevel,
        location: buddyData.location,
        logBookSharing: buddyData.logBookSharing,
        memberSince: buddyData.memberSince.valueOf(),
        name: buddyData.name,
        startedDiving: buddyData.startedDiving,
        userId: buddyData.id,
        username: buddyData.username,
      },
      certificationNumber: testData.certificationNumber,
      id: testData.id,
      signedOn: testData.signed.valueOf(),
      type: testData.type,
    });
  });

  it('will save a new signature to the database', async () => {
    await signature.save();
    const saved = await Signatures.findOneOrFail({
      where: { id: testData.id },
      relations: ['buddy', 'agency'],
    });
    expect(saved.buddy!.id).toBe(buddyData.id);
    expect(saved.agency!.id).toBe(TestAgency.id);
    expect(saved.certificationNumber).toBe(testData.certificationNumber);
    expect(saved.signed).toEqual(testData.signed);
    expect(saved.type).toBe(testData.type);
  });

  it('will save updates to a signature', async () => {
    await Signatures.save(testData);

    const newAgency = agencyFactory.createAgency(OtherAgency);
    signature.agency = newAgency;
    signature.buddyType = BuddyType.Buddy;
    signature.certificationNumber = '654321';

    await signature.save();
    const saved = await Signatures.findOneOrFail({
      where: { id: testData.id },
      relations: ['buddy', 'agency'],
    });
    expect(saved.agency!.id).toBe(OtherAgency.id);
    expect(saved.certificationNumber).toBe('654321');
    expect(saved.type).toBe(BuddyType.Buddy);
  });

  it('will delete a signature', async () => {
    await Signatures.save(testData);
    await expect(signature.delete()).resolves.toBe(true);
    await expect(Signatures.findOneBy({ id: testData.id })).resolves.toBeNull();
  });

  it('will do nothing when deleting a signature that does not exist', async () => {
    await expect(signature.delete()).resolves.toBe(false);
  });
});
