import { UpdateProfileParamsSchema, UserDTO } from '@bottomtime/api';

import nock, { Scope } from 'nock';

import { ApiClient } from '../../../src/client/client';
import { UserProfile } from '../../../src/client/user-profile';
import { createScope } from '../../fixtures/nock';
import { BasicUser } from '../../fixtures/users';

describe('UserProfile client object', () => {
  let client: ApiClient;
  let profile: UserProfile;
  let testUser: UserDTO;
  let scope: Scope;

  beforeAll(() => {
    client = new ApiClient();
    scope = createScope();
    testUser = {
      ...BasicUser,
      profile: {
        bio: 'This is a test bio',
        location: 'Testville, Testland',
        avatar: 'https://example.com/avatar.jpg',
        birthdate: '2000-01-01',
        experienceLevel: 'Advanced',
        memberSince: BasicUser.memberSince,
        name: 'Test User',
        startedDiving: '2010-01-01',
        userId: BasicUser.id,
        username: BasicUser.username,
      },
    };

    profile = new UserProfile(client.axios, testUser);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    nock.restore();
  });

  it('will return properties correctly', () => {
    expect(profile.bio).toBe(testUser.profile.bio);
    expect(profile.location).toBe(testUser.profile.location);
    expect(profile.avatar).toBe(testUser.profile.avatar);
    expect(profile.birthdate).toBe(testUser.profile.birthdate);
    expect(profile.experienceLevel).toBe(testUser.profile.experienceLevel);
    expect(profile.name).toBe(testUser.profile.name);
    expect(profile.startedDiving).toBe(testUser.profile.startedDiving);
  });

  it('will update properties correctly', () => {
    profile.bio = 'This is an updated bio';
    profile.location = 'Updatedville, Updatedland';
    profile.avatar = 'https://example.com/updated-avatar.jpg';
    profile.birthdate = '2001-01-01';
    profile.experienceLevel = 'Beginner';
    profile.name = 'Updated User';
    profile.startedDiving = '2011-01-01';

    expect(testUser.profile.bio).toBe('This is an updated bio');
    expect(testUser.profile.location).toBe('Updatedville, Updatedland');
    expect(testUser.profile.avatar).toBe(
      'https://example.com/updated-avatar.jpg',
    );
    expect(testUser.profile.birthdate).toBe('2001-01-01');
    expect(testUser.profile.experienceLevel).toBe('Beginner');
    expect(testUser.profile.name).toBe('Updated User');
    expect(testUser.profile.startedDiving).toBe('2011-01-01');
  });

  it('will save changes', async () => {
    profile.bio = 'This is an updated bio';
    profile.location = 'Updatedville, Updatedland';
    profile.avatar = 'https://example.com/updated-avatar.jpg';
    profile.birthdate = '2001-01-01';
    profile.experienceLevel = 'Beginner';
    profile.name = 'Updated User';
    profile.startedDiving = '2011-01-01';

    const expected = UpdateProfileParamsSchema.parse(profile);

    scope
      .put(`/api/users/${testUser.username}`, JSON.stringify(expected))
      .reply(200, testUser.profile);
    await profile.save();

    expect(scope.isDone()).toBe(true);
  });
});
