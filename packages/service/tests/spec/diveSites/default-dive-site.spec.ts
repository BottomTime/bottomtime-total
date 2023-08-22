import { Collection } from 'mongodb';

import { Collections, DiveSiteDocument, UserDocument } from '../../../src/data';
import { createTestLogger } from '../../test-logger';
import { DefaultDiveSite, DiveSiteCreator } from '../../../src/diveSites';
import { fakeDiveSite } from '../../fixtures/fake-dive-site';
import { mongoClient } from '../../mongo-client';
import { fakeUser } from '../../fixtures/fake-user';
import { ValidationError } from '../../../src/errors';
import { faker } from '@faker-js/faker';
import { DepthUnit } from '../../../src/constants';

const log = createTestLogger('default-dive-site');

describe('Default Dive Site', () => {
  let Sites: Collection<DiveSiteDocument>;
  let Users: Collection<UserDocument>;

  beforeAll(() => {
    const db = mongoClient.db();
    Sites = db.collection(Collections.DiveSites);
    Users = db.collection(Collections.Users);
  });

  it('Will return properties correctly', () => {
    const data = fakeDiveSite();
    const site = new DefaultDiveSite(mongoClient, log, data);
    expect(site.averageRating).toEqual(data.averageRating);
    expect(site.averageDifficulty).toEqual(data.averageDifficulty);
    expect(site.createdOn).toEqual(data.createdOn);
    expect(site.description).toEqual(data.description);
    expect(site.directions).toEqual(data.directions);
    expect(site.freeToDive).toEqual(data.freeToDive);
    expect(site.gps).toEqual({
      lat: data.gps!.coordinates[1],
      lon: data.gps!.coordinates[0],
    });
    expect(site.id).toEqual(data._id);
    expect(site.location).toEqual(data.location);
    expect(site.name).toEqual(data.name);
    expect(site.shoreAccess).toEqual(data.shoreAccess);
    expect(site.updatedOn).toEqual(data.updatedOn);
  });

  it('Will allow properties to be updated', () => {
    const oldData = fakeDiveSite();
    const newData = fakeDiveSite({
      freeToDive: !oldData.freeToDive,
      shoreAccess: !oldData.shoreAccess,
    });
    const site = new DefaultDiveSite(mongoClient, log, oldData);

    site.description = newData.description!;
    site.directions = newData.directions!;
    site.freeToDive = newData.freeToDive!;
    site.gps = {
      lat: newData.gps!.coordinates[1],
      lon: newData.gps!.coordinates[0],
    };
    site.location = newData.location;
    site.name = newData.name;
    site.shoreAccess = newData.shoreAccess!;

    expect(site.description).toEqual(newData.description);
    expect(site.directions).toEqual(newData.directions);
    expect(site.freeToDive).toEqual(newData.freeToDive);
    expect(site.gps).toEqual({
      lat: newData.gps!.coordinates[1],
      lon: newData.gps!.coordinates[0],
    });
    expect(site.location).toEqual(newData.location);
    expect(site.name).toEqual(newData.name);
    expect(site.shoreAccess).toEqual(newData.shoreAccess);
  });

  it('Will save a new dive site', async () => {
    const expected = fakeDiveSite();
    const site = new DefaultDiveSite(mongoClient, log, expected);
    await site.save();
    expected.updatedOn = site.updatedOn;
    const actual = await Sites.findOne({ _id: expected._id });
    expect(actual).toEqual(expected);
  });

  it('Will update an existing dive site', async () => {
    const oldData = fakeDiveSite();
    const newData = fakeDiveSite({
      _id: oldData._id,
      creator: oldData.creator,
      createdOn: oldData.createdOn,
      updatedOn: oldData.updatedOn,
      averageRating: oldData.averageRating,
      reviews: oldData.reviews,
    });
    await Sites.insertOne(oldData);
    const site = new DefaultDiveSite(mongoClient, log, newData);

    await site.save();

    newData.updatedOn = site.updatedOn;
    const actual = await Sites.findOne({ _id: newData._id });
    expect(actual).toEqual(newData);
  });

  it('Will remove fields that have been set to undefined when saving', async () => {
    const expected = fakeDiveSite();
    const site = new DefaultDiveSite(mongoClient, log, expected);
    await Sites.insertOne(expected);

    site.description = undefined;
    site.directions = undefined;
    site.freeToDive = undefined;
    site.gps = undefined;
    site.shoreAccess = undefined;

    delete expected.description;
    delete expected.directions;
    delete expected.freeToDive;
    delete expected.gps;
    delete expected.shoreAccess;

    await site.save();

    expected.updatedOn = site.updatedOn;
    const actual = await Sites.findOne({ _id: expected._id });
    expect(actual).toEqual(expected);
  });

  describe('Will catch validation errors on save', () => {
    const testCases: { name: string; data: Partial<DiveSiteDocument> }[] = [
      {
        name: 'Name is missing',
        data: {
          name: '',
        },
      },
      {
        name: 'Name is too long',
        data: {
          name: faker.lorem.sentences(10),
        },
      },
      {
        name: 'Description is too long',
        data: {
          description: faker.lorem.paragraphs(20),
        },
      },
      {
        name: 'Location is missing',
        data: {
          location: '',
        },
      },
      {
        name: 'Location is too long',
        data: {
          location: faker.lorem.sentences(10),
        },
      },
      {
        name: 'Directions are too long',
        data: {
          directions: faker.lorem.paragraphs(12),
        },
      },
      {
        name: 'GPS - Longitude is less than -180',
        data: {
          gps: {
            type: 'Point',
            coordinates: [-181, -90],
          },
        },
      },
      {
        name: 'GPS - Longitude is greater than 180',
        data: {
          gps: {
            type: 'Point',
            coordinates: [181, 90],
          },
        },
      },
      {
        name: 'GPS - Latitude is less than -90',
        data: {
          gps: {
            type: 'Point',
            coordinates: [-180, -91],
          },
        },
      },
      {
        name: 'GPS - Latitude is greater than 90',
        data: {
          gps: {
            type: 'Point',
            coordinates: [180, 91],
          },
        },
      },
      {
        name: 'Average rating is less than 1',
        data: {
          averageRating: 0.5,
        },
      },
      {
        name: 'Average rating is greater than 5',
        data: {
          averageRating: 5.5,
        },
      },
      {
        name: 'Average difficulty is less than 1',
        data: {
          averageDifficulty: 0.5,
        },
      },
      {
        name: 'Average difficulty is greater than 5',
        data: {
          averageDifficulty: 5.5,
        },
      },
    ];

    testCases.forEach((testCase) => {
      it(testCase.name, async () => {
        const data = fakeDiveSite(testCase.data);
        const site = new DefaultDiveSite(mongoClient, log, data);
        await expect(site.save()).rejects.toThrowError(ValidationError);
      });
    });
  });

  it('Will delete a dive site', async () => {
    const data = fakeDiveSite();
    const site = new DefaultDiveSite(mongoClient, log, data);
    await Sites.insertOne(data);
    await site.delete();
    await expect(Sites.findOne({ _id: data._id })).resolves.toBeNull();
  });

  it('Will perform a no-op when deleting a site that does not exist', async () => {
    const data = fakeDiveSite();
    const site = new DefaultDiveSite(mongoClient, log, data);
    await expect(site.delete()).resolves.toBeUndefined();
  });

  it('Will return creator info if it is provided in constructor', async () => {
    const creatorData = fakeUser();
    const creator: DiveSiteCreator = {
      id: creatorData._id,
      username: creatorData.username,
      displayName: creatorData.profile!.name!,
    };
    const siteData = fakeDiveSite({ creator: creator.id });
    const site = new DefaultDiveSite(mongoClient, log, siteData, creator);
    await expect(site.getCreator()).resolves.toEqual(creator);
  });

  it('Will attempt to lazy-load creator info it is not provided in constructor', async () => {
    const creatorData = fakeUser();
    const expected: DiveSiteCreator = {
      avatar: creatorData.profile?.avatar,
      id: creatorData._id,
      username: creatorData.username,
      displayName: creatorData.profile!.name!,
    };
    await Users.insertOne(creatorData);
    const siteData = fakeDiveSite({ creator: expected.id });
    const site = new DefaultDiveSite(mongoClient, log, siteData);
    await expect(site.getCreator()).resolves.toEqual(expected);
  });

  it.todo(
    'What happens if the creator cannot be found on lazy load!? Handle this case.',
  );

  it('Will export a JSON object', () => {
    const creator: DiveSiteCreator = {
      id: 'a4fc342c-de93-4a6f-b433-8af6dbeadf90',
      username: 'StanTheMan',
      displayName: 'Stan Smith',
    };
    const data: DiveSiteDocument = {
      _id: '3f83be2c-8d8a-4f06-a6b7-6bec1098ee11',
      creator: creator.id,
      createdOn: new Date('2018-08-19T08:56:21.007Z'),
      updatedOn: new Date('2022-12-08T23:06:27.525Z'),
      name: 'astonishing waste',
      description:
        'Dicta aliquam optio nesciunt error necessitatibus. Molestiae repellendus hic blanditiis voluptatibus.',
      depth: {
        depth: 64,
        unit: DepthUnit.Feet,
      },
      location: 'Fayetteville Saint Martin',
      directions:
        'Et tempore impedit deleniti placeat ea asperiores in itaque.',
      gps: { type: 'Point', coordinates: [-0.05, -76.34] },
      freeToDive: false,
      shoreAccess: true,
      averageRating: 4.79,
      averageDifficulty: 2.28,
    };
    const site = new DefaultDiveSite(mongoClient, log, data, creator);
    expect(site.toJSON()).toMatchSnapshot();
  });

  it('Will export a summarized JSON object', () => {
    const creator: DiveSiteCreator = {
      id: 'a4fc342c-de93-4a6f-b433-8af6dbeadf90',
      username: 'StanTheMan',
      displayName: 'Stan Smith',
    };
    const data: DiveSiteDocument = {
      _id: '363896cd-4310-416f-8861-47f3322af468',
      creator: creator.id,
      createdOn: new Date('2022-04-11T13:04:56.199Z'),
      updatedOn: new Date('2022-06-09T21:00:40.101Z'),
      name: 'paltry linseed',
      depth: {
        depth: 24,
        unit: DepthUnit.Meters,
      },
      description:
        'Modi beatae voluptates error. Magnam laboriosam quod dolores.',
      location: 'Coral Springs Hungary',
      directions: 'Dolorem at perspiciatis dolore maxime natus autem.',
      gps: { type: 'Point', coordinates: [45.19, 62.04] },
      freeToDive: true,
      shoreAccess: true,
      averageRating: 2.44,
      averageDifficulty: 1.81,
    };
    const site = new DefaultDiveSite(mongoClient, log, data, creator);
    expect(site.toSummaryJSON()).toMatchSnapshot();
  });
});
