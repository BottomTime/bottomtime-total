import mockFetch from 'fetch-mock-jest';

import { Fetcher, Operator } from '../../src/client';
import {
  AccountTier,
  CreateOrUpdateOperatorDTO,
  LogBookSharing,
  OperatorDTO,
  VerificationStatus,
} from '../../src/types';

const TestData: OperatorDTO = {
  active: true,
  address: '3 Bay St, Tobermory, ON N0H 2R0, Canada',
  banner:
    'https://diversden.ca/wp-content/uploads/2021/06/divers-den-banner.jpg',
  createdAt: new Date('2022-06-20T11:45:21.000Z'),
  description: `Welcome to Tobermory, the Scuba Diving Capital of Canada!
Discover the world below the waves of the Fathom Five National Marine Park, home to more than 20 shipwrecks.
Immerse yourself in the captivating history of century old ships and catch a glimpse of their haunting beauty.
Whether or not you are a certified scuba diver, you can explore this hidden world and have the experience of a lifetime.`,
  email: 'info@diversden.ca',
  gps: {
    lat: 45.25484,
    lon: -81.66554,
  },
  id: 'f6fc189e-126e-49ac-95aa-c2ffd9a03140',
  logo: 'https://diversden.ca/wp-content/uploads/2021/06/divers-den-logo.png',
  name: "Diver's Den",
  owner: {
    accountTier: AccountTier.Basic,
    avatar: 'https://example.com/avatar.png',
    location: 'Toronto, ON, Canada',
    logBookSharing: LogBookSharing.Public,
    memberSince: new Date('2021-06-10T03:00:00.000Z'),
    name: 'Test User',
    userId: '54ca5e54-de92-4e15-a523-4087c52b40eb',
    username: 'testuser',
  },
  phone: '+1 519-596-2363',
  slug: 'divers-den',
  socials: {
    facebook: 'diversdentobermory',
    instagram: 'diversden',
    tiktok: '@diversden',
    twitter: 'diversden',
  },
  updatedAt: new Date('2024-07-29T11:45:21.000Z'),
  verificationStatus: VerificationStatus.Rejected,
  verificationMessage: 'Your address is fake!',
  website: 'https://diversden.ca',
};

describe('Operator API class', () => {
  let fetcher: Fetcher;

  let operator: Operator;

  beforeAll(() => {
    fetcher = new Fetcher();
  });

  beforeEach(() => {
    operator = new Operator(fetcher, { ...TestData });
  });

  afterEach(() => {
    mockFetch.restore();
  });

  it('will return properties correctly', () => {
    expect(operator.id).toBe(TestData.id);
    expect(operator.active).toBe(TestData.active);
    expect(operator.createdAt).toBe(TestData.createdAt);
    expect(operator.updatedAt).toBe(TestData.updatedAt);
    expect(operator.owner).toEqual(TestData.owner);
    expect(operator.verificationStatus).toBe(TestData.verificationStatus);
    expect(operator.verificationMessage).toBe(TestData.verificationMessage);
    expect(operator.logo).toBe(TestData.logo);
    expect(operator.banner).toBe(TestData.banner);
    expect(operator.name).toBe(TestData.name);
    expect(operator.slug).toBe(TestData.slug);
    expect(operator.description).toBe(TestData.description);
    expect(operator.address).toBe(TestData.address);
    expect(operator.phone).toBe(TestData.phone);
    expect(operator.email).toBe(TestData.email);
    expect(operator.website).toBe(TestData.website);
    expect(operator.gps).toEqual(TestData.gps);
    expect(operator.socials).toEqual(TestData.socials);
  });

  it('will allow properties to be updated', () => {
    const newActive = false;
    const newName = 'New Name';
    const newSlug = 'new-slug';
    const newDescription = 'New Description';
    const newAddress = 'New Address';
    const newPhone = '123-456-7890';
    const newEmail = 'email@email.org';
    const newWebsite = 'https://new-website.org';
    const newGPS = { lat: 0, lon: 0 };
    const newSocials = {
      facebook: 'new-facebook',
      twitter: 'new-twitter',
      instagram: 'new-instagram',
      tiktok: 'new-tiktok',
    };

    operator.active = newActive;
    operator.name = newName;
    operator.slug = newSlug;
    operator.description = newDescription;
    operator.address = newAddress;
    operator.phone = newPhone;
    operator.email = newEmail;
    operator.website = newWebsite;
    operator.gps = newGPS;
    operator.socials = newSocials;

    expect(operator.active).toBe(newActive);
    expect(operator.name).toBe(newName);
    expect(operator.slug).toBe(newSlug);
    expect(operator.description).toBe(newDescription);
    expect(operator.address).toBe(newAddress);
    expect(operator.phone).toBe(newPhone);
    expect(operator.email).toBe(newEmail);
    expect(operator.website).toBe(newWebsite);
    expect(operator.gps).toEqual(newGPS);
    expect(operator.socials).toEqual(newSocials);
  });

  it('will return the dive operator as a JSON object', () => {
    expect(operator.toJSON()).toEqual(TestData);
  });

  it('will save changes to the dive operator', async () => {
    const options: CreateOrUpdateOperatorDTO = {
      active: true,
      name: 'New Name',
      slug: TestData.slug,
      description: 'New Description',
      address: 'New Address',
      phone: '123-456-7890',
      email: 'newemail@email.org',
      gps: { lat: 0, lon: 0 },
      website: 'https://new-website.org',
      socials: {
        facebook: 'new-facebook',
        twitter: 'new-twitter',
        instagram: 'new-instagram',
        tiktok: 'new-tiktok',
      },
    };
    mockFetch.put(
      {
        url: `/api/operators/${operator.slug}`,
        body: options,
      },
      {
        status: 200,
        body: {
          ...TestData,
          ...options,
        },
      },
    );

    operator.active = options.active;
    operator.address = options.address;
    operator.description = options.description;
    operator.email = options.email;
    operator.gps = options.gps;
    operator.name = options.name;
    operator.phone = options.phone;
    operator.socials = options.socials;
    operator.website = options.website;
    await operator.save();

    expect(operator.updatedAt.valueOf()).toBeCloseTo(Date.now(), -3);
    expect(mockFetch.done()).toBe(true);
  });

  it('will delete a dive operator', async () => {
    mockFetch.delete(`/api/operators/${operator.slug}`, 204);
    await operator.delete();
    expect(mockFetch.done()).toBe(true);
  });

  it('will change a dive operator slug', async () => {
    const newSlug = 'new-slug';
    const options: CreateOrUpdateOperatorDTO = {
      active: TestData.active,
      name: TestData.name,
      slug: newSlug,
      description: TestData.description,
      address: TestData.address,
      phone: TestData.phone,
      email: TestData.email,
      gps: TestData.gps,
      website: TestData.website,
      socials: { ...TestData.socials },
    };
    mockFetch.put(
      {
        url: `/api/operators/${TestData.slug}`,
        body: options,
      },
      {
        status: 200,
        body: {
          ...TestData,
          ...options,
        },
      },
    );

    operator.slug = newSlug;
    await operator.save();

    expect(mockFetch.done()).toBe(true);
    expect(operator.slug).toBe(newSlug);
    expect(operator.updatedAt.valueOf()).toBeCloseTo(Date.now(), -3);
  });

  it('will transfer ownership to another user', async () => {
    const newOwner = 'EmilyDives69';

    mockFetch.post(
      {
        url: `/api/operators/${operator.slug}/transfer`,
        body: {
          newOwner,
        },
      },
      {
        status: 200,
        body: {
          ...TestData,
          owner: {
            userId: '42da3369-0843-4a72-8222-c7e06ea886c8',
            accountTier: AccountTier.ShopOwner,
            username: newOwner,
            memberSince: new Date('2024-07-30T15:36:34Z'),
          },
        },
      },
    );

    await operator.transferOwnership(newOwner);

    expect(operator.owner.username).toEqual(newOwner);
    expect(mockFetch.done()).toBe(true);
  });

  it('will request verification for a dive operator', async () => {
    mockFetch.post(`/api/operators/${operator.slug}/requestVerification`, 204);

    await operator.requestVerification();

    expect(mockFetch.done()).toBe(true);
    expect(operator.verificationStatus).toBe(VerificationStatus.Pending);
    expect(operator.updatedAt.valueOf()).toBeCloseTo(Date.now(), -3);
  });

  it('will verify a dive operator', async () => {
    mockFetch.post(
      {
        url: `/api/operators/${operator.slug}/verify`,
        body: { verified: true },
      },
      204,
    );

    await operator.setVerified(true);

    expect(mockFetch.done()).toBe(true);
    expect(operator.verificationStatus).toBe(VerificationStatus.Verified);
    expect(operator.updatedAt.valueOf()).toBeCloseTo(Date.now(), -3);
  });

  it('will reject a dive operator verification', async () => {
    mockFetch.post(
      {
        url: `/api/operators/${operator.slug}/verify`,
        body: { verified: false, message: 'Invalid address' },
      },
      204,
    );

    await operator.setVerified(false, 'Invalid address');

    expect(mockFetch.done()).toBe(true);
    expect(operator.verificationStatus).toBe(VerificationStatus.Rejected);
    expect(operator.verificationMessage).toBe('Invalid address');
  });
});
