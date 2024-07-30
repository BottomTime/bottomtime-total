import { LogBookSharing } from '@bottomtime/api';

import { HttpServer, INestApplication } from '@nestjs/common';

import request from 'supertest';
import { Repository } from 'typeorm';

import { DiveOperatorEntity, UserEntity } from '../../../src/data';
import { dataSource } from '../../data-source';
import TestData from '../../fixtures/operators.json';
import Owners from '../../fixtures/user-search-data.json';
import {
  createAuthHeader,
  createTestApp,
  createTestUser,
  parseOperatorJSON,
  parseUserJSON,
} from '../../utils';

const RegularUserId = '5a4699d8-48c4-4410-9886-b74b8b85cac1';
const RegularUserData: Partial<UserEntity> = {
  id: RegularUserId,
  memberSince: new Date(),
  username: 'Joe.Regular',
  usernameLowered: 'joe.regular',
  avatar: 'https://example.com/avatar.png',
  location: 'Seattle, WA',
  logBookSharing: LogBookSharing.FriendsOnly,
  name: 'Joe Regular',
};

function getUrl() {
  return '/api/operators';
}

describe('Dive Operators E2E tests', () => {
  let app: INestApplication;
  let server: HttpServer;

  let Operators: Repository<DiveOperatorEntity>;
  let Users: Repository<UserEntity>;
  let regularUser: UserEntity;
  let regularUserAuthHeader: [string, string];

  beforeAll(async () => {
    app = await createTestApp();
    server = app.getHttpServer();

    regularUserAuthHeader = await createAuthHeader(RegularUserId);

    Operators = dataSource.getRepository(DiveOperatorEntity);
    Users = dataSource.getRepository(UserEntity);
  });

  beforeEach(async () => {
    regularUser = createTestUser(RegularUserData);
    await Users.save(regularUser);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('when searching dive operators', () => {
    let owners: UserEntity[];
    let testData: DiveOperatorEntity[];

    beforeAll(() => {
      owners = Owners.slice(0, 80).map((o) => parseUserJSON(o));
      testData = TestData.map((op, index) =>
        parseOperatorJSON(op, owners[index % owners.length]),
      );
    });

    beforeEach(async () => {
      await Users.save(owners);
      await Operators.save(testData);
    });

    it('will perform a basic search with default parameters', async () => {
      const { body } = await request(server)
        .get(getUrl())
        .set(...regularUserAuthHeader)
        .expect(200);
      expect(body.totalCount).toBe(testData.length);
      expect(body.operators).toHaveLength(50);
      expect(body.operators[0]).toMatchSnapshot();
      expect(body.operators.map((op) => op.name)).toMatchSnapshot();
    });

    it('will perform a more complex search with query parameters', async () => {});

    it('will return an empty result set if no operators match the search criteria', async () => {});

    it('will return a 400 response if the query string is invalid', async () => {});
  });
});
