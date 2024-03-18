import { DepthUnit, UserRole } from '@bottomtime/api';

import { Repository } from 'typeorm';

import { DiveSiteEntity, UserEntity } from '../../../src/data';
import { DiveSite } from '../../../src/diveSites';
import { dataSource } from '../../data-source';
import { createTestUser } from '../../utils/create-test-user';

const RegularUserId = '5a4699d8-48c4-4410-9886-b74b8b85cac1';
const RegularUserData: Partial<UserEntity> = {
  id: RegularUserId,
  emailVerified: false,
  isLockedOut: false,
  memberSince: new Date('2024-01-08T13:24:58.620Z'),
  role: UserRole.User,
  username: 'Joe.Regular',
  usernameLowered: 'joe.regular',
  avatar: 'https://example.com/avatar.png',
  location: 'San Diego, CA',
  name: 'Joe Regular',
};

const DiveSiteData: Partial<DiveSiteEntity> = {
  id: '85f18003-fff8-4b54-8b58-d751ea613d79',
  createdOn: new Date('2024-01-08T13:33:52.364Z'),
  location: 'Cozumel, Mexico',
  name: 'Palancar Horseshoe',
  depth: 80,
  depthUnit: DepthUnit.Feet,
  description: 'This site is amazing',
  directions: 'Fly to Cozumel and then take a boat out there.',
  freeToDive: true,
  shoreAccess: false,
  gps: {
    type: 'Point',
    coordinates: [-86.933333, 20.433333],
  },
  averageDifficulty: 2.5,
  averageRating: 3.8,
};

describe('Dive Site Class', () => {
  let Users: Repository<UserEntity>;
  let DiveSites: Repository<DiveSiteEntity>;

  let diveSiteData: DiveSiteEntity;
  let site: DiveSite;
  let regularUser: UserEntity;

  beforeAll(() => {
    Users = dataSource.getRepository(UserEntity);
    DiveSites = dataSource.getRepository(DiveSiteEntity);
    regularUser = createTestUser(RegularUserData);
  });

  beforeEach(() => {
    diveSiteData = new DiveSiteEntity();
    Object.assign(diveSiteData, DiveSiteData);
    diveSiteData.creator = regularUser;
    site = new DiveSite(DiveSites, diveSiteData);
  });

  it('will return properties correctly', () => {
    expect(site.id).toEqual(DiveSiteData.id);
    expect(site.createdOn).toEqual(DiveSiteData.createdOn);
    expect(site.updatedOn).toBeUndefined();
    expect(site.creator).toEqual({
      userId: RegularUserId,
      username: RegularUserData.username,
      memberSince: RegularUserData.memberSince,
    });
    expect(site.averageRating).toEqual(DiveSiteData.averageRating);
    expect(site.averageDifficulty).toEqual(DiveSiteData.averageDifficulty);
    expect(site.depth).toEqual({
      depth: DiveSiteData.depth,
      unit: DiveSiteData.depthUnit,
    });
    expect(site.description).toEqual(DiveSiteData.description);
    expect(site.directions).toEqual(DiveSiteData.directions);
    expect(site.freeToDive).toEqual(DiveSiteData.freeToDive);
    expect(site.gps).toEqual({
      lat: DiveSiteData.gps!.coordinates[1],
      lon: DiveSiteData.gps!.coordinates[0],
    });
    expect(site.location).toEqual(DiveSiteData.location);
    expect(site.name).toEqual(DiveSiteData.name);
    expect(site.shoreAccess).toEqual(DiveSiteData.shoreAccess);
  });

  it('will return undefined for missing properties', () => {
    const data = new DiveSiteEntity();
    data.id = '8a1e4390-c0ae-48de-a76e-37e1a6093232';
    data.creator = regularUser;
    data.name = 'Dive Site';
    data.location = 'Imaginary Place';
    const site = new DiveSite(DiveSites, data);

    expect(site.updatedOn).toBeUndefined();
    expect(site.description).toBeUndefined();
    expect(site.depth).toBeUndefined();
    expect(site.directions).toBeUndefined();
    expect(site.gps).toBeUndefined();
    expect(site.freeToDive).toBeUndefined();
    expect(site.shoreAccess).toBeUndefined();
    expect(site.averageDifficulty).toBeUndefined();
    expect(site.averageRating).toBeUndefined();
  });

  it('will update properties', () => {
    const newDescription = 'This is a new description';
    site.description = newDescription;
    expect(site.description).toEqual(newDescription);

    const newDirections = 'These are new directions';
    site.directions = newDirections;
    expect(site.directions).toEqual(newDirections);

    const newFreeToDive = false;
    site.freeToDive = newFreeToDive;
    expect(site.freeToDive).toEqual(newFreeToDive);

    const newShoreAccess = true;
    site.shoreAccess = newShoreAccess;
    expect(site.shoreAccess).toEqual(newShoreAccess);

    const newGps = {
      lat: 20.433333,
      lon: -86.933333,
    };
    site.gps = newGps;
    expect(site.gps).toEqual(newGps);

    const newDepth = {
      depth: 80,
      unit: DepthUnit.Feet,
    };
    site.depth = newDepth;
    expect(site.depth).toEqual(newDepth);

    const newLocation = 'Cozumel, Mexico';
    site.location = newLocation;
    expect(site.location).toEqual(newLocation);

    const newName = 'Palancar Horseshoe';
    site.name = newName;
    expect(site.name).toEqual(newName);
  });

  it('will save changes to an existing dive site', async () => {
    await Users.save(regularUser);
    await DiveSites.save(diveSiteData);

    site.depth = {
      depth: 24.3,
      unit: DepthUnit.Meters,
    };
    site.description = 'This is a new description';
    site.directions = 'These are new directions';
    site.location = 'Cozumel, Mexico (West Side)';
    site.name = 'Palancar Reef';
    site.freeToDive = false;

    await site.save();

    const savedSite = await DiveSites.findOneOrFail({
      relations: ['creator'],
      where: { id: DiveSiteData.id },
    });

    expect(savedSite.depth).toEqual(24.3);
    expect(savedSite.depthUnit).toEqual(DepthUnit.Meters);
    expect(savedSite.description).toEqual('This is a new description');
    expect(savedSite.directions).toEqual('These are new directions');
    expect(savedSite.location).toEqual('Cozumel, Mexico (West Side)');
    expect(savedSite.freeToDive).toEqual(false);
    expect(savedSite.name).toEqual('Palancar Reef');
  });

  it('will delete a dive site', async () => {
    await Users.save(regularUser);
    await DiveSites.save(diveSiteData);
    await expect(site.delete()).resolves.toBe(true);
    await expect(DiveSites.existsBy({ id: site.id })).resolves.toBe(false);
  });

  it('will return false if delete is called against a dive site that does not exist in the database', async () => {
    await expect(site.delete()).resolves.toBe(false);
  });

  it('will render dive site data as JSON', () => {
    expect(site.toJSON()).toMatchSnapshot();
  });
});
