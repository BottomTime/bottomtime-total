import {
  AccountTier,
  DepthUnit,
  LogBookSharing,
  PressureUnit,
  TemperatureUnit,
  UserRole,
  WeightUnit,
} from '@bottomtime/api';

import { Repository } from 'typeorm';

import { UserEntity } from '../../../src/data';
import { Profile, UpdateProfileOptions } from '../../../src/users/profile';
import { dataSource } from '../../data-source';

const TestUserData: UserEntity = {
  id: 'bdb62177-2086-4d45-a46b-3120b33dab7a',
  accountTier: AccountTier.Basic,
  emailVerified: true,
  isLockedOut: false,
  memberSince: new Date('2020-01-01T00:00:00.000Z'),
  role: UserRole.User,
  username: 'testuser',
  usernameLowered: 'testuser',
  avatar: 'https://example.com/avatar.png',
  bio: 'I am a test user.',
  email: null,
  emailLowered: null,
  emailVerificationToken: null,
  emailVerificationTokenExpiration: null,
  lastLogin: null,
  lastPasswordChange: null,
  logBookSharing: LogBookSharing.FriendsOnly,
  passwordHash: null,
  passwordResetToken: null,
  passwordResetTokenExpiration: null,
  customData: {
    acceptedCookies: true,
  },
  experienceLevel: 'Advanced',
  location: 'Testville, USA',
  name: 'Test User',
  startedDiving: '2019-01-01',
  stripeCustomerId: null,
  depthUnit: DepthUnit.Meters,
  pressureUnit: PressureUnit.Bar,
  temperatureUnit: TemperatureUnit.Celsius,
  weightUnit: WeightUnit.Kilograms,
  oauth: undefined,
  tanks: undefined,
  xp: 0,
} as const;

describe('Profile Class', () => {
  let Users: Repository<UserEntity>;
  let profile: Profile;

  beforeEach(async () => {
    const data = Object.assign({}, TestUserData);
    Users = dataSource.getRepository(UserEntity);
    profile = new Profile(Users, data);
  });

  it('will return properties correctly', () => {
    expect(profile.avatar).toBe(TestUserData.avatar);
    expect(profile.bio).toBe(TestUserData.bio);
    expect(profile.experienceLevel).toBe(TestUserData.experienceLevel);
    expect(profile.logBookSharing).toBe(TestUserData.logBookSharing);
    expect(profile.location).toBe(TestUserData.location);
    expect(profile.name).toBe(TestUserData.name);
    expect(profile.startedDiving).toBe(TestUserData.startedDiving);
  });

  it('will update properties', async () => {
    const options: UpdateProfileOptions = {
      bio: 'Definitely, a new bio.',
      experienceLevel: 'Beginner',
      location: 'Somewhere, Mexico',
      logBookSharing: LogBookSharing.Public,
      name: 'Testy McTesterson',
      startedDiving: '2100-01-01',
    };
    await profile.update(options);

    expect(profile.bio).toBe(options.bio);
    expect(profile.experienceLevel).toBe(options.experienceLevel);
    expect(profile.location).toBe(options.location);
    expect(profile.logBookSharing).toBe(options.logBookSharing);
    expect(profile.name).toBe(options.name);
    expect(profile.startedDiving).toBe(options.startedDiving);

    const result = await Users.findOne({
      where: { id: TestUserData.id },
    });

    expect(result?.bio).toEqual(options.bio);
    expect(result?.experienceLevel).toEqual(options.experienceLevel);
    expect(result?.location).toEqual(options.location);
    expect(result?.logBookSharing).toEqual(options.logBookSharing);
    expect(result?.name).toEqual(options.name);
    expect(result?.startedDiving).toEqual(options.startedDiving);
  });

  it('will set properties to null', async () => {
    const options: UpdateProfileOptions = {
      bio: null,
      experienceLevel: null,
      location: null,
      name: null,
      startedDiving: null,
    };
    await profile.update(options);

    expect(profile.avatar).toBe(TestUserData.avatar);
    expect(profile.bio).toBeUndefined();
    expect(profile.experienceLevel).toBeUndefined();
    expect(profile.location).toBeUndefined();
    expect(profile.name).toBeUndefined();
    expect(profile.startedDiving).toBeUndefined();

    const result = await Users.findOne({ where: { id: TestUserData.id } });
    expect(result?.avatar).toBe(TestUserData.avatar);
    expect(result?.bio).toBeNull();
    expect(result?.experienceLevel).toBeNull();
    expect(result?.location).toBeNull();
    expect(result?.name).toBeNull();
    expect(result?.startedDiving).toBeNull();
  });

  it('will not set properties if properties are undefined', async () => {
    const options: UpdateProfileOptions = {};
    await profile.update(options);

    expect(profile.avatar).toBe(TestUserData.avatar);
    expect(profile.bio).toBe(TestUserData.bio);
    expect(profile.customData).toEqual(TestUserData.customData);
    expect(profile.experienceLevel).toBe(TestUserData.experienceLevel);
    expect(profile.location).toBe(TestUserData.location);
    expect(profile.name).toBe(TestUserData.name);
    expect(profile.startedDiving).toBe(TestUserData.startedDiving);
    expect(profile.logBookSharing).toBe(TestUserData.logBookSharing);

    const result = await Users.findOne({ where: { id: TestUserData.id } });
    expect(result).toEqual(TestUserData);
  });

  it('will render to JSON correctly', () => {
    const json = profile.toJSON();
    expect(json).toEqual({
      avatar: TestUserData.avatar,
      bio: TestUserData.bio,
      certifications: TestUserData.certifications,
      experienceLevel: TestUserData.experienceLevel,
      location: TestUserData.location,
      logBookSharing: TestUserData.logBookSharing,
      name: TestUserData.name,
      startedDiving: TestUserData.startedDiving,
      memberSince: TestUserData.memberSince,
      username: TestUserData.username,
      userId: TestUserData.id,
    });
  });
});
