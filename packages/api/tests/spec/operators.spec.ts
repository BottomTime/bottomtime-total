import { BinaryLike, createHash } from 'crypto';
import mockFetch from 'fetch-mock-jest';
import fs from 'fs/promises';
import path from 'path';

import {
  AccountTier,
  ApiList,
  AvatarSize,
  CreateOrUpdateOperatorDTO,
  ListAvatarURLsResponseDTO,
  LogBookSharing,
  OperatorDTO,
  SearchOperatorsParams,
  SearchOperatorsResponseSchema,
  VerificationStatus,
} from '../../src';
import { Fetcher } from '../../src/client';
import { OperatorsApiClient } from '../../src/client/operators';
import TestData from '../fixtures/dive-operator-search-results.json';

const TestKey = 'test-operator';
const TestOperator: OperatorDTO = {
  active: true,
  createdAt: new Date(),
  id: 'fd5b16ef-0693-469f-a9f3-57d8885029b9',
  name: 'Test Operator',
  updatedAt: new Date(),
  owner: {
    accountTier: AccountTier.Basic,
    userId: '16dc9384-82bf-4ac3-bad2-b46456ed786e',
    username: 'test-user',
    memberSince: new Date(),
    logBookSharing: LogBookSharing.FriendsOnly,
  },
  verificationStatus: VerificationStatus.Verified,
  address: '123 Test St',
  banner: 'https://example.com/banner.jpg',
  description: 'This is a test operator.',
  email: 'test@email.org',
  gps: {
    lat: 0,
    lon: 0,
  },
  phone: '123-456-7890',
  logo: 'https://example.com/logo.jpg',
  slug: TestKey,
  website: 'https://example.com',
};
const TestURLs: ListAvatarURLsResponseDTO = {
  root: 'https://example.com/avatars/test_user',
  sizes: {
    [AvatarSize.Small]: 'https://example.com/avatars/test_user/32x32',
    [AvatarSize.Medium]: 'https://example.com/avatars/test_user/64x64',
    [AvatarSize.Large]: 'https://example.com/avatars/test_user/128x128',
    [AvatarSize.XLarge]: 'https://example.com/avatars/test_user/256x256',
  },
} as const;

describe('Operators API client', () => {
  let fetcher: Fetcher;
  let client: OperatorsApiClient;
  let testData: ApiList<OperatorDTO>;

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  let testFile: any; // Need to use "any" type here to avoid mismatch with JSDOM File type.

  beforeAll(async () => {
    fetcher = new Fetcher();
    client = new OperatorsApiClient(fetcher);
    testData = SearchOperatorsResponseSchema.parse(TestData);

    const img = await fs.readFile(
      path.resolve(__dirname, '../fixtures/waltito.png'),
      { flag: 'r' },
    );
    testFile = new File([img], 'waltito.png', { type: 'image/png' });
  });

  afterEach(() => {
    mockFetch.restore();
  });

  it('will retrieve a single operator', async () => {
    mockFetch.get(`/api/operators/${TestKey}`, {
      status: 200,
      body: TestOperator,
    });

    const operator = await client.getOperator(TestKey);

    expect(mockFetch.done()).toBe(true);
    expect(operator).toEqual(TestOperator);
  });

  it('will indicate if a slug is in use', async () => {
    const slug = 'test-operator';
    mockFetch.head(`/api/operators/${slug}`, 200);
    await expect(client.isSlugAvailable(slug)).resolves.toBe(false);
  });

  it('will indicate if a slug is in not use', async () => {
    const slug = 'test-operator';
    mockFetch.head(`/api/operators/${slug}`, 404);
    await expect(client.isSlugAvailable(slug)).resolves.toBe(true);
  });

  it('will perform a basic search of operators', async () => {
    mockFetch.get('/api/operators', {
      status: 200,
      body: testData,
    });

    const results = await client.searchOperators();

    expect(mockFetch.done()).toBe(true);
    expect(results.data).toHaveLength(testData.data.length);
    expect(results.totalCount).toBe(testData.totalCount);
    results.data.forEach((operator, index) => {
      expect(operator).toEqual(testData.data[index]);
    });
  });

  it('will perform a search with search parameters', async () => {
    const options: SearchOperatorsParams = {
      limit: 100,
      skip: 0,
      location: {
        lat: -10.23,
        lon: 45.67,
      },
      owner: 'razmataz82',
      radius: 120,
      query: 'test',
      showInactive: false,
    };

    mockFetch.get(
      {
        url: '/api/operators',
        query: {
          ...options,
          location: `${options.location!.lat},${options.location!.lon}`,
        },
      },
      {
        status: 200,
        body: testData,
      },
    );

    const results = await client.searchOperators(options);

    expect(mockFetch.calls()).toMatchSnapshot();
    expect(results.data).toHaveLength(testData.data.length);
    expect(results.totalCount).toBe(testData.totalCount);
    results.data.forEach((operator, index) => {
      expect(operator).toEqual(testData.data[index]);
    });
  });

  it('will create a new operator', async () => {
    const key = 'test-operator';
    const options: CreateOrUpdateOperatorDTO = {
      active: false,
      name: 'Test Operator',
      address: '123 Test St',
      description: 'This is a test operator.',
      email: 'test@email.org',
      gps: {
        lat: 0,
        lon: 0,
      },
      phone: '123-456-7890',
      slug: key,
      website: 'https://example.com',
    };
    const expected: OperatorDTO = {
      ...TestOperator,
      ...options,
    };

    mockFetch.post(
      {
        url: '/api/operators',
        body: options,
      },
      {
        status: 201,
        body: expected,
      },
    );

    const operator = await client.createOperator(options);

    expect(mockFetch.done()).toBe(true);
    expect(operator).toEqual(expected);
  });

  it('will update an existing operator', async () => {
    const options: CreateOrUpdateOperatorDTO = {
      active: true,
      name: 'Test Operator',
      address: '123 Test St',
      description: 'This is a test operator.',
      email: 'email@website.com',
      gps: {
        lat: 1,
        lon: 1,
      },
      slug: 'test-operator',
      phone: '123-456-7890',
      website: 'https://example.com',
      socials: {
        facebook: 'https://facebook.com/example',
        instagram: 'https://instagram.com/example',
        twitter: 'https://twitter.com/example',
        youtube: 'https://youtube.com/example',
        tiktok: 'https://tiktok.com/example',
      },
    };
    const expected: OperatorDTO = {
      ...TestOperator,
      ...options,
    };

    mockFetch.put(
      {
        url: `/api/operators/${options.slug}`,
        body: options,
      },
      {
        status: 200,
        body: expected,
      },
    );

    const actual = await client.updateOperator(options.slug, options);
    expect(actual).toEqual(expected);

    expect(mockFetch.done()).toBe(true);
  });

  it('will update an existing operator with a new slug', async () => {
    const oldSlug = 'old-slug';
    const options: CreateOrUpdateOperatorDTO = {
      active: true,
      name: 'Test Operator',
      address: '123 Test St',
      description: 'This is a test operator.',
      email: 'email@website.com',
      gps: {
        lat: 1,
        lon: 1,
      },
      slug: 'new-slug',
      phone: '123-456-7890',
      website: 'https://example.com',
      socials: {
        facebook: 'https://facebook.com/example',
        instagram: 'https://instagram.com/example',
        twitter: 'https://twitter.com/example',
        youtube: 'https://youtube.com/example',
        tiktok: 'https://tiktok.com/example',
      },
    };
    const expected: OperatorDTO = {
      ...TestOperator,
      ...options,
    };

    mockFetch.put(
      {
        url: `/api/operators/${oldSlug}`,
        body: options,
      },
      {
        status: 200,
        body: expected,
      },
    );

    const actual = await client.updateOperator(oldSlug, options);
    expect(actual).toEqual(expected);

    expect(mockFetch.done()).toBe(true);
  });

  it('will delete an operator', async () => {
    mockFetch.delete(`/api/operators/${TestKey}`, 204);
    await client.deleteOperator(TestKey);
    expect(mockFetch.done()).toBe(true);
  });

  it('will allow a user to transfer ownership of their dive operator', async () => {
    const newOwner = 'Diver.McDiverface';
    const updated: OperatorDTO = {
      ...TestOperator,
      updatedAt: new Date(),
      owner: {
        accountTier: AccountTier.Pro,
        logBookSharing: LogBookSharing.Public,
        memberSince: new Date(),
        userId: '62ed009e-4b21-44e0-a23d-58468124e998',
        username: newOwner,
      },
    };
    mockFetch.post(
      {
        url: `/api/operators/${TestKey}/transfer`,
        body: { newOwner },
      },
      {
        status: 200,
        body: updated,
      },
    );

    const result = await client.transferOwnership(TestOperator, newOwner);
    expect(result).toEqual(updated);

    expect(mockFetch.done()).toBe(true);
  });

  it('will request verification of an operator', async () => {
    const expected: OperatorDTO = {
      ...TestOperator,
      verificationStatus: VerificationStatus.Pending,
    };
    mockFetch.post(`/api/operators/${TestKey}/requestVerification`, 204);

    const result = await client.requestVerification(TestOperator);
    expected.updatedAt = result.updatedAt;
    expect(result.updatedAt.valueOf()).toBeCloseTo(Date.now(), -3);
    expect(result).toEqual(expected);

    expect(mockFetch.done()).toBe(true);
  });

  it('will allow an admin to set verification', async () => {
    const verified = false;
    const message = 'nope';
    mockFetch.post(
      {
        url: ``,
        body: {
          verified,
          message,
        },
      },
      204,
    );
    const expected: OperatorDTO = {
      ...TestOperator,
      verificationStatus: VerificationStatus.Rejected,
      verificationMessage: message,
    };

    const result = await client.setVerified(TestOperator, verified, message);
    expected.updatedAt = result.updatedAt;

    expect(result.updatedAt.valueOf()).toBeCloseTo(Date.now(), -3);
    expect(result).toEqual(expected);
    expect(mockFetch.done()).toBe(true);
  });

  it('will allow a user to delete their operator logo', async () => {
    mockFetch.delete(`/api/operators/${TestKey}/logo`, 204);
    await client.deleteLogo(TestKey);
    expect(mockFetch.done()).toBe(true);
  });

  it('will allow a user to upload a new logo', async () => {
    mockFetch.post(`/api/operators/${TestKey}/logo`, {
      status: 201,
      body: TestURLs,
    });

    const urls = await client.uploadLogo(TestOperator, testFile, {
      left: 230,
      top: 410,
      width: 312,
      height: 312,
    });

    expect(mockFetch.done()).toBe(true);
    expect(urls).toEqual(TestURLs);

    await new Promise<void>((resolve) => {
      const body = mockFetch.calls()[0]![1]!.body as FormData;
      const file = body.get('logo') as File;
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
});
