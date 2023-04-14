import { Collection } from 'mongodb';

import { ApplicationDocument, Collections } from '../../../src/data';
import { createTestLogger } from '../../test-logger';
import { DefaultApplication } from '../../../src/applications';
import { DefaultUser } from '../../../src/users';
import { fakeApplication } from '../../fixtures/fake-application';
import { fakeUser } from '../../fixtures/fake-user';
import { mongoClient } from '../../mongo-client';
import { ConflictError, ValidationError } from '../../../src/errors';
import { faker } from '@faker-js/faker';

const Log = createTestLogger('default-application');

describe('Default Application', () => {
  let Applications: Collection<ApplicationDocument>;

  beforeAll(() => {
    Applications = mongoClient.db().collection(Collections.Applications);
  });

  it('Will return properties correctly', () => {
    const userData = fakeUser();
    const appData = fakeApplication({
      allowedOrigins: ['localhost', 'bottomti.me'],
      user: userData._id,
    });
    const user = new DefaultUser(mongoClient, Log, userData);
    const app = new DefaultApplication(mongoClient, Log, appData, user);

    expect(app.id).toEqual(appData._id);
    expect(app.created).toEqual(appData.created);
    expect(app.active).toEqual(appData.active);
    expect(app.allowedOrigins).toEqual(appData.allowedOrigins);
    expect(app.description).toEqual(appData.description);
    expect(app.name).toEqual(appData.name);
    expect(app.token).toEqual(appData.token);
    expect(app.user).toBe(user);
  });

  it('Will update properties correctly', () => {
    const userData = fakeUser();
    const appData = fakeApplication({
      user: userData._id,
    });
    const user = new DefaultUser(mongoClient, Log, userData);
    const app = new DefaultApplication(mongoClient, Log, appData, user);

    const newData = fakeApplication({
      active: !appData.active,
      allowedOrigins: ['localhost', 'bottomti.me'],
    });

    app.active = !appData.active;
    app.allowedOrigins = newData.allowedOrigins;
    app.description = newData.description;
    app.name = newData.name;

    expect(app.active).toEqual(newData.active);
    expect(app.allowedOrigins).toEqual(newData.allowedOrigins);
    expect(app.description).toEqual(newData.description);
    expect(app.name).toEqual(newData.name);
  });

  it('Will return JSON correctly', () => {
    const userData = fakeUser();
    const appData = fakeApplication({
      user: userData._id,
      allowedOrigins: ['localhost', 'bottomti.me'],
    });
    const user = new DefaultUser(mongoClient, Log, userData);
    const app = new DefaultApplication(mongoClient, Log, appData, user);

    expect(app.toJSON()).toEqual({
      active: appData.active,
      allowedOrigins: appData.allowedOrigins,
      created: appData.created,
      description: appData.description,
      id: appData._id,
      name: appData.name,
      token: appData.token,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  });

  it('Will save changes to properties', async () => {
    const userData = fakeUser();
    const appData = fakeApplication({
      user: userData._id,
    });
    const user = new DefaultUser(mongoClient, Log, userData);
    const app = new DefaultApplication(mongoClient, Log, appData, user);
    await Applications.insertOne(appData);

    const expected = fakeApplication({
      _id: appData._id,
      created: appData.created,
      active: !appData.active,
      allowedOrigins: ['localhost', 'bottomti.me'],
      token: appData.token,
      user: appData.user,
    });

    app.active = !appData.active;
    app.allowedOrigins = expected.allowedOrigins;
    app.description = expected.description;
    app.name = expected.name;

    await app.save();

    const actual = await Applications.findOne({ _id: appData._id });
    expect(actual).toEqual(expected);
  });

  it('Will remove undefined fields when saving', async () => {
    const userData = fakeUser();
    const appData = fakeApplication({
      allowedOrigins: ['localhost', 'bottomti.me'],
      user: userData._id,
    });
    const user = new DefaultUser(mongoClient, Log, userData);
    const app = new DefaultApplication(mongoClient, Log, appData, user);
    await Applications.insertOne(appData);

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
    const user = new DefaultUser(mongoClient, Log, userData);
    const app = new DefaultApplication(mongoClient, Log, expected, user);

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
    const user = new DefaultUser(mongoClient, Log, userData);
    const app = new DefaultApplication(mongoClient, Log, appData, user);
    const otherAppData = fakeApplication();
    await Applications.insertMany([appData, otherAppData]);
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
    it(`Will throw a ValidationError if data is invalid: ${testCase.name}`, async () => {
      const userData = fakeUser();
      const user = new DefaultUser(mongoClient, Log, userData);
      const app = new DefaultApplication(mongoClient, Log, testCase.data, user);
      await expect(app.save()).rejects.toThrowError(ValidationError);
    });
  });
});
