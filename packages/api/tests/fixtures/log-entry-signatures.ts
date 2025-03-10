import { BuddyType, LogEntrySignatureDTO } from '../../src';
import { TestAgencies } from './agencies';
import { BasicUser, UserWithEmptyProfile } from './users';

export const TestSignatures: LogEntrySignatureDTO[] = [
  {
    buddy: BasicUser.profile,
    id: '2635431a-bad0-4a3f-82d0-594eb612a390',
    signedOn: new Date('2025-03-05T12:44:25-05:00').valueOf(),
    type: BuddyType.Buddy,
  },
  {
    buddy: UserWithEmptyProfile.profile,
    id: '4c0ede0c-43e9-4564-997a-ad122c55a66c',
    signedOn: new Date('2025-03-05T12:44:25-05:00').valueOf(),
    type: BuddyType.Instructor,
    agency: TestAgencies[0],
    certificationNumber: '123456',
  },
] as const;
