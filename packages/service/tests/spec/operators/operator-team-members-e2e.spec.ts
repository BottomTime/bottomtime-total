import { HttpServer, INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import request from 'supertest';
import { Repository } from 'typeorm';

import {
  OperatorDiveSiteEntity,
  OperatorEntity,
  OperatorReviewEntity,
  OperatorTeamMemberEntity,
  UserEntity,
} from '../../../src/data';
import { DiveSitesModule } from '../../../src/diveSites';
import { OperatorFactory, OperatorsService } from '../../../src/operators';
import { OperatorTeamController } from '../../../src/operators/operator-team.controller';
import { UsersModule } from '../../../src/users';
import { dataSource } from '../../data-source';
import TestUsers from '../../fixtures/user-search-data.json';
import {
  createTestApp,
  createTestOperator,
  createTestTeamMember,
  createTestUser,
  parseUserJSON,
} from '../../utils';

const OperatorSlug = 'greatest-shop-ever';

function getUrl(operatorSlug?: string, teamMember?: string): string {
  let url = `/api/operators/${operatorSlug ?? OperatorSlug}/team`;

  if (teamMember) {
    url = `${url}/${teamMember}`;
  }
  return url;
}

describe('Operator Team Members E2E tests', () => {
  let Users: Repository<UserEntity>;
  let Operators: Repository<OperatorEntity>;
  let TeamMembers: Repository<OperatorTeamMemberEntity>;

  let userData: UserEntity[];
  let operator: OperatorEntity;
  let otherOperator: OperatorEntity;
  let otherUser: UserEntity;
  let teamMemberData: OperatorTeamMemberEntity[];

  let app: INestApplication;
  let server: HttpServer;

  beforeAll(async () => {
    Users = dataSource.getRepository(UserEntity);
    Operators = dataSource.getRepository(OperatorEntity);
    TeamMembers = dataSource.getRepository(OperatorTeamMemberEntity);

    userData = TestUsers.slice(0, 10).map((user) => parseUserJSON(user));
    otherUser = createTestUser();
    operator = createTestOperator(userData[0], { slug: OperatorSlug });
    otherOperator = createTestOperator(userData[1]);

    teamMemberData = userData
      .map((user) => createTestTeamMember(operator, user))
      .sort((a, b) => b.joined!.valueOf() - a.joined!.valueOf());
    teamMemberData.push(createTestTeamMember(otherOperator, userData[1]));
    teamMemberData.push(createTestTeamMember(otherOperator, otherUser));

    app = await createTestApp({
      imports: [
        TypeOrmModule.forFeature([
          OperatorEntity,
          OperatorReviewEntity,
          OperatorTeamMemberEntity,
          OperatorDiveSiteEntity,
          UserEntity,
        ]),
        UsersModule,
        DiveSitesModule,
      ],
      providers: [OperatorsService, OperatorFactory],
      controllers: [OperatorTeamController],
    });
    await app.init();

    server = app.getHttpServer();
  });

  beforeEach(async () => {
    await Users.save([...userData, otherUser]);
    await Operators.save([operator, otherOperator]);
    await TeamMembers.save(teamMemberData);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('when requesting a single team member', () => {
    it('will return the requested team member', async () => {
      const { body } = await request(server)
        .get(getUrl(OperatorSlug, teamMemberData[1].teamMember!.username))
        .expect(200);
      expect(body).toEqual({
        dafuq: true,
      });
    });

    it('will return a 404 response if the operator does not exist', async () => {
      await request(server).get(getUrl('not-a-real-operator')).expect(404);
    });

    it('will return a 404 response if the team member does not belong to the operator', async () => {
      await request(server)
        .get(getUrl(OperatorSlug, 'not-a-real-member'))
        .expect(404);
    });
  });
});
