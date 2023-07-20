import { Collection } from 'mongodb';
import { faker } from '@faker-js/faker';
import { Mock } from 'moq.ts';
import * as uuid from 'uuid';

import { Collections, DiveSiteDocument, UserDocument } from '../../../src/data';
import { createTestLogger } from '../../test-logger';
import {
  DefaultDiveSite,
  DefaultDiveSiteManager,
  DiveSiteData,
} from '../../../src/diveSites';
import { fakeDiveSite } from '../../fixtures/fake-dive-site';
import { fakeUser } from '../../fixtures/fake-user';
import { mongoClient } from '../../mongo-client';
import { Profile, User } from '../../../src/users';
import { ValidationError } from '../../../src/errors';

const log = createTestLogger('default-dive-site-manager');
jest.mock('uuid');

describe('Default Dive Site Manager', () => {
  let Sites: Collection<DiveSiteDocument>;
  let Users: Collection<UserDocument>;
  let Creator: User;

  beforeAll(() => {
    const db = mongoClient.db();
    Sites = db.collection(Collections.DiveSites);
    Users = db.collection(Collections.Users);
    const profile = new Mock<Profile>()
      .setup((p) => p.name)
      .returns('Jacky Michaelson')
      .object();
    Creator = new Mock<User>()
      .setup((u) => u.id)
      .returns('379b88ad-d679-41ee-aa3e-af21deeb5568')
      .setup((u) => u.username)
      .returns('Jacky47')
      .setup((u) => u.profile)
      .returns(profile)
      .object();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('Will retrieve a dive site from the database', async () => {
    const creatorData = fakeUser();
    const siteData = fakeDiveSite({ creator: creatorData._id });
    const manager = new DefaultDiveSiteManager(mongoClient, log);
    const expected = new DefaultDiveSite(mongoClient, log, siteData);
    await Promise.all([
      Users.insertOne(creatorData),
      Sites.insertOne(siteData),
    ]);

    const actual = await manager.getDiveSite(siteData._id);

    expect(actual).toEqual(expected);
  });

  it('Will return undefined when retrieving a dive site that does not exist', async () => {
    const manager = new DefaultDiveSiteManager(mongoClient, log);
    await expect(
      manager.getDiveSite(faker.datatype.uuid()),
    ).resolves.toBeUndefined();
  });

  it('Will create a new dive stie with minimal options', async () => {
    jest.useFakeTimers({
      doNotFake: ['nextTick', 'setImmediate'],
      now: new Date('2023-07-20T11:47:36.692Z'),
    });
    jest
      .spyOn(uuid, 'v4')
      .mockReturnValue('51a4b91e-eef0-40d9-b353-1feb666f3c1f');

    const options: DiveSiteData = {
      name: "Smuggler's Plane",
      location: 'Somewhere in the Bahamas',
    };
    const manager = new DefaultDiveSiteManager(mongoClient, log);
    const site = await manager.createDiveSite(options, Creator);
    jest.runAllTimers();

    expect(site).toMatchSnapshot();
  });

  it('Will create a new dive site with all options set', async () => {
    jest.useFakeTimers({
      doNotFake: ['nextTick', 'setImmediate'],
      now: new Date('2023-07-20T11:47:36.692Z'),
    });
    jest
      .spyOn(uuid, 'v4')
      .mockReturnValue('51a4b91e-eef0-40d9-b353-1feb666f3c1f');

    const options: DiveSiteData = {
      name: 'Chac Mool Cenote',
      description: 'A sweet cavern dive near Playa del Carmen',
      location: 'Play del Carmen, Mexico',
      directions:
        'Take highway 307 West from Playa del Carmen til ya get there.',
      gps: {
        lat: 20.513109539132362,
        lon: -87.24704767409908,
      },
      freeToDive: false,
      shoreAccess: true,
    };
    const manager = new DefaultDiveSiteManager(mongoClient, log);
    const site = await manager.createDiveSite(options, Creator);
    jest.runAllTimers();

    expect(site).toMatchSnapshot();
  });

  it('Will throw a ValidationError when attempting to create a dive site with invalid options', async () => {
    const manager = new DefaultDiveSiteManager(mongoClient, log);
    await expect(
      manager.createDiveSite(
        {
          name: '',
          location: 'Somewhere',
          gps: {
            lat: -9000,
            lon: 8080,
          },
        },
        Creator,
      ),
    ).rejects.toThrowError(ValidationError);
  });
});
