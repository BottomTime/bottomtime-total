import { Mock } from 'moq.ts';
import {
  ApplicationManager,
  CreateApplicationOptions,
  DefaultApplication,
  DefaultApplicationManager,
} from '../../../src/applications';
import { DefaultUser, UserManager } from '../../../src/users';
import { mongoClient } from '../../mongo-client';
import { createTestLogger } from '../../test-logger';
import { fakeUser } from '../../fixtures/fake-user';
import { Collection } from 'mongodb';
import { ApplicationDocument, Collections } from '../../../src/data';
import { ConflictError, ValidationError } from '../../../src/errors';
import { fakeApplication } from '../../fixtures/fake-application';
import { faker } from '@faker-js/faker';

import ApplicationSearchData from '../../fixtures/application-search-data.json';

const Log = createTestLogger('default-application-manager');

describe('Default Application Manager', () => {
  let Applications: Collection<ApplicationDocument>;

  beforeAll(() => {
    Applications = mongoClient.db().collection(Collections.Applications);
  });

  describe('Creating Applcations', () => {
    it('Will create a new application given the options provided', async () => {
      const userManager = new Mock<UserManager>();
      const user = new DefaultUser(mongoClient, Log, fakeUser());
      const manager = new DefaultApplicationManager(
        userManager.object(),
        mongoClient,
        Log,
      );

      const options: CreateApplicationOptions = {
        name: 'My New Shiny app',
        owner: user,

        active: true,
        allowedOrigins: ['my-site.com', 'my-staging-site.com'],
        description: 'This app rules!',
      };

      const app = await manager.createApplication(options);

      expect(app.active).toEqual(options.active);
      expect(app.allowedOrigins).toEqual(options.allowedOrigins);
      expect(app.created.valueOf()).toBeCloseTo(Date.now(), -2);
      expect(app.description).toEqual(options.description);
      expect(app.id).toMatch(
        /^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/i,
      );
      expect(app.name).toEqual(options.name);
      expect(app.token.length).toBeGreaterThan(20);
      expect(app.userId).toBe(user.id);

      const actual = await Applications.findOne({ _id: app.id });
      expect(actual).not.toBeNull();
      expect(actual?.active).toEqual(options.active);
      expect(actual?.allowedOrigins).toEqual(options.allowedOrigins);
      expect(actual?.created.valueOf()).toBeCloseTo(Date.now(), -2);
      expect(actual?.description).toEqual(options.description);
      expect(actual?.name).toEqual(options.name);
      expect(actual?.token).toEqual(app.token);
      expect(actual?.user).toEqual(user.id);
    });

    it('Will create a new application given minimal options', async () => {
      const userManager = new Mock<UserManager>();
      const user = new DefaultUser(mongoClient, Log, fakeUser());
      const manager = new DefaultApplicationManager(
        userManager.object(),
        mongoClient,
        Log,
      );

      const options: CreateApplicationOptions = {
        name: 'My New Shiny app',
        owner: user,
      };

      const app = await manager.createApplication(options);

      expect(app.active).toBe(true);
      expect(app.allowedOrigins).toBeUndefined();
      expect(app.created.valueOf()).toBeCloseTo(Date.now(), -2);
      expect(app.description).toBeUndefined();
      expect(app.id).toMatch(
        /^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$/i,
      );
      expect(app.name).toEqual(options.name);
      expect(app.token.length).toBeGreaterThan(20);
      expect(app.userId).toBe(user.id);

      const actual = await Applications.findOne({ _id: app.id });
      expect(actual).not.toBeNull();
      expect(actual?.active).toBe(true);
      expect(actual?.allowedOrigins).toBeUndefined();
      expect(actual?.created.valueOf()).toBeCloseTo(Date.now(), -2);
      expect(actual?.description).toBeUndefined();
      expect(actual?.name).toEqual(options.name);
      expect(actual?.token).toEqual(app.token);
      expect(actual?.user).toEqual(user.id);
    });

    it('Will throw a ValidationError if options do not pass validation', async () => {
      const userManager = new Mock<UserManager>();
      const user = new DefaultUser(mongoClient, Log, fakeUser());
      const manager = new DefaultApplicationManager(
        userManager.object(),
        mongoClient,
        Log,
      );

      const options: CreateApplicationOptions = {
        name: '',
        owner: user,
      };

      await expect(manager.createApplication(options)).rejects.toThrowError(
        ValidationError,
      );
      await expect(Applications.find({}).toArray()).resolves.toHaveLength(0);
    });

    it('Will throw a ConflictError if application name is already taken', async () => {
      const name = 'Duplicated';
      const otherAppData = fakeApplication({ name });
      const userManager = new Mock<UserManager>();
      const user = new DefaultUser(mongoClient, Log, fakeUser());
      const manager = new DefaultApplicationManager(
        userManager.object(),
        mongoClient,
        Log,
      );
      await Applications.insertOne(otherAppData);

      const options: CreateApplicationOptions = {
        name,
        owner: user,
      };

      await expect(manager.createApplication(options)).rejects.toThrowError(
        ConflictError,
      );
      await expect(Applications.find({}).toArray()).resolves.toHaveLength(1);
    });
  });

  describe('Get Application', () => {
    it('Will return an application', async () => {
      const user = new DefaultUser(mongoClient, Log, fakeUser());
      const appData = fakeApplication({ user: user.id });
      const userManager = new Mock<UserManager>()
        .setup((instance) => instance.getUser(user.id))
        .returnsAsync(user)
        .object();
      const manager = new DefaultApplicationManager(
        userManager,
        mongoClient,
        Log,
      );
      await Applications.insertOne(appData);

      const app = await manager.getApplication(appData._id);

      expect(app).toBeDefined();
      expect(app?.active).toEqual(appData.active);
      expect(app?.allowedOrigins).toEqual(appData.allowedOrigins);
      expect(app?.created).toEqual(appData.created);
      expect(app?.description).toEqual(appData.description);
      expect(app?.id).toEqual(appData._id);
      expect(app?.name).toEqual(appData.name);
      expect(app?.token).toEqual(appData.token);
      expect(app?.userId).toEqual(appData.user);
    });

    it('Will return undefined if application is not found', async () => {
      const userManager = new Mock<UserManager>().object();
      const manager = new DefaultApplicationManager(
        userManager,
        mongoClient,
        Log,
      );
      await expect(
        manager.getApplication(faker.datatype.uuid()),
      ).resolves.toBeUndefined();
    });
  });

  describe('Get Applications For User', () => {
    it('Will return all applications belonging to the specified user', async () => {
      const userId = faker.datatype.uuid();
      const otherUserId = faker.datatype.uuid();
      const applicationData = new Array<ApplicationDocument>(5);
      const userManager = new Mock<UserManager>().object();
      for (let i = 0; i < applicationData.length; i++) {
        applicationData[i] = fakeApplication({
          user: i < 3 ? userId : otherUserId,
        });
      }
      await Applications.insertMany(applicationData);
      const expected = applicationData
        .filter((app) => app.user === userId)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(
          (data) => new DefaultApplication(userManager, mongoClient, Log, data),
        );

      const manager = new DefaultApplicationManager(
        userManager,
        mongoClient,
        Log,
      );
      const actual = await manager.getApplicationsForUser(userId);

      expect(actual).toEqual(expected);
    });
  });

  describe('Search Applications', () => {
    let searchData: ApplicationDocument[];
    let userManager: UserManager;
    let manager: ApplicationManager;

    beforeAll(() => {
      searchData = ApplicationSearchData.map((item) => ({
        ...item,
        created: new Date(item.created),
      }));
    });

    beforeEach(async () => {
      await Applications.insertMany(searchData);
      userManager = new Mock<UserManager>().object();
      manager = new DefaultApplicationManager(userManager, mongoClient, Log);
    });

    it('Will return a number of results matching "limit"', async () => {
      const results = await manager.searchApplications({ limit: 5 });
      expect(results).toMatchSnapshot();
    });

    it('Will skip over records to return other pages of data', async () => {
      const results = await manager.searchApplications({ skip: 10, limit: 10 });
      expect(results).toMatchSnapshot();
    });

    [true, false].forEach((active) => {
      it(`Will filter results to show only ${
        active ? 'active' : 'inactive'
      } apps`, async () => {
        const results = await manager.searchApplications({ active });
        expect(results).toMatchSnapshot();
      });
    });

    it('Will filter results to show only applications belonging to the specified user', async () => {
      const userId = searchData[0].user;
      const results = await manager.searchApplications({ userId });
      expect(results).toMatchSnapshot();
    });

    it('Will perform a text search', async () => {
      const results = await manager.searchApplications({ query: 'innovative' });
      expect(results).toMatchSnapshot();
    });
  });
});
