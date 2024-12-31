import {
  AccountTier,
  LogBookSharing,
  VerificationStatus,
} from '@bottomtime/api';

import { ConflictException } from '@nestjs/common';

import { Repository } from 'typeorm';

import { OperatorEntity, UserEntity } from '../../../src/data';
import { Operator } from '../../../src/operators';
import { User } from '../../../src/users';
import { dataSource } from '../../data-source';
import { createTestUser } from '../../utils/create-test-user';

const TestData: OperatorEntity = {
  id: 'f6fc189e-126e-49ac-95aa-c2ffd9a03140',
  active: true,
  createdAt: new Date('2022-06-20T11:45:21Z'),
  updatedAt: new Date('2024-07-29T11:45:21Z'),
  deletedAt: null,
  name: "Diver's Den",
  slug: 'divers-den',
  verificationStatus: VerificationStatus.Rejected,
  verificationMessage: 'Nope',
  description: `Welcome to Tobermory, the Scuba Diving Capital of Canada!
Discover the world below the waves of the Fathom Five National Marine Park, home to more than 20 shipwrecks.
Immerse yourself in the captivating history of century old ships and catch a glimpse of their haunting beauty.
Whether or not you are a certified scuba diver, you can explore this hidden world and have the experience of a lifetime.`,
  address: '3 Bay St, Tobermory, ON N0H 2R0, Canada',
  phone: '+1 519-596-2363',
  email: 'info@diversden.ca',
  website: 'https://diversden.ca',
  gps: {
    type: 'Point',
    coordinates: [-81.66554, 45.25484],
  },
  facebook: 'diversdentobermory',
  instagram: 'diversden',
  logo: 'https://diversden.ca/wp-content/uploads/2021/06/divers-den-logo.png',
  banner:
    'https://diversden.ca/wp-content/uploads/2021/06/divers-den-banner.jpg',
  tiktok: '@diversden',
  twitter: 'diversden',
  youtube: 'diversden',
};

describe('Operator class', () => {
  let Users: Repository<UserEntity>;
  let Operators: Repository<OperatorEntity>;

  let owner: UserEntity;
  let otherUser: UserEntity;
  let data: OperatorEntity;
  let operator: Operator;

  beforeAll(() => {
    Users = dataSource.getRepository(UserEntity);
    Operators = dataSource.getRepository(OperatorEntity);

    owner = createTestUser({
      accountTier: AccountTier.Basic,
      id: '54ca5e54-de92-4e15-a523-4087c52b40eb',
      username: 'testuser',
      memberSince: new Date('2021-06-10T03:00:00Z'),
      logBookSharing: LogBookSharing.Public,
      avatar: 'https://example.com/avatar.png',
      location: 'Toronto, ON, Canada',
      name: 'Test User',
    });

    otherUser = createTestUser({
      accountTier: AccountTier.Basic,
      id: '1938f360-9842-498a-ab0e-f42d3b0b495a',
      username: 'other_dude',
      memberSince: new Date('2024-07-30T12:25:45Z'),
      logBookSharing: LogBookSharing.FriendsOnly,
      avatar: 'https://example.com/other_avatar.png',
      location: 'Vancouver, BC, Canada',
      name: 'Other Dude',
    });
  });

  beforeEach(async () => {
    await Users.save([owner, otherUser]);
    data = {
      ...TestData,
      owner,
    };
    operator = new Operator(Operators, data);
  });

  it('will return properties correctly', () => {
    expect(operator.id).toBe(TestData.id);
    expect(operator.createdAt).toEqual(TestData.createdAt);
    expect(operator.updatedAt).toEqual(TestData.updatedAt);
    expect(operator.owner).toEqual({
      accountTier: owner.accountTier,
      userId: owner.id,
      username: owner.username,
      memberSince: owner.memberSince.valueOf(),
      logBookSharing: owner.logBookSharing,
      avatar: owner.avatar,
      location: owner.location,
      name: owner.name,
    });
    expect(operator.active).toBe(TestData.active);
    expect(operator.name).toBe(TestData.name);
    expect(operator.slug).toBe(TestData.slug);
    expect(operator.verificationStatus).toBe(TestData.verificationStatus);
    expect(operator.verificationMessage).toBe(TestData.verificationMessage);
    expect(operator.description).toBe(TestData.description);
    expect(operator.address).toBe(TestData.address);
    expect(operator.phone).toBe(TestData.phone);
    expect(operator.email).toBe(TestData.email);
    expect(operator.website).toBe(TestData.website);
    expect(operator.gps).toEqual({
      lat: TestData.gps!.coordinates[1],
      lon: TestData.gps!.coordinates[0],
    });
    expect(operator.socials.facebook).toBe(TestData.facebook);
    expect(operator.socials.instagram).toBe(TestData.instagram);
    expect(operator.socials.tiktok).toBe(TestData.tiktok);
    expect(operator.socials.twitter).toBe(TestData.twitter);
    expect(operator.socials.youtube).toBe(TestData.youtube);
    expect(operator.logo).toBe(TestData.logo);
    expect(operator.banner).toBe(TestData.banner);
  });

  it('will return a blank owner object if owner is not returned on entity', () => {
    data.owner = undefined;
    expect(operator.owner).toEqual({
      accountTier: AccountTier.Basic,
      userId: '',
      username: '',
      memberSince: new Date(0).valueOf(),
      logBookSharing: LogBookSharing.Private,
    });
  });

  it('will allow properties to be updated', () => {
    const newActive = false;
    const newName = "Dive 'n' Dive";
    const newSlug = 'dive-n-dive';
    const newDescription = 'A new description';
    const newAddress = '123 Main St, Anytown, USA';
    const newPhone = '+1 555-555-5555';
    const newEmail = 'email@gmail.org';
    const newWebsite = 'https://example.com';
    const newGps = { lat: 0, lon: 0 };
    const newFacebook = 'facebook';
    const newInstagram = 'instagram';
    const newTiktok = 'tiktok';
    const newTwitter = 'twitter';
    const newYoutube = 'youtube';
    const newLogo = 'https://example.com/logo.png';
    const newBanner = 'https://example.com/banner.jpg';

    operator.name = newName;
    operator.active = newActive;
    operator.slug = newSlug;
    operator.description = newDescription;
    operator.address = newAddress;
    operator.phone = newPhone;
    operator.email = newEmail;
    operator.website = newWebsite;
    operator.gps = newGps;
    operator.socials.facebook = newFacebook;
    operator.socials.instagram = newInstagram;
    operator.socials.tiktok = newTiktok;
    operator.socials.twitter = newTwitter;
    operator.socials.youtube = newYoutube;
    operator.logo = newLogo;
    operator.banner = newBanner;

    expect(operator.active).toBe(newActive);
    expect(operator.name).toBe(newName);
    expect(operator.slug).toBe(newSlug);
    expect(operator.description).toBe(newDescription);
    expect(operator.address).toBe(newAddress);
    expect(operator.phone).toBe(newPhone);
    expect(operator.email).toBe(newEmail);
    expect(operator.website).toBe(newWebsite);
    expect(operator.gps).toEqual(newGps);
    expect(operator.socials.facebook).toBe(newFacebook);
    expect(operator.socials.instagram).toBe(newInstagram);
    expect(operator.socials.tiktok).toBe(newTiktok);
    expect(operator.socials.twitter).toBe(newTwitter);
    expect(operator.socials.youtube).toBe(newYoutube);
    expect(operator.logo).toBe(newLogo);
    expect(operator.banner).toBe(newBanner);
  });

  it('will convert new slugs to lowercase', () => {
    operator.slug = 'Slammin-Dive-Shop';
    expect(operator.slug).toBe('slammin-dive-shop');
  });

  it('will save a new dive operator', async () => {
    await operator.save();

    const savedOperator = await Operators.findOneOrFail({
      where: { id: operator.id },
      relations: ['owner'],
    });

    expect(savedOperator.address).toBe(data.address);
    expect(savedOperator.description).toBe(data.description);
    expect(savedOperator.email).toBe(data.email);
    expect(savedOperator.gps).toEqual({
      type: 'Point',
      coordinates: [data.gps!.coordinates[0], data.gps!.coordinates[1]],
    });
    expect(savedOperator.name).toBe(data.name);
    expect(savedOperator.slug).toBe(data.slug);
    expect(savedOperator.phone).toBe(data.phone);
    expect(savedOperator.website).toBe(data.website);
    expect(savedOperator.facebook).toBe(data.facebook);
    expect(savedOperator.instagram).toBe(data.instagram);
    expect(savedOperator.tiktok).toBe(data.tiktok);
    expect(savedOperator.twitter).toBe(data.twitter);
    expect(savedOperator.youtube).toBe(data.youtube);
    expect(savedOperator.owner!.id).toEqual(owner.id);
    expect(savedOperator.id).toBe(operator.id);
    expect(savedOperator.createdAt).toEqual(operator.createdAt);
    expect(savedOperator.updatedAt.valueOf()).toBeCloseTo(Date.now(), -3);
    expect(savedOperator.verificationStatus).toBe(operator.verificationStatus);
    expect(savedOperator.verificationMessage).toBe(
      operator.verificationMessage,
    );
  });

  it('will update an existing dive operator', async () => {
    await Operators.save(data);

    const newActive = false;
    const newName = "Dive 'n' Dive";
    const newSlug = 'dive-n-dive';
    const newDescription = 'A new description';
    const newAddress = '123 Main St, Anytown, USA';
    const newPhone = '+1 555-555-5555';
    const newEmail = 'email@gmail.org';
    const newWebsite = 'https://example.com';
    const newGps = { lat: 0, lon: 0 };
    const newFacebook = 'facebook';
    const newInstagram = 'instagram';
    const newTiktok = 'tiktok';
    const newTwitter = 'twitter';
    const newYoutube = 'youtube';

    operator.active = newActive;
    operator.name = newName;
    operator.slug = newSlug;
    operator.description = newDescription;
    operator.address = newAddress;
    operator.phone = newPhone;
    operator.email = newEmail;
    operator.website = newWebsite;
    operator.gps = newGps;
    operator.socials.facebook = newFacebook;
    operator.socials.instagram = newInstagram;
    operator.socials.tiktok = newTiktok;
    operator.socials.twitter = newTwitter;
    operator.socials.youtube = newYoutube;

    await operator.save();

    const savedOperator = await Operators.findOneOrFail({
      where: { id: operator.id },
      relations: ['owner'],
    });

    expect(savedOperator.active).toBe(newActive);
    expect(savedOperator.address).toBe(newAddress);
    expect(savedOperator.description).toBe(newDescription);
    expect(savedOperator.email).toBe(newEmail);
    expect(savedOperator.gps).toEqual({
      type: 'Point',
      coordinates: [newGps.lon, newGps.lat],
    });
    expect(savedOperator.name).toBe(newName);
    expect(savedOperator.slug).toBe(newSlug);
    expect(savedOperator.phone).toBe(newPhone);
    expect(savedOperator.website).toBe(newWebsite);
    expect(savedOperator.facebook).toBe(newFacebook);
    expect(savedOperator.instagram).toBe(newInstagram);
    expect(savedOperator.tiktok).toBe(newTiktok);
    expect(savedOperator.twitter).toBe(newTwitter);
    expect(savedOperator.youtube).toBe(newYoutube);
    expect(savedOperator.updatedAt.valueOf()).toBeCloseTo(Date.now(), -3);
  });

  it('will throw a ConflictException if the slug is taken by another dive operator', async () => {
    const newData = new OperatorEntity();
    newData.id = '5769178f-c2ab-4b68-a166-d87e76339b2d';
    newData.name = 'Different Operator';
    newData.slug = TestData.slug;
    newData.owner = owner;
    const newOperator = new Operator(Operators, newData);
    await Operators.save(data);

    await expect(newOperator.save()).rejects.toThrow(ConflictException);
  });

  it('will soft delete an operator', async () => {
    await Operators.save(data);

    await expect(operator.delete()).resolves.toBe(true);

    await expect(Operators.findOneBy({ id: operator.id })).resolves.toBeNull();
    await expect(
      Operators.findOne({ where: { id: operator.id }, withDeleted: true }),
    ).resolves.not.toBeNull();
  });

  it('will return false when deleting a non-existent operator', async () => {
    await expect(operator.delete()).resolves.toBe(false);
  });

  it('will return a copy of the internal entity', () => {
    const entity = operator.toEntity();
    expect(entity).toEqual(data);
  });

  it('will return a JSON representation of the dive operator', () => {
    const json = operator.toJSON();
    expect(json).toMatchSnapshot();
  });

  it('will return a succinct JSON representation of the dive operator', () => {
    const json = operator.toJSON();
    expect(json).toMatchSnapshot();
  });

  it('will transfer ownership to a new user', async () => {
    const newOwner = new User(Users, otherUser);
    await operator.transferOwnership(newOwner);

    expect(operator.owner.userId).toEqual(newOwner.id);
    expect(operator.updatedAt.valueOf()).toBeCloseTo(Date.now(), -3);

    const saved = await Operators.findOneOrFail({
      where: { id: operator.id },
      relations: ['owner'],
    });
    expect(saved.owner!.id).toEqual(newOwner.id);
    expect(saved.updatedAt.valueOf()).toBeCloseTo(Date.now(), -3);
  });

  it('will verify a dive operator', async () => {
    await operator.setVerification(true);

    expect(operator.verificationStatus).toBe(VerificationStatus.Verified);
    expect(operator.verificationMessage).toBeUndefined();
    expect(operator.updatedAt.valueOf()).toBeCloseTo(Date.now(), -3);

    const saved = await Operators.findOneByOrFail({
      id: operator.id,
    });
    expect(saved.verificationStatus).toBe(VerificationStatus.Verified);
    expect(saved.verificationMessage).toBeNull();
    expect(saved.updatedAt.valueOf()).toBeCloseTo(Date.now(), -3);
  });

  it('will unverify a dive operator', async () => {
    const message = 'Hell no.';
    await operator.setVerification(false, message);

    expect(operator.verificationStatus).toBe(VerificationStatus.Rejected);
    expect(operator.verificationMessage).toBe(message);
    expect(operator.updatedAt.valueOf()).toBeCloseTo(Date.now(), -3);

    const saved = await Operators.findOneByOrFail({
      id: operator.id,
    });
    expect(saved.verificationStatus).toBe(VerificationStatus.Rejected);
    expect(saved.verificationMessage).toBe(message);
    expect(saved.updatedAt.valueOf()).toBeCloseTo(Date.now(), -3);
  });

  it('will request a verification', async () => {
    await operator.requestVerification();

    expect(operator.verificationStatus).toBe(VerificationStatus.Pending);
    expect(operator.updatedAt.valueOf()).toBeCloseTo(Date.now(), -3);

    const saved = await Operators.findOneByOrFail({
      id: operator.id,
    });
    expect(saved.verificationStatus).toBe(VerificationStatus.Pending);
    expect(saved.updatedAt.valueOf()).toBeCloseTo(Date.now(), -3);
  });
});
