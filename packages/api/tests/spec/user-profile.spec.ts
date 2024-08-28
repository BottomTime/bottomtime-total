import { createHash } from 'crypto';
import mockFetch from 'fetch-mock-jest';
import fs from 'fs/promises';
import path from 'path';

import { Fetcher } from '../../src/client/fetcher';
import { UserProfile } from '../../src/client/user-profile';
import {
  AvatarSize,
  ListAvatarURLsResponseDTO,
  LogBookSharing,
  UpdateProfileParamsSchema,
  UserDTO,
} from '../../src/types';
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
  let fetcher: Fetcher;
  let profile: UserProfile;
  let testUser: UserDTO;

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  let testFile: any; // Need to use "any" type here to avoid mismatch with JSDOM File type.

  beforeAll(async () => {
    fetcher = new Fetcher();

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
        accountTier: BasicUser.accountTier,
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

    profile = new UserProfile(fetcher, testUser.profile);
  });

  afterEach(() => {
    mockFetch.restore();
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

    mockFetch.put(
      {
        url: `/api/users/${testUser.username}`,
        body: expected,
      },
      {
        status: 200,
        body: testUser.profile,
      },
    );
    await profile.save();

    expect(mockFetch.done()).toBe(true);
  });

  it('will allow users to delete their avatar', async () => {
    mockFetch.delete(`/api/users/${testUser.username}/avatar`, 204);
    await profile.deleteAvatar();
    expect(mockFetch.done()).toBe(true);
  });

  it('will allow users to upload a new avatar without bounding region', async () => {
    mockFetch.post(`/api/users/${testUser.username}/avatar`, {
      status: 201,
      body: TestURLs,
    });

    const urls = await profile.uploadAvatar(testFile);

    expect(mockFetch.done()).toBe(true);
    expect(urls).toEqual(TestURLs);

    await new Promise<void>((resolve) => {
      const body = mockFetch.calls()[0]![1]!.body as FormData;
      const file = body.get('avatar') as File;
      const fileReader = new FileReader();
      fileReader.readAsArrayBuffer(file);
      fileReader.onloadend = () => {
        const md5 = createHash('md5')
          .update(Buffer.from(fileReader.result as ArrayBuffer))
          .digest('hex');
        expect(md5).toMatchSnapshot();
        resolve();
      };
    });
  });

  it('will allow users to upload a new avatar with bounding region', async () => {
    mockFetch.post(`/api/users/${testUser.username}/avatar`, {
      status: 201,
      body: TestURLs,
    });
    const urls = await profile.uploadAvatar(testFile, {
      left: 230,
      top: 410,
      width: 312,
      height: 312,
    });

    expect(urls).toEqual(TestURLs);

    const body = mockFetch.calls()[0]![1]!.body as FormData;
    expect(body.get('left')).toBe('230');
    expect(body.get('top')).toBe('410');
    expect(body.get('width')).toBe('312');
    expect(body.get('height')).toBe('312');

    await new Promise<void>((resolve) => {
      const file = body.get('avatar') as File;
      const fileReader = new FileReader();
      fileReader.readAsArrayBuffer(file);
      fileReader.onloadend = () => {
        const md5 = createHash('md5')
          .update(Buffer.from(fileReader.result as ArrayBuffer))
          .digest('hex');
        expect(md5).toMatchSnapshot();
        resolve();
      };
    });
  });
});
