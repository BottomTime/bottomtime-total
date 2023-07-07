import { Collection } from 'mongodb';
import { It, Mock } from 'moq.ts';

import { Application, DefaultApplication } from '../../../src/applications';
import {
  ApplicationDocument,
  Collections,
  UserDocument,
} from '../../../src/data';
import { createTestLogger } from '../../test-logger';
import { DefaultUser, User, UserManager } from '../../../src/users';
import { fakeApplication } from '../../fixtures/fake-application';
import { fakeUser } from '../../fixtures/fake-user';
import { mongoClient } from '../../mongo-client';
import { ConflictError, ValidationError } from '../../../src/errors';
import { faker } from '@faker-js/faker';

const Log = createTestLogger('default-application');

describe('Default Application', () => {
  let Applications: Collection<ApplicationDocument>;
  let Users: Collection<UserDocument>;

  async function createApplication(options?: {
    userManager?: UserManager;
    userData?: UserDocument;
    appData?: ApplicationDocument;
  }): Promise<[Application, User]> {
    const userData = options?.userData ?? fakeUser();
    const appData =
      options?.appData ??
      fakeApplication({
        user: userData._id,
      });

    const user = new DefaultUser(mongoClient, Log, userData);
    const userManager =
      options?.userManager ??
      new Mock<UserManager>()
        .setup((instance) => instance.getUser(It.IsAny()))
        .returnsAsync(user)
        .object();
    const app = new DefaultApplication(userManager, mongoClient, Log, appData);

    await Promise.all([Applications.insertOne(appData)]);

    return [app, user];
  }

  beforeAll(() => {
    const db = mongoClient.db();
    Applications = db.collection(Collections.Applications);
    Users = db.collection(Collections.Users);
  });

  it('Will return properties correctly', async () => {
    const userData = fakeUser();
    const appData = fakeApplication({
      allowedOrigins: ['localhost', 'bottomti.me'],
      user: userData._id,
    });
    const [app, user] = await createApplication({
      userData,
      appData,
    });

    expect(app.id).toEqual(appData._id);
    expect(app.created).toEqual(appData.created);
    expect(app.active).toEqual(appData.active);
    expect(app.allowedOrigins).toEqual(appData.allowedOrigins);
    expect(app.description).toEqual(appData.description);
    expect(app.name).toEqual(appData.name);
    expect(app.token).toEqual(appData.token);
    expect(app.userId).toEqual(appData.user);
  });

  it('Will update properties correctly', async () => {
    const [app] = await createApplication();

    const newData = fakeApplication({
      active: !app.active,
      allowedOrigins: ['localhost', 'bottomti.me'],
    });

    app.active = !app.active;
    app.allowedOrigins = newData.allowedOrigins;
    app.description = newData.description;
    app.name = newData.name;

    expect(app.active).toEqual(newData.active);
    expect(app.allowedOrigins).toEqual(newData.allowedOrigins);
    expect(app.description).toEqual(newData.description);
    expect(app.name).toEqual(newData.name);
  });

  it('Will return JSON correctly', async () => {
    const userData = fakeUser();
    const appData = fakeApplication({
      user: userData._id,
      allowedOrigins: ['localhost', 'bottomti.me'],
    });
    const [app, user] = await createApplication({
      userData,
      appData,
    });

    expect(app.toJSON()).toEqual({
      active: appData.active,
      allowedOrigins: appData.allowedOrigins,
      created: appData.created,
      description: appData.description,
      id: appData._id,
      name: appData.name,
      token: appData.token,
      user: appData.user,
    });
  });

  it('Will return user correctly', async () => {
    const userData = fakeUser();
    const appData = fakeApplication({
      user: userData._id,
    });
    const expected = new DefaultUser(mongoClient, Log, userData);
    const userManager = new Mock<UserManager>()
      .setup((instance) => instance.getUser(userData._id))
      .returnsAsync(expected)
      .object();
    const app = new DefaultApplication(userManager, mongoClient, Log, appData);

    const actual = await app.getUser();

    expect(actual).toBe(expected);
  });

  it('Will throw an Error if getUser() is called on an application that is somehow orphaned', async () => {
    const appData = fakeApplication({
      user: '0a75912f-ede6-4a6b-8406-999118706511',
    });
    const userManager = new Mock<UserManager>()
      .setup((instance) => instance.getUser(It.IsAny()))
      .returnsAsync(undefined)
      .object();
    const app = new DefaultApplication(userManager, mongoClient, Log, appData);

    await expect(app.getUser()).rejects.toThrowErrorMatchingSnapshot();
  });

  it('Will save changes to properties', async () => {
    const [app] = await createApplication();

    const expected = fakeApplication({
      _id: app.id,
      created: app.created,
      active: !app.active,
      allowedOrigins: ['localhost', 'bottomti.me'],
      token: app.token,
      user: app.userId,
    });

    app.active = !app.active;
    app.allowedOrigins = expected.allowedOrigins;
    app.description = expected.description;
    app.name = expected.name;

    await app.save();

    const actual = await Applications.findOne({ _id: app.id });
    expect(actual).toEqual(expected);
  });

  it('Will remove undefined fields when saving', async () => {
    const userData = fakeUser();
    const appData = fakeApplication({
      allowedOrigins: ['localhost', 'bottomti.me'],
      user: userData._id,
    });
    const [app] = await createApplication({
      userData,
      appData,
    });

    app.allowedOrigins = undefined;
    app.description = undefined;
    await app.save();

    const expected = { ...appData };
    delete expected.allowedOrigins;
    delete expected.description;

    const actual = await Applications.findOne({ _id: appData._id });
    expect(actual).toEqual(expected);
  });

  it('Will save a new application', async () => {
    const userData = fakeUser();
    const expected = fakeApplication({
      allowedOrigins: ['localhost', 'bottomti.me'],
      user: userData._id,
    });
    const [app] = await createApplication({
      userData,
      appData: expected,
    });

    await app.save();

    const actual = await Applications.findOne({ _id: expected._id });
    expect(actual).toEqual(expected);
  });

  it('Will throw a ConflictException if name is already in use', async () => {
    const userData = fakeUser();
    const appData = fakeApplication({
      allowedOrigins: ['localhost', 'bottomti.me'],
      user: userData._id,
    });
    const otherAppData = fakeApplication();
    const [app] = await createApplication({
      userData,
      appData,
    });

    await Applications.insertOne(otherAppData);
    app.name = otherAppData.name;
    await expect(app.save()).rejects.toThrowError(ConflictError);
  });

  [
    {
      name: 'Name too short',
      data: {
        ...fakeApplication(),
        name: '',
      },
    },
    {
      name: 'Name too long',
      data: {
        ...fakeApplication(),
        name: faker.lorem.paragraph(8),
      },
    },
    {
      name: 'Description too long',
      data: {
        ...fakeApplication(),
        description: faker.lorem.paragraphs(4),
      },
    },
  ].forEach((testCase) => {
    it(`Will throw a ValidationError if attempt is made to save invalid data: ${testCase.name}`, async () => {
      const [app] = await createApplication({ appData: testCase.data });
      await expect(app.save()).rejects.toThrowError(ValidationError);
    });
  });

  it('Will delete an application', async () => {
    const userData = fakeUser();
    const appData = fakeApplication({
      allowedOrigins: ['localhost', 'bottomti.me'],
      user: userData._id,
    });
    const [app] = await createApplication({
      userData,
      appData,
    });
    await app.delete();
    await expect(Applications.findOne({ _id: app.id })).resolves.toBeNull();
  });

  it('Will retrieve the user associated with the application', async () => {
    const [app, expected] = await createApplication();
    const actual = await app.getUser();
    expect(actual).toBe(expected);
  });

  it('Will throw an error if getUser() is called and the application is somehow orphaned', async () => {
    const userId = 'c0fd81c1-cc4f-491e-8747-45a8dafcb3e6';
    const appData = fakeApplication({ user: userId });
    const userManager = new Mock<UserManager>()
      .setup((instance) => instance.getUser(appData.user))
      .returnsAsync(undefined)
      .object();
    const app = new DefaultApplication(userManager, mongoClient, Log, appData);
    await expect(app.getUser()).rejects.toThrowErrorMatchingSnapshot();
  });
});
