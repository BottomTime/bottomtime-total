import { DepthUnit, UserRole } from '@bottomtime/api';
import { UserData, UserModel } from '../../../src/schemas';
import {
  DiveSiteData,
  DiveSiteDocument,
  DiveSiteModel,
} from '../../../src/schemas/dive-sites.document';
import { DiveSite } from '../../../src/diveSites/dive-site';
import { AnonymousUserProfile } from '../../../src/common';

const RegularUserId = '5A4699D8-48C4-4410-9886-B74B8B85CAC1';
const RegularUserData: UserData = {
  _id: RegularUserId,
  emailVerified: false,
  isLockedOut: false,
  memberSince: new Date('2024-01-08T13:24:58.620Z'),
  role: UserRole.User,
  username: 'Joe.Regular',
  usernameLowered: 'joe.regular',
  profile: {
    avatar: 'https://example.com/avatar.png',
    location: 'San Diego, CA',
    name: 'Joe Regular',
  },
};

const DiveSiteData: DiveSiteData = {
  _id: '85F18003-FFF8-4B54-8B58-D751EA613D79',
  createdOn: new Date('2024-01-08T13:33:52.364Z'),
  creator: RegularUserId,
  location: 'Cozumel, Mexico',
  name: 'Palancar Horseshoe',
  averageDifficulty: 2.2,
  averageRating: 4.7,
  depth: {
    depth: 80,
    unit: DepthUnit.Feet,
  },
  description: 'This site is amazing',
  directions: 'Fly to Cozumel and then take a boat out there.',
  freeToDive: true,
  shoreAccess: false,
  gps: {
    type: 'Point',
    coordinates: [-86.933333, 20.433333],
  },
};

describe('Dive Site Class', () => {
  let diveSiteData: DiveSiteDocument;
  let site: DiveSite;

  beforeEach(async () => {
    const user = new UserModel(RegularUserData);
    await user.save();

    diveSiteData = new DiveSiteModel(DiveSiteData);
    await diveSiteData.populate('creator');

    site = new DiveSite(DiveSiteModel, diveSiteData);
  });

  it('will return properties correctly', () => {
    expect(site.id).toEqual(DiveSiteData._id);
    expect(site.createdOn).toEqual(DiveSiteData.createdOn);
    expect(site.updatedOn).toBeUndefined();
    expect(site.creator).toEqual({
      userId: RegularUserId,
      username: RegularUserData.username,
      memberSince: RegularUserData.memberSince,
    });
    expect(site.averageRating).toEqual(DiveSiteData.averageRating);
    expect(site.averageDifficulty).toEqual(DiveSiteData.averageDifficulty);
    expect(site.depth).toEqual(DiveSiteData.depth);
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
    const data = new DiveSiteModel({
      _id: '8A1E4390-C0AE-48DE-A76E-37E1A6093232',
      creator: RegularUserId,
      createdOn: new Date(),
      name: 'Dive Site',
      location: 'Imaginary Place',
    });
    const site = new DiveSite(DiveSiteModel, data);

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

  it('will return creator properties if populated', async () => {
    expect(site.creator).toEqual({
      userId: RegularUserId,
      username: RegularUserData.username,
      memberSince: RegularUserData.memberSince,
    });
  });

  it('will throw an error if creator is not populated', async () => {
    await diveSiteData.depopulate('creator');
    expect(() => site.creator).toThrow();
  });

  it('will return a default creator object if creator is populated but resolved to null', async () => {
    diveSiteData.depopulate('creator');
    await UserModel.findByIdAndDelete(RegularUserId);
    await diveSiteData.populate('creator');

    expect(site.creator).toEqual(AnonymousUserProfile);
  });

  it('will save a new dive site', async () => {
    await site.save();
    diveSiteData.depopulate('creator');
    const savedSite = await DiveSiteModel.findById(DiveSiteData._id);
    expect(savedSite).not.toBeNull();
    expect(savedSite?.toJSON()).toEqual(diveSiteData.toJSON());
  });

  it('will save changes to an existing dive site', async () => {
    await diveSiteData.save();
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

    diveSiteData.depopulate('creator');
    const savedSite = await DiveSiteModel.findById(DiveSiteData._id);
    expect(savedSite).not.toBeNull();
    expect(savedSite?.toJSON()).toEqual(diveSiteData.toJSON());
  });

  it('will delete a dive site', async () => {
    await site.save();
    await expect(site.delete()).resolves.toBe(true);
    const deletedSite = await DiveSiteModel.findById(DiveSiteData._id);
    expect(deletedSite).toBeNull();
  });

  it('will return false if delete is called against a dive site that does not exist in the database', async () => {
    await expect(site.delete()).resolves.toBe(false);
  });

  it('will render dive site data as JSON', () => {
    expect(site.toJSON()).toMatchSnapshot();
  });
});
