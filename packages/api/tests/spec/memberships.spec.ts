import mockFetch from 'fetch-mock-jest';

import { AccountTier, ApiClient } from '../../src';

const Memberships = [
  {
    accountTier: 0,
    currency: 'cad',
    description:
      'Get all of the features of BottomTime for personal use - for free!',
    frequency: 'year',
    marketingFeatures: [
      'Upload and log your dives',
      'Track your dive metrics and history in your personal dashboard',
      'Find dive sites and dive shops',
      'Follow your dive buddies and',
      'Earn XP and level up',
    ],
    name: 'Free Account',
    price: 0,
  },
  {
    accountTier: 100,
    currency: 'cad',
    description:
      'Get all of the features of a free account plus some added benefits:',
    frequency: 'year',
    marketingFeatures: [
      'Add images and videos to your dive log entries',
      'Get advanced metrics with our enhanced dashboard for pro users',
      'Get a "Pro Diver" badge next to your username',
      'Earn XP faster than with a free account',
    ],
    name: 'Pro Membership',
    price: 40,
  },
  {
    accountTier: 200,
    currency: 'cad',
    description:
      'Get all of the benefits of a pro account, plus the ability to register and manage your dive shop on our site.',
    frequency: 'year',
    marketingFeatures: [
      "Register and manage your shop's profile",
      'Reach new divers by having your shop appear in search results',
      'Tag dive sites that your shop services to attract more customers',
    ],
    name: 'Shop Owner Membership',
    price: 100,
  },
] as const;

describe('Memberships API client', () => {
  let client: ApiClient;

  beforeAll(() => {
    client = new ApiClient();
  });

  afterEach(() => {
    mockFetch.restore();
  });

  it('will list available memberships', async () => {
    mockFetch.get('/api/membership', {
      status: 200,
      body: Memberships,
    });

    const results = await client.memberships.listMemberships();

    expect(mockFetch.done()).toBe(true);
    expect(results).toMatchSnapshot();
  });

  it("will retrieve a user's membership status", async () => {
    const username = 'el_userino';
    mockFetch.get(`/api/membership/${username}`, {
      status: 200,
      body: {
        accountTier: 200,
        entitlements: ['shop-owner-features', 'pro-features'],
        nextBillingDate: 1756902199000,
        status: 'trialing',
      },
    });

    const result = await client.memberships.getMembershipStatus(username);

    expect(mockFetch.done()).toBe(true);
    expect(result).toMatchSnapshot();
  });

  it('will cancel a membership', async () => {
    const username = 'el_userino';
    mockFetch.delete(`/api/membership/${username}`, 204);

    await client.memberships.cancelMembership(username);

    expect(mockFetch.done()).toBe(true);
  });

  it('will update a membership', async () => {
    const username = 'el_userino';
    const newAccountTier = AccountTier.ShopOwner;
    mockFetch.put(
      {
        url: `/api/membership/${username}`,
        body: { newAccountTier },
      },
      {
        status: 200,
        body: {
          accountTier: 200,
          entitlements: ['shop-owner-features', 'pro-features'],
          nextBillingDate: 1756902199000,
          status: 'trialing',
        },
      },
    );

    const result = await client.memberships.updateMembership(
      username,
      newAccountTier,
    );

    expect(mockFetch.done()).toBe(true);
    expect(result).toMatchSnapshot();
  });

  it('will create a payment session', async () => {
    const username = 'el_userino';
    mockFetch.post(`/api/membership/${username}/session`, {
      status: 200,
      body: {
        clientSecret:
          'pi_3PuyAkI1ADsIvyhF1fcohTWk_secret_ykKOAqkyzclpvYZd756qIOIuN',
        currency: 'cad',
        frequency: 'year',
        products: [
          {
            price: 40,
            product: 'Pro Membership',
          },
        ],
        total: 40,
      },
    });

    const result = await client.memberships.createSession(username);

    expect(mockFetch.done()).toBe(true);
    expect(result).toMatchSnapshot();
  });
});
