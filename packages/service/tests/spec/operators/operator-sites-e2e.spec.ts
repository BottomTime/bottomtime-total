import { DiveSiteDTO, UserRole } from '@bottomtime/api';

import { HttpServer, INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import request from 'supertest';
import { In, Repository } from 'typeorm';
import { v7 as uuid } from 'uuid';

import {
  DiveSiteEntity,
  OperatorDiveSiteEntity,
  OperatorEntity,
  OperatorReviewEntity,
  OperatorTeamMemberEntity,
  UserEntity,
} from '../../../src/data';
import { DiveSitesModule } from '../../../src/diveSites';
import { OperatorFactory, OperatorsService } from '../../../src/operators';
import { OperatorSitesController } from '../../../src/operators/operator-sites.controller';
import { UsersModule } from '../../../src/users';
import { dataSource } from '../../data-source';
import TestSites from '../../fixtures/dive-sites.json';
import {
  createAuthHeader,
  createTestApp,
  createTestOperator,
  createTestUser,
  parseDiveSiteJSON,
} from '../../utils';

const OperatorKey = 'mah-operator';
const TestOwner = createTestUser({
  id: '7cc9dff8-5633-4b24-96cd-4f1d44ad458d',
});
const AdminUser = createTestUser({
  id: '07b60347-f80c-4226-9355-6116aa83b081',
  role: UserRole.Admin,
});
const TestOperator = createTestOperator(TestOwner, {
  id: '29063153-72ce-4b03-b200-6d9df0c6540f',
  slug: OperatorKey,
});

function getUrl(operatorKey?: string): string {
  return `/api/operators/${operatorKey || OperatorKey}/sites`;
}

describe('Operator Dive Sites E2E tests', () => {
  let Operators: Repository<OperatorEntity>;
  let DiveSites: Repository<DiveSiteEntity>;
  let Users: Repository<UserEntity>;
  let OperatorDiveSites: Repository<OperatorDiveSiteEntity>;
  let app: INestApplication;
  let server: HttpServer;
  let siteCreators: UserEntity[];
  let testSites: DiveSiteEntity[];

  let authHeader: [string, string];
  let adminAuthHeader: [string, string];
  let otherUserAuthHeader: [string, string];

  beforeAll(async () => {
    Operators = dataSource.getRepository(OperatorEntity);
    DiveSites = dataSource.getRepository(DiveSiteEntity);
    Users = dataSource.getRepository(UserEntity);
    OperatorDiveSites = dataSource.getRepository(OperatorDiveSiteEntity);

    siteCreators = Array.from({ length: 7 }, () => createTestUser());
    testSites = TestSites.map((site, i) =>
      parseDiveSiteJSON(site, siteCreators[i % siteCreators.length]),
    );

    [authHeader, adminAuthHeader, otherUserAuthHeader] = await Promise.all([
      createAuthHeader(TestOwner.id),
      createAuthHeader(AdminUser.id),
      createAuthHeader(siteCreators[0].id),
    ]);

    app = await createTestApp({
      imports: [
        TypeOrmModule.forFeature([
          OperatorEntity,
          OperatorDiveSiteEntity,
          OperatorReviewEntity,
          OperatorTeamMemberEntity,
          UserEntity,
        ]),
        DiveSitesModule,
        UsersModule,
      ],
      providers: [OperatorsService, OperatorFactory],
      controllers: [OperatorSitesController],
    });
    server = app.getHttpServer();
    await app.init();
  });

  beforeEach(async () => {
    await Users.save([TestOwner, AdminUser, ...siteCreators]);
    await Operators.save(TestOperator);
    await DiveSites.save(testSites);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('when listing dive sites associated with an operator', () => {
    beforeEach(async () => {
      const relations = Array.from<DiveSiteEntity, OperatorDiveSiteEntity>(
        testSites,
        (site) => ({
          id: uuid(),
          site,
          operator: TestOperator,
        }),
      );
      await OperatorDiveSites.save(relations);
    });

    it('will request a list of dive sites associated with an operator', async () => {
      const { body } = await request(server).get(getUrl()).expect(200);

      expect({
        data: body.data.map((site: DiveSiteDTO) => ({
          id: site.id,
          name: site.name,
        })),
        totalCount: body.totalCount,
      }).toMatchSnapshot();
    });

    it('will allow listing dive sites associated with an operator with pagination', async () => {
      const { body } = await request(server)
        .get(getUrl())
        .query({ limit: 5, skip: 20 })
        .expect(200);

      expect({
        data: body.data.map((site: DiveSiteDTO) => ({
          id: site.id,
          name: site.name,
        })),
        totalCount: body.totalCount,
      }).toMatchSnapshot();
    });

    it('will return a 400 response if query string is invalid', async () => {
      const { body } = await request(server)
        .get(getUrl())
        .query({ skip: 'some', limit: -4 })
        .expect(400);

      expect(body.details).toMatchSnapshot();
    });

    it('will return a 404 response if the operator does not exist', async () => {
      await request(server).get(getUrl('not-an-operator')).expect(404);
    });
  });

  describe('when adding dive sites to an operator', () => {
    let siteIds: string[];

    beforeAll(() => {
      siteIds = testSites.slice(10, 25).map((site) => site.id);
    });

    it('will add new sites to a dive operator', async () => {
      await OperatorDiveSites.delete({});

      const { body } = await request(server)
        .post(getUrl())
        .set(...authHeader)
        .send({ siteIds })
        .expect(200);
      expect(body).toEqual({
        attached: siteIds.length,
        skipped: 0,
      });

      const relations = await OperatorDiveSites.find({
        relations: ['site', 'operator'],
      });

      const idsSet = new Set(siteIds);
      expect(relations).toHaveLength(siteIds.length);
      relations.forEach((relation) => {
        expect(idsSet.has(relation.site.id)).toBe(true);
        expect(relation.operator.id).toBe(TestOperator.id);
      });
    });

    it('will report when site IDs that do not exist are added to a dive operator', async () => {
      await OperatorDiveSites.delete({});

      const { body } = await request(server)
        .post(getUrl())
        .set(...authHeader)
        .send({
          siteIds: [
            '7498c831-eb84-4e22-a35b-d357532a0232',
            ...siteIds,
            '97426ae7-bc23-4d61-ba1d-027ba501b4cf',
          ],
        })
        .expect(200);
      expect(body).toEqual({
        attached: siteIds.length,
        skipped: 2,
      });

      const relations = await OperatorDiveSites.find({
        relations: ['site', 'operator'],
      });

      const idsSet = new Set(siteIds);
      expect(relations).toHaveLength(siteIds.length);
      relations.forEach((relation) => {
        expect(idsSet.has(relation.site.id)).toBe(true);
        expect(relation.operator.id).toBe(TestOperator.id);
      });
    });

    it('will not fail if dive sites are already bound to the operator', async () => {
      await OperatorDiveSites.delete({
        site: { id: In(siteIds.slice(0, 3)) },
      });

      const { body } = await request(server)
        .post(getUrl())
        .set(...authHeader)
        .send({ siteIds })
        .expect(200);
      expect(body).toEqual({
        attached: siteIds.length,
        skipped: 0,
      });

      const relations = await OperatorDiveSites.find({
        relations: ['site', 'operator'],
      });

      const idsSet = new Set(siteIds);
      expect(relations).toHaveLength(siteIds.length);
      relations.forEach((relation) => {
        expect(idsSet.has(relation.site.id)).toBe(true);
        expect(relation.operator.id).toBe(TestOperator.id);
      });
    });

    it('will allow an admin to add dive sites to an operator', async () => {
      await OperatorDiveSites.delete({});

      const { body } = await request(server)
        .post(getUrl())
        .set(...adminAuthHeader)
        .send({ siteIds })
        .expect(200);
      expect(body).toEqual({
        attached: siteIds.length,
        skipped: 0,
      });

      const relations = await OperatorDiveSites.find({
        relations: ['site', 'operator'],
      });

      const idsSet = new Set(siteIds);
      expect(relations).toHaveLength(siteIds.length);
      relations.forEach((relation) => {
        expect(idsSet.has(relation.site.id)).toBe(true);
        expect(relation.operator.id).toBe(TestOperator.id);
      });
    });

    it('will return a 400 response if the request body is missing', async () => {
      const { body } = await request(server)
        .post(getUrl())
        .set(...authHeader)
        .expect(400);
      expect(body.details).toMatchSnapshot();
    });

    it('will return a 400 response if the request body is invalid', async () => {
      const { body } = await request(server)
        .post(getUrl())
        .set(...authHeader)
        .send({ siteIds: [7, 'site-two', true, '12345'] })
        .expect(400);
      expect(body.details).toMatchSnapshot();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).post(getUrl()).send({ siteIds }).expect(401);
    });

    it('will return a 403 response if the user is not authorized to modify the operator', async () => {
      await request(server)
        .post(getUrl())
        .set(...otherUserAuthHeader)
        .send({ siteIds })
        .expect(403);
    });

    it('will return a 404 resonse if the operator does not exist', async () => {
      await request(server)
        .post(getUrl('not-an-operator'))
        .set(...adminAuthHeader)
        .send({ siteIds })
        .expect(404);
    });
  });

  describe('when removing dive sites from an operator', () => {
    let siteIds: string[];

    beforeEach(async () => {
      const relations = Array.from<DiveSiteEntity, OperatorDiveSiteEntity>(
        testSites.slice(0, 50),
        (site) => ({
          id: uuid(),
          site,
          operator: TestOperator,
        }),
      );
      await OperatorDiveSites.save(relations);
    });

    beforeAll(() => {
      siteIds = testSites.slice(10, 25).map((site) => site.id);
    });

    it('will remove dive sites from an operator', async () => {
      const { body } = await request(server)
        .delete(getUrl())
        .set(...authHeader)
        .send({ siteIds })
        .expect(200);
      expect(body).toEqual({
        removed: siteIds.length,
        skipped: 0,
      });

      const relations = await OperatorDiveSites.find({
        relations: ['site', 'operator'],
      });

      expect(relations).toHaveLength(50 - siteIds.length);
    });

    it('will allow an admin to remove dive sites from an operator', async () => {
      const { body } = await request(server)
        .delete(getUrl())
        .set(...adminAuthHeader)
        .send({ siteIds })
        .expect(200);
      expect(body).toEqual({
        removed: siteIds.length,
        skipped: 0,
      });

      const relations = await OperatorDiveSites.find({
        relations: ['site', 'operator'],
      });

      expect(relations).toHaveLength(50 - siteIds.length);
    });

    it('will not fail if the dive sites are not associated with the operator', async () => {
      const siteIds = testSites.slice(50, 60).map((site) => site.id);
      const { body } = await request(server)
        .delete(getUrl())
        .set(...authHeader)
        .send({ siteIds })
        .expect(200);

      expect(body).toEqual({
        removed: 0,
        skipped: siteIds.length,
      });

      const relations = await OperatorDiveSites.count();
      expect(relations).toBe(50);
    });

    it('will not fail if the dive sites do not exist', async () => {
      const { body } = await request(server)
        .delete(getUrl())
        .set(...authHeader)
        .send({
          siteIds: [
            '825195e3-edfc-4072-84e8-549e0194af92',
            'd9cdcf84-a7d6-4f62-9e3c-0567022ab81a',
            '0e4e7ab8-862d-497c-a11c-bfa46fcbecfc',
          ],
        })
        .expect(200);

      expect(body).toEqual({
        removed: 0,
        skipped: 3,
      });

      const relations = await OperatorDiveSites.count();
      expect(relations).toBe(50);
    });

    it('will return a 400 response if the request body is missing', async () => {
      const { body } = await request(server)
        .delete(getUrl())
        .set(...authHeader)
        .expect(400);
      expect(body.details).toMatchSnapshot();
    });

    it('will return a 400 response if the request body is invalid', async () => {
      const { body } = await request(server)
        .delete(getUrl())
        .set(...authHeader)
        .send({ siteIds: [13, false, 'not an id'] })
        .expect(400);
      expect(body.details).toMatchSnapshot();
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).delete(getUrl()).send({ siteIds }).expect(401);
    });

    it('will reutrn a 403 response if the user is not authorized to manage the dive operator', async () => {
      await request(server)
        .delete(getUrl())
        .set(...otherUserAuthHeader)
        .send({ siteIds })
        .expect(403);
    });

    it('will return a 404 response if the dive operator does not exist', async () => {
      await request(server)
        .delete(getUrl('not-an-operator'))
        .set(...adminAuthHeader)
        .send({ siteIds })
        .expect(404);
    });
  });
});
