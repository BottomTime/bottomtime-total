import { UserRole } from '@bottomtime/api';
import { UserData, UserModel } from '../../../src/schemas';
import { User } from '../../../src/users';
import { Types } from 'mongoose';
import { Profile, UpdateProfileOptions } from '../../../src/users/profile';
import exp from 'constants';

const TestUserData: UserData = {
  _id: 'BDB62177-2086-4D45-A46B-3120B33DAB7A',
  emailVerified: true,
  isLockedOut: false,
  memberSince: new Date('2020-01-01T00:00:00.000Z'),
  role: UserRole.User,
  username: 'testuser',
  usernameLowered: 'testuser',
  profile: {
    avatar: 'https://example.com/avatar.png',
    bio: 'I am a test user.',
    birthdate: '1990-01-01',
    certifications: new Types.DocumentArray([
      {
        agency: 'PADI',
        course: 'Open Water Diver',
        date: '2020-01-01',
      },
      {
        agency: 'PADI',
        course: 'Advanced Open Water Diver',
        date: '2020-05-02',
      },
      {
        agency: 'PADI',
        course: 'Drysuit Diver',
        date: '2020-05-03',
      },
    ]),
    customData: {
      acceptedCookies: true,
    },
    experienceLevel: 'Advanced',
    location: 'Testville, USA',
    name: 'Test User',
    startedDiving: '2019-01-01',
  },
} as const;

describe('Profile Class', () => {
  let profile: Profile;

  beforeEach(async () => {
    const userData = new UserModel(TestUserData);
    await UserModel.insertMany([userData]);
    profile = new User(UserModel, userData).profile;
  });

  it('will return properties correctly', () => {
    expect(profile.avatar).toBe(TestUserData.profile!.avatar);
    expect(profile.bio).toBe(TestUserData.profile!.bio);
    expect(profile.birthdate).toBe(TestUserData.profile!.birthdate);
    expect(profile.certifications).toEqual(
      TestUserData.profile!.certifications,
    );
    expect(profile.customData).toEqual(TestUserData.profile!.customData);
    expect(profile.experienceLevel).toBe(TestUserData.profile!.experienceLevel);
    expect(profile.location).toBe(TestUserData.profile!.location);
    expect(profile.name).toBe(TestUserData.profile!.name);
    expect(profile.startedDiving).toBe(TestUserData.profile!.startedDiving);
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
    expect(profile.certifications).toEqual(options.certifications);
    expect(profile.customData).toEqual(options.customData);
    expect(profile.experienceLevel).toBe(options.experienceLevel);
    expect(profile.location).toBe(options.location);
    expect(profile.name).toBe(options.name);
    expect(profile.startedDiving).toBe(options.startedDiving);

    const result = JSON.parse(
      JSON.stringify(await UserModel.findById(TestUserData._id)),
    );
    expect(result.profile).toEqual(options);
  });

  it('will set properties to undefined', async () => {
    const options: UpdateProfileOptions = {};
    await profile.update(options);

    expect(profile.avatar).toBe(options.avatar);
    expect(profile.bio).toBe(options.bio);
    expect(profile.birthdate).toBe(options.birthdate);
    expect(profile.certifications).toEqual(options.certifications);
    expect(profile.customData).toEqual(options.customData);
    expect(profile.experienceLevel).toBe(options.experienceLevel);
    expect(profile.location).toBe(options.location);
    expect(profile.name).toBe(options.name);
    expect(profile.startedDiving).toBe(options.startedDiving);

    const savedUser = await UserModel.findById(TestUserData._id);
    const result = JSON.parse(JSON.stringify(savedUser));
    expect(result.profile).toEqual({
      ...options,
      certifications: [],
    });
  });

  it('will not set properties to undefined if ignoreUndefined is true', async () => {
    const options: UpdateProfileOptions = {};
    await profile.update(options, true);

    expect(profile.avatar).toBe(TestUserData.profile!.avatar);
    expect(profile.bio).toBe(TestUserData.profile!.bio);
    expect(profile.birthdate).toBe(TestUserData.profile!.birthdate);
    expect(profile.certifications).toEqual(
      TestUserData.profile!.certifications,
    );
    expect(profile.customData).toEqual(TestUserData.profile!.customData);
    expect(profile.experienceLevel).toBe(TestUserData.profile!.experienceLevel);
    expect(profile.location).toBe(TestUserData.profile!.location);
    expect(profile.name).toBe(TestUserData.profile!.name);
    expect(profile.startedDiving).toBe(TestUserData.profile!.startedDiving);

    const result = JSON.parse(
      JSON.stringify(await UserModel.findById(TestUserData._id)),
    );
    expect(result.profile).toEqual(TestUserData.profile);
  });

  it('will render to JSON correctly', () => {
    const json = profile.toJSON();
    expect(json).toEqual({
      ...TestUserData.profile,
      memberSince: TestUserData.memberSince,
      username: TestUserData.username,
      userId: TestUserData._id,
    });
  });
});
