import { UserDTO } from '@bottomtime/api';

import axios, { AxiosInstance } from 'axios';
import AxiosAdapter from 'axios-mock-adapter';

import { UserProfile } from '../../../src/client/user-profile';
import { BasicUser } from '../../fixtures/users';

describe('UserProfile client object', () => {
  let axiosInstance: AxiosInstance;
  let axiosAdapter: AxiosAdapter;
  let profile: UserProfile;
  let testUser: UserDTO;

  beforeAll(() => {
    axiosInstance = axios.create();
    axiosAdapter = new AxiosAdapter(axiosInstance);

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

    profile = new UserProfile(axiosInstance, testUser);
  });

  afterEach(() => {
    axiosAdapter.reset();
  });

  afterAll(() => {
    axiosAdapter.restore();
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

    const expectedRequest: Record<string, unknown> = Object.assign(
      {},
      testUser.profile,
    );
    delete expectedRequest.userId;
    delete expectedRequest.username;
    delete expectedRequest.memberSince;

    axiosAdapter
      .onPut(`/api/users/${testUser.username}`, expectedRequest)
      .reply(200);
    await profile.save();

    expect(axiosAdapter.history.put).toHaveLength(1);
  });
});
