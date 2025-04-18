import { BinaryLike, createHash } from 'crypto';
import mockFetch from 'fetch-mock-jest';
import fs from 'fs/promises';
import path from 'path';

import {
  AccountTier,
  ApiList,
  AvatarSize,
  CreateOrUpdateOperatorDTO,
  CreateOrUpdateTeamMemberDTO,
  DiveSiteDTO,
  ListAvatarURLsResponseDTO,
  LogBookSharing,
  OperatorDTO,
  SearchDiveSitesResponseSchema,
  SearchOperatorsParams,
  SearchOperatorsResponseSchema,
  TeamMemberDTO,
  VerificationStatus,
} from '../../src';
import { Fetcher } from '../../src/client';
import { OperatorsApiClient } from '../../src/client/operators';
import TestData from '../fixtures/dive-operator-search-results.json';
import TestDiveSites from '../fixtures/dive-sites-search-results.json';

const TestKey = 'test-operator';
const TestOperator: OperatorDTO = {
  active: true,
  createdAt: Date.now(),
  id: 'fd5b16ef-0693-469f-a9f3-57d8885029b9',
  name: 'Test Operator',
  updatedAt: Date.now(),
  owner: {
    accountTier: AccountTier.Basic,
    userId: '16dc9384-82bf-4ac3-bad2-b46456ed786e',
    username: 'test-user',
    memberSince: Date.now(),
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

const TeamMembers: TeamMemberDTO[] = [
  {
    title: 'Instructor',
    joined: '2016-04',
    member: {
      accountTier: 200,
      avatar: '/api/users/Chris/avatar',
      location: 'Cambridge, ON',
      logBookSharing: LogBookSharing.Private,
      memberSince: 1713361114242,
      name: 'Chris Carleton',
      userId: 'cb12fb5b-f1b3-499f-a6ae-dfb467d3d2d1',
      username: 'Chris',
    },
  },
  {
    title: 'Dive Master',
    member: {
      accountTier: 0,
      avatar:
        'https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/613.jpg',
      bio: 'At tenetur libero ullam aspernatur culpa provident nobis explicabo eos. Non voluptas aliquid quos repellendus incidunt veniam. Suscipit voluptates modi saepe rerum. In similique magni cupiditate sit ea beatae quisquam rerum corrupti.',
      experienceLevel: 'Expert',
      location: 'Kshlerinburgh, NH, NF',
      logBookSharing: LogBookSharing.Private,
      memberSince: 1422446556022,
      name: 'Ashley Bruen',
      startedDiving: '2015-06-14',
      userId: '7ea68b2a-3f35-4650-bbd5-99c9325e0c09',
      username: 'Ashley_Bruen35',
    },
  },
] as const;

describe('Operators API client', () => {
  let fetcher: Fetcher;
  let client: OperatorsApiClient;
  let testData: ApiList<OperatorDTO>;
  let diveSites: ApiList<DiveSiteDTO>;

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  let testFile: any; // Need to use "any" type here to avoid mismatch with JSDOM File type.

  beforeAll(async () => {
    fetcher = new Fetcher();
    client = new OperatorsApiClient(fetcher);
    testData = SearchOperatorsResponseSchema.parse(TestData);
    diveSites = SearchDiveSitesResponseSchema.parse(TestDiveSites);

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
      updatedAt: Date.now(),
      owner: {
        accountTier: AccountTier.Pro,
        logBookSharing: LogBookSharing.Public,
        memberSince: Date.now(),
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

  it('will request dive sites for a given operator', async () => {
    mockFetch.get(`/api/operators/${TestKey}/sites`, {
      status: 200,
      body: diveSites,
    });

    const sites = await client.listDiveSites(TestKey);

    expect(mockFetch.done()).toBe(true);
    expect(sites.data).toHaveLength(diveSites.data.length);
    expect(sites.totalCount).toBe(diveSites.totalCount);
    sites.data.forEach((site, index) => {
      expect(site).toEqual(diveSites.data[index]);
    });
  });

  it('will add dive sites to an operator', async () => {
    const siteIds = [
      '56d4558e-6b4e-484b-8b94-2ad907ee6f9b',
      '18ae7cba-62cc-4c34-b104-3d1842075989',
      'c5b79659-a76f-403f-94ae-889d5718fc21',
    ];
    mockFetch.post(
      {
        url: `/api/operators/${TestKey}/sites`,
        body: { siteIds },
      },
      {
        status: 200,
        body: { attached: siteIds.length, skipped: 0 },
      },
    );

    await expect(client.addDiveSites(TestKey, siteIds)).resolves.toBe(
      siteIds.length,
    );

    expect(mockFetch.done()).toBe(true);
  });

  it('', async () => {
    const siteIds = [
      '56d4558e-6b4e-484b-8b94-2ad907ee6f9b',
      '18ae7cba-62cc-4c34-b104-3d1842075989',
      'c5b79659-a76f-403f-94ae-889d5718fc21',
    ];
    mockFetch.delete(
      {
        url: `/api/operators/${TestKey}/sites`,
        body: { siteIds },
      },
      {
        status: 200,
        body: { removed: siteIds.length, skipped: 0 },
      },
    );

    await expect(client.removeDiveSites(TestKey, siteIds)).resolves.toBe(
      siteIds.length,
    );

    expect(mockFetch.done()).toBe(true);
  });

  it('will list team members', async () => {
    mockFetch.get(`/api/operators/${TestKey}/team`, {
      status: 200,
      body: {
        data: TeamMembers,
        totalCount: TeamMembers.length,
      },
    });

    const results = await client.listTeamMembers(TestKey);

    expect(mockFetch.done()).toBe(true);
    expect(results).toMatchSnapshot();
  });

  it('will add or update a team member', async () => {
    const options: CreateOrUpdateTeamMemberDTO = {
      joined: '2012-08-08',
      title: 'Diver Dude',
    };
    mockFetch.put(
      {
        url: `/api/operators/${TestKey}/team/${TeamMembers[0].member.username}`,
        body: options,
      },
      {
        status: 200,
        body: {
          ...TeamMembers[0],
          ...options,
        },
      },
    );

    const result = await client.addOrUpdateTeamMember(
      TestKey,
      TeamMembers[0].member.username,
      options,
    );

    expect(mockFetch.done()).toBe(true);
    expect(result).toMatchSnapshot();
  });

  it('will remove team members', async () => {
    const username = 'sandra12';
    mockFetch.delete(
      {
        url: `/api/operators/${TestKey}/team`,
        body: [username],
      },
      {
        status: 200,
        body: {
          succeeded: 1,
          skipped: 0,
        },
      },
    );
    await client.removeTeamMembers(TestKey, username);
    expect(mockFetch.done()).toBe(true);
  });
});
