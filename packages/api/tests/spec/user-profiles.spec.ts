import { BinaryLike, createHash } from 'crypto';
import mockFetch from 'fetch-mock-jest';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

import {
  AvatarSize,
  DepthUnit,
  Fetcher,
  ListAvatarURLsResponseDTO,
  LogBookSharing,
  NotificationType,
  NotificationWhitelists,
  PressureUnit,
  ProfileDTO,
  TemperatureUnit,
  UpdateProfileParamsDTO,
  UserDTO,
  UserSettingsDTO,
  WeightUnit,
} from '../../src';
import { UserProfilesApiClient } from '../../src/client/user-profiles';
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

describe('User profiles API client', () => {
  let client: UserProfilesApiClient;
  let testUser: UserDTO;
  let testFile: File;

  beforeAll(async () => {
    client = new UserProfilesApiClient(new Fetcher());
    const img = await readFile(resolve(__dirname, '../fixtures/waltito.png'), {
      flag: 'r',
    });
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
  });

  afterEach(() => {
    mockFetch.restore();
  });

  it('will save changes to a user profile', async () => {
    const update: UpdateProfileParamsDTO = {
      bio: 'This is an updated bio',
      location: 'Updatedville, Updatedland',
      experienceLevel: 'Beginner',
      name: 'Updated User',
      startedDiving: '2011-01-01',
      logBookSharing: LogBookSharing.Private,
    };
    const expected: UserDTO = {
      ...testUser,
      profile: {
        ...testUser.profile,
        ...update,
      },
    };
    mockFetch.put(
      {
        url: `/api/users/${testUser.username}`,
        body: update,
      },
      {
        status: 200,
        body: expected,
      },
    );
    const result = await client.updateProfile(testUser, update);
    expect(mockFetch.done()).toBe(true);
    expect(result).toEqual(expected);
  });

  it('will allow users to delete their avatar', async () => {
    mockFetch.delete(`/api/users/${testUser.username}/avatar`, 204);
    await client.deleteAvatar(testUser.username);
    expect(mockFetch.done()).toBe(true);
  });

  it('will allow users to upload a new avatar without bounding region', async () => {
    mockFetch.post(`/api/users/${testUser.username}/avatar`, {
      status: 201,
      body: TestURLs,
    });
    const urls = await client.uploadAvatar(testUser.username, testFile);
    expect(mockFetch.done()).toBe(true);
    expect(urls).toEqual(TestURLs);

    await new Promise<void>((resolve) => {
      const body = mockFetch.calls()[0]![1]!.body as FormData;
      const file = body.get('avatar') as File;
      const fileReader = new FileReader();
      fileReader.readAsArrayBuffer(file);
      fileReader.onloadend = () => {
        const md5 = createHash('md5')
          .update(
            Buffer.from(
              fileReader.result as ArrayBuffer,
            ) as unknown as BinaryLike,
          )
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
    const urls = await client.uploadAvatar(testUser.username, testFile, {
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
          .update(
            Buffer.from(
              fileReader.result as ArrayBuffer,
            ) as unknown as BinaryLike,
          )
          .digest('hex');
        expect(md5).toMatchSnapshot();
        resolve();
      };
    });
  });

  it('will save changes to settings', async () => {
    const update: UserSettingsDTO = {
      depthUnit: DepthUnit.Feet,
      pressureUnit: PressureUnit.PSI,
      temperatureUnit: TemperatureUnit.Fahrenheit,
      weightUnit: WeightUnit.Pounds,
    };
    const expected: UserDTO = {
      ...testUser,
      settings: update,
    };
    mockFetch.put(
      {
        url: `/api/users/${testUser.username}/settings`,
        body: update,
      },
      {
        status: 200,
        body: expected,
      },
    );
    const result = await client.updateSettings(testUser, update);
    expect(mockFetch.done()).toBe(true);
    expect(result).toEqual(expected);
  });

  describe('when working with notifications', () => {
    it('will retrieve notification whitelists', async () => {
      const expected: NotificationWhitelists = {
        [NotificationType.Email]: ['membership.*', 'user.*'],
        [NotificationType.PushNotification]: ['*'],
      };
      mockFetch.get(
        `/api/users/${BasicUser.username}/notifications/permissions/${NotificationType.Email}`,
        expected[NotificationType.Email],
      );
      mockFetch.get(
        `/api/users/${BasicUser.username}/notifications/permissions/${NotificationType.PushNotification}`,
        expected[NotificationType.PushNotification],
      );

      const actual = await client.getNotificationWhitelists(testUser.username);
      expect(mockFetch.done()).toBe(true);
      expect(actual).toEqual(expected);
    });

    it('will update notification whitelists', async () => {
      const newWhitelist = ['friendRequest.*'];
      mockFetch.put(
        {
          url: `/api/users/${BasicUser.username}/notifications/permissions/${NotificationType.PushNotification}`,
          body: newWhitelist,
        },
        204,
      );
      await client.updateNotificationWhitelist(
        testUser.username,
        NotificationType.PushNotification,
        newWhitelist,
      );
      expect(mockFetch.done()).toBe(true);
    });
  });
});
