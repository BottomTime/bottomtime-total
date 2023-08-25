import request from 'superagent';

import { DefaultProfile } from '@/client/users/default-profile';
import { UserData } from '@/client/users';
import { RequestBodyMatcher } from 'nock';
import { ProfileVisibility, UserRole } from '@/constants';
import { fakeUser } from '../../../fixtures/fake-user';
import { scope } from '../../../utils/scope';

const ProfileToSave: UserData = {
  id: '86409282-b526-4a61-b815-7757f5cd0f56',
  email: 'Michale_Funk2@gmail.com',
  emailVerified: true,
  hasPassword: true,
  isLockedOut: false,
  lastLogin: new Date('2023-07-06T12:10:10.132Z'),
  lastPasswordChange: new Date('2023-03-22T11:59:24.684Z'),
  memberSince: new Date('2021-12-22T03:17:58.314Z'),
  role: UserRole.User,
  username: 'Michale86',
  profile: {
    avatar:
      'https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/1220.jpg',
    bio: 'Eaque eum modi quaerat reprehenderit dignissimos iure voluptates assumenda quasi. Aut vitae doloribus quia nam. Impedit reiciendis soluta eveniet quisquam nostrum. Fugit libero minus consequatur est. Impedit vitae doloribus repellendus similique enim exercitationem nesciunt eius dolorum. Quibusdam deleniti nihil temporibus alias numquam.',
    birthdate: '2004-10-15T12:35:43.888Z',
    customData: {},
    certifications: [],
    experienceLevel: 'expert',
    location: 'West Kameronbury',
    name: 'Michale Funk',
    profileVisibility: ProfileVisibility.Private,
    startedDiving: '2020',
  },
};

describe('Default Profile', () => {
  const agent = request.agent();

  it('Will return properties correctly', () => {
    const data = fakeUser();
    data.profile.customData = {
      wat: 'lol',
    };
    const profile = new DefaultProfile(agent, data);

    expect(profile.avatar).toEqual(data.profile.avatar);
    expect(profile.bio).toEqual(data.profile.bio);
    expect(profile.birthdate).toEqual(data.profile.birthdate);
    expect(profile.certifications).toEqual(data.profile.certifications);
    expect(profile.customData).toEqual(data.profile.customData);
    expect(profile.experienceLevel).toEqual(data.profile.experienceLevel);
    expect(profile.location).toEqual(data.profile.location);
    expect(profile.memberSince).toEqual(data.memberSince);
    expect(profile.name).toEqual(data.profile.name);
    expect(profile.profileVisibility).toEqual(data.profile.profileVisibility);
    expect(profile.startedDiving).toEqual(data.profile.startedDiving);
    expect(profile.userId).toEqual(data.id);
    expect(profile.username).toEqual(data.username);
  });

  it('Will update properteis correctly', () => {
    const oldData = fakeUser();
    const profile = new DefaultProfile(agent, oldData);

    const newData = fakeUser();
    newData.profile.customData = {
      wat: 'lol',
    };

    profile.avatar = newData.profile.avatar;
    profile.bio = newData.profile.bio;
    profile.birthdate = newData.profile.birthdate;
    profile.certifications = newData.profile.certifications;
    profile.customData = newData.profile.customData;
    profile.experienceLevel = newData.profile.experienceLevel;
    profile.location = newData.profile.location;
    profile.name = newData.profile.name;
    profile.profileVisibility = newData.profile.profileVisibility;
    profile.startedDiving = newData.profile.startedDiving;

    expect(profile.avatar).toEqual(newData.profile.avatar);
    expect(profile.bio).toEqual(newData.profile.bio);
    expect(profile.birthdate).toEqual(newData.profile.birthdate);
    expect(profile.certifications).toEqual(newData.profile.certifications);
    expect(profile.customData).toEqual(newData.profile.customData);
    expect(profile.experienceLevel).toEqual(newData.profile.experienceLevel);
    expect(profile.location).toEqual(newData.profile.location);
    expect(profile.name).toEqual(newData.profile.name);
    expect(profile.profileVisibility).toEqual(
      newData.profile.profileVisibility,
    );
    expect(profile.startedDiving).toEqual(newData.profile.startedDiving);
  });

  it('Will save profile information', async () => {
    const profile = new DefaultProfile(agent, ProfileToSave);
    scope
      .put(
        `/api/profiles/${ProfileToSave.username}`,
        ProfileToSave.profile as unknown as RequestBodyMatcher,
      )
      .reply(204);
    await expect(profile.save()).resolves.toBeUndefined();
    expect(scope.isDone()).toBe(true);
  });
});
