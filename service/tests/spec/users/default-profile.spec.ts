import { Collection } from 'mongodb';

import { DefaultProfile } from '../../../src/users';
import { Collections, UserDocument } from '../../../src/data';
import { createTestLogger } from '../../test-logger';
import { fakeProfile, fakeUser } from '../../fixtures/fake-user';
import { mongoClient } from '../../mongo-client';
import { ProfileVisibility } from '../../../src/constants';
import { ValidationError } from '../../../src/errors';

const Log = createTestLogger('default-profile');

describe('Default Profile', () => {
  let Users: Collection<UserDocument>;

  beforeAll(() => {
    Users = mongoClient.db().collection(Collections.Users);
  });

  it('Will return property values', () => {
    const data = fakeUser();
    data.profile!.customData = {
      someFrontEndProperty: 7,
    };
    const profile = new DefaultProfile(mongoClient, Log, data);

    expect(profile.userId).toEqual(data._id);
    expect(profile.username).toEqual(data.username);
    expect(profile.memberSince).toEqual(data.memberSince);
    expect(profile.avatar).toEqual(data.profile?.avatar);
    expect(profile.bio).toEqual(data.profile?.bio);
    expect(profile.birthdate).toEqual(data.profile?.birthdate);
    expect(profile.certifications).toEqual(data.profile?.certifications);
    expect(profile.customData).toEqual(data.profile?.customData);
    expect(profile.experienceLevel).toEqual(data.profile?.experienceLevel);
    expect(profile.location).toEqual(data.profile?.location);
    expect(profile.name).toEqual(data.profile?.name);
    expect(profile.profileVisibility).toEqual(data.profile?.profileVisibility);
    expect(profile.startedDiving).toEqual(data.profile?.startedDiving);
  });

  it('Will return properties as undefined', () => {
    const data = fakeUser();
    delete data.profile;
    const profile = new DefaultProfile(mongoClient, Log, data);

    expect(profile.avatar).toBeUndefined();
    expect(profile.bio).toBeUndefined();
    expect(profile.birthdate).toBeUndefined();
    expect(profile.certifications).toBeUndefined();
    expect(profile.customData).toBeUndefined();
    expect(profile.experienceLevel).toBeUndefined();
    expect(profile.location).toBeUndefined();
    expect(profile.name).toBeUndefined();
    expect(profile.startedDiving).toBeUndefined();
    expect(profile.profileVisibility).toEqual(ProfileVisibility.FriendsOnly);
  });

  it('Will set property values', () => {
    const originalData = fakeUser();
    const newProfile = fakeProfile();
    newProfile.customData = {
      madeUpProperty: 'weeeee!',
    };
    const profile = new DefaultProfile(mongoClient, Log, originalData);

    profile.avatar = newProfile.avatar;
    profile.bio = newProfile.bio;
    profile.birthdate = newProfile.birthdate;
    profile.certifications = newProfile.certifications;
    profile.customData = newProfile.customData;
    profile.experienceLevel = newProfile.experienceLevel;
    profile.location = newProfile.location;
    profile.name = newProfile.name;
    profile.profileVisibility = newProfile.profileVisibility;
    profile.startedDiving = newProfile.startedDiving;

    expect(profile.avatar).toEqual(newProfile.avatar);
    expect(profile.bio).toEqual(newProfile.bio);
    expect(profile.birthdate).toEqual(newProfile.birthdate);
    expect(profile.certifications).toEqual(newProfile.certifications);
    expect(profile.customData).toEqual(newProfile.customData);
    expect(profile.experienceLevel).toEqual(newProfile.experienceLevel);
    expect(profile.location).toEqual(newProfile.location);
    expect(profile.name).toEqual(newProfile.name);
    expect(profile.profileVisibility).toEqual(newProfile.profileVisibility);
    expect(profile.startedDiving).toEqual(newProfile.startedDiving);
  });

  it('Will save changes to database', async () => {
    const expected = fakeUser();
    const newProfile = fakeProfile();
    await Users.insertOne(expected);
    expected.profile = newProfile;

    const profile = new DefaultProfile(mongoClient, Log, expected);
    try {
      await profile.save();
    } catch (error) {
      if (error instanceof ValidationError) {
        console.log(error.errors);
        expect(error).toBeUndefined();
      }
    }

    const actual = await Users.findOne({ _id: expected._id });
    expect(actual).toEqual(expected);
  });

  it('Will not save a bunch of null values if profile has undefined fields', async () => {
    const expected = fakeUser();
    const newProfile = {
      profileVisibility: ProfileVisibility.Public,
    };
    await Users.insertOne(expected);
    expected.profile = newProfile;

    const profile = new DefaultProfile(mongoClient, Log, expected);
    await profile.save();

    const actual = await Users.findOne({ _id: expected._id });
    expect(actual).toEqual(expected);
  });

  [
    {
      name: 'Birthdate is invalid',
      profile: {
        birthdate: 'January 20th',
        profileVisibility: ProfileVisibility.Private,
      },
    },
    {
      name: 'Certifications has an invalid date',
      profile: {
        certifications: [
          {
            agency: 'PADI',
            course: 'Rescue Diver',
            date: 'yesterday',
          },
        ],
        profileVisibility: ProfileVisibility.Private,
      },
    },
    {
      name: 'Profile visibility has an invalid value',
      profile: {
        profileVisibility: 'Mostly visible',
      },
    },
    {
      name: 'Started diving is invalid',
      profile: {
        profileVisibility: ProfileVisibility.FriendsOnly,
        startedDiving: 'a couple years ago',
      },
    },
  ].forEach((test) => {
    it(`Will throw ValidationError if attempt is made to save profile with: ${test.name}`, async () => {
      const data = fakeUser({ profile: test.profile });
      const profile = new DefaultProfile(mongoClient, Log, data);
      await expect(profile.save()).rejects.toThrowError(ValidationError);
    });
  });

  it('Will export data as JSON', () => {
    const data = fakeUser();
    data.profile!.customData = {
      includeMe: true,
    };
    const profile = new DefaultProfile(mongoClient, Log, data);
    expect(profile.toJSON()).toEqual({
      userId: data._id,
      username: data.username,
      memberSince: data.memberSince,
      ...data.profile,
    });
  });
});
