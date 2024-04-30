import { createHash } from 'crypto';
import fs from 'fs/promises';
import nock, { Scope } from 'nock';
import { File } from 'node:buffer';
import path from 'path';

import { ApiClient } from '../../src/client/client';
import { UserProfile } from '../../src/client/user-profile';
import {
  AvatarSize,
  ListAvatarURLsResponseDTO,
  LogBookSharing,
  UpdateProfileParamsSchema,
  UserDTO,
} from '../../src/types';
import { createScope } from '../fixtures/nock';
import { BasicUser } from '../fixtures/users';

const TestURLs: ListAvatarURLsResponseDTO = {
  root: 'https://example.com/avatars/test_user',
  sizes: {
    [AvatarSize.Small]: 'https://example.com/avatars/test_user/32x32',
    [AvatarSize.Medium]: 'https://example.com/avatars/test_user/64x64',
    [AvatarSize.Large]: 'https://example.com/avatars/test_user/128x128',
    [AvatarSize.XLarge]: 'https://example.com/avatars/test_user/256x256',
  },
} as const;

describe('UserProfile client object', () => {
  let client: ApiClient;
  let profile: UserProfile;
  let testUser: UserDTO;
  let scope: Scope;

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  let testFile: any; // Need to use "any" type here to avoid mismatch with JSDOM File type.

  beforeAll(async () => {
    client = new ApiClient();
    scope = createScope();

    const img = await fs.readFile(
      path.resolve(__dirname, '../fixtures/waltito.png'),
      { flag: 'r' },
    );
    testFile = new File([img], 'waltito.png', { type: 'image/png' });
  });

  beforeEach(() => {
    testUser = {
      ...BasicUser,
      profile: {
        bio: 'This is a test bio',
        location: 'Testville, Testland',
        avatar: 'https://example.com/avatars/test_user',
        experienceLevel: 'Advanced',
        memberSince: BasicUser.memberSince,
        name: 'Test User',
        startedDiving: '2010-01-01',
        userId: BasicUser.id,
        username: BasicUser.username,
        logBookSharing: LogBookSharing.FriendsOnly,
      },
    };

    profile = new UserProfile(client.axios, testUser.profile);
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
    expect(profile.experienceLevel).toBe(testUser.profile.experienceLevel);
    expect(profile.name).toBe(testUser.profile.name);
    expect(profile.startedDiving).toBe(testUser.profile.startedDiving);
    expect(profile.logBookSharing).toBe(testUser.profile.logBookSharing);
  });

  it('will update properties correctly', () => {
    profile.bio = 'This is an updated bio';
    profile.location = 'Updatedville, Updatedland';
    profile.experienceLevel = 'Beginner';
    profile.name = 'Updated User';
    profile.startedDiving = '2011-01-01';
    profile.logBookSharing = LogBookSharing.Public;

    expect(testUser.profile.bio).toBe('This is an updated bio');
    expect(testUser.profile.location).toBe('Updatedville, Updatedland');
    expect(testUser.profile.experienceLevel).toBe('Beginner');
    expect(testUser.profile.name).toBe('Updated User');
    expect(testUser.profile.startedDiving).toBe('2011-01-01');
    expect(testUser.profile.logBookSharing).toBe(LogBookSharing.Public);
  });

  it('will save changes', async () => {
    profile.bio = 'This is an updated bio';
    profile.location = 'Updatedville, Updatedland';
    profile.experienceLevel = 'Beginner';
    profile.name = 'Updated User';
    profile.startedDiving = '2011-01-01';
    profile.logBookSharing = LogBookSharing.Private;

    const expected = UpdateProfileParamsSchema.parse(profile);

    scope
      .put(`/api/users/${testUser.username}`, JSON.stringify(expected))
      .reply(200, testUser.profile);
    await profile.save();

    expect(scope.isDone()).toBe(true);
  });

  it('will allow users to delete their avatar', async () => {
    scope.delete(`/api/users/${testUser.username}/avatar`).reply(204);
    await profile.deleteAvatar();
    expect(scope.isDone()).toBe(true);
  });

  it('will allow users to upload a new avatar without bounding region', async () => {
    let md5: string | undefined;
    scope
      .post(`/api/users/${testUser.username}/avatar`, (body: string) => {
        const decoded = Buffer.from(body, 'hex')
          .toString('utf-8')
          .replaceAll(/-boundary-\S+/g, '');
        md5 = createHash('md5').update(decoded).digest('hex');
        return true;
      })
      .reply(201, TestURLs);
    const urls = await profile.uploadAvatar(testFile);

    expect(urls).toEqual(TestURLs);
    expect(md5).toMatchSnapshot();
  });

  it('will allow users to upload a new avatar with bounding region', async () => {
    let md5: string | undefined;
    scope
      .post(`/api/users/${testUser.username}/avatar`, (body: string) => {
        const decoded = Buffer.from(body, 'hex')
          .toString('utf-8')
          .replaceAll(/--axios-\d+\.\d+\.\d+-boundary-\S+/g, '');
        md5 = createHash('md5').update(decoded).digest('hex');
        return true;
      })
      .reply(201, TestURLs);
    const urls = await profile.uploadAvatar(testFile, {
      left: 230,
      top: 410,
      width: 312,
      height: 312,
    });

    expect(urls).toEqual(TestURLs);
    expect(md5).toMatchSnapshot();
  });
});
