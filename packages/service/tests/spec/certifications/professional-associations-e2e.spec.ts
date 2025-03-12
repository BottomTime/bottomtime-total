import {
  CreateOrUpdateProfessionalAssociationParamsDTO,
  UserRole,
} from '@bottomtime/api';

import { HttpServer, INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import request from 'supertest';
import { Repository } from 'typeorm';

import {
  AgenciesService,
  AgencyFactory,
  ProfessionalAssociationsService,
} from '../../../src/certifications';
import { ProfessionalAssociationsController } from '../../../src/certifications/professional-associations.controller';
import {
  AgencyEntity,
  UserEntity,
  UserProfessionalAssociationsEntity,
} from '../../../src/data';
import { UsersModule } from '../../../src/users';
import { dataSource } from '../../data-source';
import { TestAgencies } from '../../fixtures/agencies';
import { createAuthHeader, createTestApp, createTestUser } from '../../utils';

const Username = 'joe.regular';

function getUrl(associationId?: string, username?: string): string {
  const url = `/api/users/${username ?? Username}/professionalAssociations`;
  return associationId ? `${url}/${associationId}` : url;
}

const TestData: UserProfessionalAssociationsEntity[] = [
  {
    id: '7660e6de-d97e-4819-a15e-c7751f8690dc',
    identificationNumber: 'CK-13333',
    startDate: '2021-01-01',
    title: 'Instructor',
    agency: TestAgencies[0],
  },
  {
    id: 'b77ad1ca-0cd9-448b-9be5-b829d9024aa4',
    identificationNumber: 'abd2324',
    startDate: '2022-01-01',
    title: 'Dive Master',
    agency: TestAgencies[1],
  },
  {
    id: '70be1a4b-15cb-4ede-b91f-5c3c02280bf4',
    identificationNumber: '123456789',
    startDate: '2023-01-01',
    title: 'Instructor',
    agency: TestAgencies[2],
  },
];

describe('Professional associations E2E tests', () => {
  let Users: Repository<UserEntity>;
  let Agencies: Repository<AgencyEntity>;
  let Associations: Repository<UserProfessionalAssociationsEntity>;

  let app: INestApplication;
  let server: HttpServer;

  let userData: UserEntity;
  let otherUserData: UserEntity;
  let adminUserData: UserEntity;

  let authHeader: [string, string];
  let otherAuthHeader: [string, string];
  let adminAuthHeader: [string, string];

  let testData: UserProfessionalAssociationsEntity[];

  beforeAll(async () => {
    Users = dataSource.getRepository(UserEntity);
    Agencies = dataSource.getRepository(AgencyEntity);
    Associations = dataSource.getRepository(UserProfessionalAssociationsEntity);

    app = await createTestApp({
      imports: [
        TypeOrmModule.forFeature([
          AgencyEntity,
          UserProfessionalAssociationsEntity,
        ]),
        UsersModule,
      ],
      providers: [
        AgenciesService,
        AgencyFactory,
        ProfessionalAssociationsService,
      ],
      controllers: [ProfessionalAssociationsController],
    });
    await app.init();
    server = app.getHttpServer();

    userData = createTestUser({ username: Username });
    otherUserData = createTestUser();
    adminUserData = createTestUser({ role: UserRole.Admin });

    [authHeader, otherAuthHeader, adminAuthHeader] = await Promise.all([
      createAuthHeader(userData.id),
      createAuthHeader(otherUserData.id),
      createAuthHeader(adminUserData.id),
    ]);
    testData = [
      {
        ...TestData[0],
        user: userData,
      },
      {
        ...TestData[1],
        user: userData,
      },
      {
        ...TestData[2],
        user: otherUserData,
      },
    ];
  });

  beforeEach(async () => {
    await Users.save([userData, otherUserData, adminUserData]);
    await Agencies.save(TestAgencies);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('when listing associations', () => {
    beforeEach(async () => {
      await Associations.save(testData);
    });

    it('will list professional associations', async () => {
      const { body } = await request(server)
        .get(getUrl())
        .set(...authHeader)
        .expect(200);

      expect(body).toMatchSnapshot();
    });

    it('will return a 404 response if the user does not exist', async () => {
      await request(server)
        .get(getUrl(undefined, 'not.a.user'))
        .set(...adminAuthHeader)
        .expect(404);
    });
  });

  describe('when retrieving a single association', () => {
    beforeEach(async () => {
      await Associations.save(testData);
    });

    it('will return the indicated association', async () => {
      const { body } = await request(server)
        .get(getUrl(testData[0].id))
        .set(...authHeader)
        .expect(200);

      expect(body).toMatchSnapshot();
    });

    it('will return a 404 response if the association does not exist', async () => {
      await request(server)
        .get(getUrl('8032ea62-06e2-4340-9c91-a3c39c1de234'))
        .expect(404);
    });

    it('will return a 404 response if the user does not exist', async () => {
      await request(server)
        .get(getUrl(testData[0].id, 'not.a.user'))
        .expect(404);
    });

    it('will return a 404 response if the indicated association does not belong to the user', async () => {
      await request(server)
        .get(getUrl(testData[2].id))
        .set(...authHeader)
        .expect(404);
    });
  });

  describe('when creating a new association', () => {
    const options: CreateOrUpdateProfessionalAssociationParamsDTO = {
      agency: TestAgencies[1].id,
      identificationNumber: 'MY-248992',
      startDate: '2022-08-18',
      title: 'Instructor',
    };

    it('will create a new association', async () => {
      const { body } = await request(server)
        .post(getUrl())
        .set(...authHeader)
        .send(options)
        .expect(201);

      expect(body).toEqual({
        agency: {
          id: TestAgencies[1].id,
          logo: TestAgencies[1].logo,
          longName: TestAgencies[1].longName,
          name: TestAgencies[1].name,
          website: TestAgencies[1].website,
        },
        id: body.id,
        identificationNumber: options.identificationNumber,
        startDate: options.startDate,
        title: options.title,
      });

      const saved = await Associations.findOneOrFail({
        where: { id: body.id },
        relations: ['agency'],
      });
      expect(saved).toEqual({
        agency: {
          id: TestAgencies[1].id,
          logo: TestAgencies[1].logo,
          longName: TestAgencies[1].longName,
          name: TestAgencies[1].name,
          website: TestAgencies[1].website,
          ordinal: TestAgencies[1].ordinal,
        },
        id: body.id,
        identificationNumber: options.identificationNumber,
        startDate: options.startDate,
        title: options.title,
      });
    });

    it('will allow an admin to create a new association', async () => {
      const { body } = await request(server)
        .post(getUrl())
        .set(...adminAuthHeader)
        .send(options)
        .expect(201);

      expect(body).toEqual({
        agency: {
          id: TestAgencies[1].id,
          logo: TestAgencies[1].logo,
          longName: TestAgencies[1].longName,
          name: TestAgencies[1].name,
          website: TestAgencies[1].website,
        },
        id: body.id,
        identificationNumber: options.identificationNumber,
        startDate: options.startDate,
        title: options.title,
      });

      const saved = await Associations.findOneOrFail({
        where: { id: body.id },
        relations: ['agency'],
      });
      expect(saved).toEqual({
        agency: {
          id: TestAgencies[1].id,
          logo: TestAgencies[1].logo,
          longName: TestAgencies[1].longName,
          name: TestAgencies[1].name,
          website: TestAgencies[1].website,
          ordinal: TestAgencies[1].ordinal,
        },
        id: body.id,
        identificationNumber: options.identificationNumber,
        startDate: options.startDate,
        title: options.title,
      });
    });

    it('will return a 400 response if the request body is invalid', async () => {
      await request(server)
        .post(getUrl())
        .set(...authHeader)
        .send({
          identificationNumber: 77,
          startDate: 'yesterday',
          title: true,
          agency: TestAgencies[0].id,
        })
        .expect(400);
    });

    it('will return a 400 resonse if the request body is missing', async () => {
      await request(server)
        .post(getUrl())
        .set(...authHeader)
        .expect(400);
    });

    it('will return a 400 response if the indicated agency does not exist', async () => {
      await request(server)
        .post(getUrl())
        .set(...authHeader)
        .send({
          ...options,
          agency: '71721872-8b56-465b-a1b5-2656c822ad15',
        })
        .expect(400);
    });

    it('will return a 401 response if the request is unauthenticated', async () => {
      await request(server).post(getUrl()).send(options).expect(401);
    });

    it('will return a 403 response if the user is not authorized to create the association', async () => {
      await request(server)
        .post(getUrl())
        .set(...otherAuthHeader)
        .send(options)
        .expect(403);
    });

    it('will return a 404 response if the user does not exist', async () => {
      await request(server)
        .post(getUrl(undefined, 'not.a.user'))
        .set(...adminAuthHeader)
        .send(options)
        .expect(404);
    });
  });

  describe('when deleting an association', () => {
    beforeEach(async () => {
      await Associations.save(testData[0]);
    });

    it('will delete the indicated association', async () => {
      await request(server)
        .delete(getUrl(testData[0].id))
        .set(...authHeader)
        .expect(204);

      await expect(
        Associations.findOneBy({ id: testData[0].id }),
      ).resolves.toBeNull();
    });

    it('will allow an admin to delete an association', async () => {
      await request(server)
        .delete(getUrl(testData[0].id))
        .set(...adminAuthHeader)
        .expect(204);

      await expect(
        Associations.findOneBy({ id: testData[0].id }),
      ).resolves.toBeNull();
    });

    it('will return a 401 response if the request is unauthenticated', async () => {
      await request(server).delete(getUrl(testData[0].id)).expect(401);
    });

    it('will return a 403 response if the user is not authorized to delete the association', async () => {
      await request(server)
        .delete(getUrl(testData[0].id))
        .set(...otherAuthHeader)
        .expect(403);
    });

    it('will return a 404 response if the association does not exist', async () => {
      await request(server)
        .delete(getUrl('4a2d1774-d77a-4830-977f-af941b162e65'))
        .set(...authHeader)
        .expect(404);
    });

    it('will return a 404 response if the user does not exist', async () => {
      await request(server)
        .delete(getUrl(testData[0].id, 'not.a.user'))
        .set(...adminAuthHeader)
        .expect(404);
    });

    it('will return a 404 response if the association belongs to another user', async () => {
      await request(server)
        .delete(getUrl(testData[2].id))
        .set(...adminAuthHeader)
        .expect(404);
    });
  });

  describe('when updating an existing professional association', () => {
    const options: CreateOrUpdateProfessionalAssociationParamsDTO = {
      agency: TestAgencies[1].id,
      identificationNumber: 'MY-248992',
      startDate: '2022-08-18',
      title: 'Instructor',
    };

    beforeEach(async () => {
      await Associations.save(testData);
    });

    it('will update an existing association', async () => {
      const { body } = await request(server)
        .put(getUrl(testData[0].id))
        .set(...authHeader)
        .send(options)
        .expect(200);

      expect(body).toEqual({
        agency: {
          id: TestAgencies[1].id,
          logo: TestAgencies[1].logo,
          longName: TestAgencies[1].longName,
          name: TestAgencies[1].name,
          website: TestAgencies[1].website,
        },
        id: body.id,
        identificationNumber: options.identificationNumber,
        startDate: options.startDate,
        title: options.title,
      });

      const saved = await Associations.findOneOrFail({
        where: { id: body.id },
        relations: ['agency'],
      });
      expect(saved).toEqual({
        agency: {
          id: TestAgencies[1].id,
          logo: TestAgencies[1].logo,
          longName: TestAgencies[1].longName,
          name: TestAgencies[1].name,
          website: TestAgencies[1].website,
          ordinal: TestAgencies[1].ordinal,
        },
        id: body.id,
        identificationNumber: options.identificationNumber,
        startDate: options.startDate,
        title: options.title,
      });
    });

    it('will allow an admin to update an association', async () => {
      const { body } = await request(server)
        .put(getUrl(testData[0].id))
        .set(...adminAuthHeader)
        .send(options)
        .expect(200);

      expect(body).toEqual({
        agency: {
          id: TestAgencies[1].id,
          logo: TestAgencies[1].logo,
          longName: TestAgencies[1].longName,
          name: TestAgencies[1].name,
          website: TestAgencies[1].website,
        },
        id: body.id,
        identificationNumber: options.identificationNumber,
        startDate: options.startDate,
        title: options.title,
      });

      const saved = await Associations.findOneOrFail({
        where: { id: body.id },
        relations: ['agency'],
      });
      expect(saved).toEqual({
        agency: {
          id: TestAgencies[1].id,
          logo: TestAgencies[1].logo,
          longName: TestAgencies[1].longName,
          name: TestAgencies[1].name,
          website: TestAgencies[1].website,
          ordinal: TestAgencies[1].ordinal,
        },
        id: body.id,
        identificationNumber: options.identificationNumber,
        startDate: options.startDate,
        title: options.title,
      });
    });

    it('will return a 400 response if the request body is missing', async () => {
      await request(server)
        .put(getUrl(testData[0].id))
        .set(...authHeader)
        .expect(400);
    });

    it('will return a 400 response if the request body is invalid', async () => {
      await request(server)
        .put(getUrl(testData[0].id))
        .set(...authHeader)
        .send({
          identificationNumber: 77,
          startDate: 'yesterday',
          title: true,
          agency: TestAgencies[0].id,
        })
        .expect(400);
    });

    it('will return a 400 response if the agency does not exist', async () => {
      await request(server)
        .put(getUrl(testData[0].id))
        .set(...authHeader)
        .send({
          ...options,
          agency: '71721872-8b56-465b-a1b5-2656c822ad15',
        })
        .expect(400);
    });

    it('will return a 401 response if the request is unauthenticated', async () => {
      await request(server)
        .put(getUrl(testData[0].id))
        .send(options)
        .expect(401);
    });

    it('will return a 403 response if the user is not authorized to update the association', async () => {
      await request(server)
        .put(getUrl(testData[0].id))
        .set(...otherAuthHeader)
        .send(options)
        .expect(403);
    });

    it('will return a 404 response if the association does not exist', async () => {
      await request(server)
        .put(getUrl('0295324b-5b52-4602-9604-33a45dfb4455'))
        .set(...authHeader)
        .send(options)
        .expect(404);
    });

    it('will return a 404 response if the user does not exist', async () => {
      await request(server)
        .put(getUrl(testData[0].id, 'not.a.user'))
        .set(...adminAuthHeader)
        .send(options)
        .expect(404);
    });

    it('will return a 404 response if the association belongs to another user', async () => {
      await request(server)
        .put(getUrl(testData[2].id))
        .set(...adminAuthHeader)
        .send(options)
        .expect(404);
    });
  });
});
