import {
  DepthUnit,
  PressureUnit,
  ProfileVisibility,
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
  emailVerified: true,
  isLockedOut: false,
  memberSince: new Date('2020-01-01T00:00:00.000Z'),
  role: UserRole.User,
  username: 'testuser',
  usernameLowered: 'testuser',
  avatar: 'https://example.com/avatar.png',
  bio: 'I am a test user.',
  birthdate: '1990-01-01',
  email: null,
  emailLowered: null,
  emailVerificationToken: null,
  emailVerificationTokenExpiration: null,
  lastLogin: null,
  lastPasswordChange: null,
  passwordHash: null,
  passwordResetToken: null,
  passwordResetTokenExpiration: null,
  certifications: undefined,
  // certifications: [
  //   {
  //     agency: 'PADI',
  //     course: 'Open Water Diver',
  //     date: '2020-01-01',
  //   },
  //   {
  //     agency: 'PADI',
  //     course: 'Advanced Open Water Diver',
  //     date: '2020-05-02',
  //   },
  //   {
  //     agency: 'PADI',
  //     course: 'Drysuit Diver',
  //     date: '2020-05-03',
  //   },
  // ],
  customData: {
    acceptedCookies: true,
  },
  experienceLevel: 'Advanced',
  location: 'Testville, USA',
  name: 'Test User',
  startedDiving: '2019-01-01',
  depthUnit: DepthUnit.Meters,
  pressureUnit: PressureUnit.Bar,
  profileVisibility: ProfileVisibility.FriendsOnly,
  temperatureUnit: TemperatureUnit.Celsius,
  weightUnit: WeightUnit.Kilograms,
  oauth: undefined,
  tanks: undefined,
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
    expect(profile.birthdate).toBe(TestUserData.birthdate);
    expect(profile.certifications).toEqual(TestUserData.certifications);
    expect(profile.customData).toEqual(TestUserData.customData);
    expect(profile.experienceLevel).toBe(TestUserData.experienceLevel);
    expect(profile.location).toBe(TestUserData.location);
    expect(profile.name).toBe(TestUserData.name);
    expect(profile.startedDiving).toBe(TestUserData.startedDiving);
  });

  it('will update properties', async () => {
    const options: UpdateProfileOptions = {
      avatar: 'https://example.com/avatar2.png',
      bio: 'Definitely, a new bio.',
      birthdate: '1983-01-01',
      certifications: [
        {
          agency: 'SSI',
          course: 'Open Water Diver',
          date: '2020-01-01',
        },
        {
          agency: 'SSI',
          course: 'Stress & Rescue Diver',
          date: '2020-05-02',
        },
      ],
      customData: {
        acceptedCookies: false,
      },
      experienceLevel: 'Beginner',
      location: 'Somewhere, Mexico',
      name: 'Testy McTesterson',
      startedDiving: '2100-01-01',
    };
    await profile.update(options);

    expect(profile.avatar).toBe(options.avatar);
    expect(profile.bio).toBe(options.bio);
    expect(profile.birthdate).toBe(options.birthdate);
    // expect(profile.certifications).toEqual(options.certifications);
    expect(profile.customData).toEqual(options.customData);
    expect(profile.experienceLevel).toBe(options.experienceLevel);
    expect(profile.location).toBe(options.location);
    expect(profile.name).toBe(options.name);
    expect(profile.startedDiving).toBe(options.startedDiving);

    const result = await Users.findOne({
      where: { id: TestUserData.id },
    });

    expect(result?.avatar).toEqual(options.avatar);
    expect(result?.bio).toEqual(options.bio);
    expect(result?.birthdate).toEqual(options.birthdate);
    // expect(result?.certifications).toEqual(options.certifications);
    expect(result?.customData).toEqual(options.customData);
    expect(result?.experienceLevel).toEqual(options.experienceLevel);
    expect(result?.location).toEqual(options.location);
    expect(result?.name).toEqual(options.name);
    expect(result?.startedDiving).toEqual(options.startedDiving);
  });

  it('will set properties to null', async () => {
    const options: UpdateProfileOptions = {
      avatar: null,
      bio: null,
      birthdate: null,
      // certifications: null,
      experienceLevel: null,
      location: null,
      name: null,
      startedDiving: null,
    };
    await profile.update(options);

    expect(profile.avatar).toBeUndefined();
    expect(profile.bio).toBeUndefined();
    expect(profile.birthdate).toBeUndefined();
    expect(profile.certifications).toBeUndefined();
    expect(profile.experienceLevel).toBeUndefined();
    expect(profile.location).toBeUndefined();
    expect(profile.name).toBeUndefined();
    expect(profile.startedDiving).toBeUndefined();

    const result = await Users.findOne({ where: { id: TestUserData.id } });
    expect(result?.avatar).toBeNull();
    expect(result?.bio).toBeNull();
    expect(result?.birthdate).toBeNull();
    // expect(result?.certifications).toEqual(options.certifications);
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
    expect(profile.birthdate).toBe(TestUserData.birthdate);
    expect(profile.certifications).toEqual(TestUserData.certifications);
    expect(profile.customData).toEqual(TestUserData.customData);
    expect(profile.experienceLevel).toBe(TestUserData.experienceLevel);
    expect(profile.location).toBe(TestUserData.location);
    expect(profile.name).toBe(TestUserData.name);
    expect(profile.startedDiving).toBe(TestUserData.startedDiving);

    const result = await Users.findOne({ where: { id: TestUserData.id } });
    expect(result).toEqual(TestUserData);
  });

  it('will render to JSON correctly', () => {
    const json = profile.toJSON();
    expect(json).toEqual({
      avatar: TestUserData.avatar,
      bio: TestUserData.bio,
      birthdate: TestUserData.birthdate,
      certifications: TestUserData.certifications,
      customData: TestUserData.customData,
      experienceLevel: TestUserData.experienceLevel,
      location: TestUserData.location,
      name: TestUserData.name,
      startedDiving: TestUserData.startedDiving,
      memberSince: TestUserData.memberSince,
      username: TestUserData.username,
      userId: TestUserData.id,
    });
  });
});
