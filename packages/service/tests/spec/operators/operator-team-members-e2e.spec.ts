import { UserRole } from '@bottomtime/api';

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
  createAuthHeader,
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
  let admin: UserEntity;
  let teamMemberData: OperatorTeamMemberEntity[];
  let authToken: [string, string];
  let otherAuthToken: [string, string];
  let adminAuthToken: [string, string];

  let app: INestApplication;
  let server: HttpServer;

  beforeAll(async () => {
    Users = dataSource.getRepository(UserEntity);
    Operators = dataSource.getRepository(OperatorEntity);
    TeamMembers = dataSource.getRepository(OperatorTeamMemberEntity);

    userData = TestUsers.slice(0, 10).map((user) => parseUserJSON(user));
    otherUser = createTestUser();
    admin = createTestUser({ role: UserRole.Admin });
    operator = createTestOperator(userData[0], { slug: OperatorSlug });
    otherOperator = createTestOperator(userData[1]);

    [authToken, otherAuthToken, adminAuthToken] = await Promise.all([
      createAuthHeader(userData[0].id),
      createAuthHeader(otherUser.id),
      createAuthHeader(admin.id),
    ]);

    teamMemberData = userData
      .map((user) => createTestTeamMember(operator, user))
      .sort((a, b) => b.joined!.localeCompare(a.joined!));
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
    await Users.save([...userData, otherUser, admin]);
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
        joined: teamMemberData[1].joined!.valueOf(),
        title: teamMemberData[1].title,
        member: {
          accountTier: teamMemberData[1].teamMember!.accountTier,
          avatar: teamMemberData[1].teamMember!.avatar,
          bio: teamMemberData[1].teamMember!.bio,
          experienceLevel: teamMemberData[1].teamMember!.experienceLevel,
          location: teamMemberData[1].teamMember!.location,
          logBookSharing: teamMemberData[1].teamMember!.logBookSharing,
          memberSince: teamMemberData[1].teamMember!.memberSince.valueOf(),
          name: teamMemberData[1].teamMember!.name,
          startedDiving: teamMemberData[1].teamMember!.startedDiving,
          userId: teamMemberData[1].teamMember!.id,
          username: teamMemberData[1].teamMember!.username,
        },
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

  describe('when listing all team members', () => {
    it('will return the list of members for an operator', async () => {
      const { body } = await request(server).get(getUrl()).expect(200);
      expect(body.totalCount).toBe(10);
      for (let i = 0; i < 10; i++) {
        expect(body.data[i]).toEqual({
          joined: teamMemberData[i].joined!.valueOf(),
          title: teamMemberData[i].title,
          member: {
            accountTier: teamMemberData[i].teamMember!.accountTier,
            avatar: teamMemberData[i].teamMember!.avatar,
            bio: teamMemberData[i].teamMember!.bio,
            experienceLevel: teamMemberData[i].teamMember!.experienceLevel,
            location: teamMemberData[i].teamMember!.location,
            logBookSharing: teamMemberData[i].teamMember!.logBookSharing,
            memberSince: teamMemberData[i].teamMember!.memberSince.valueOf(),
            name: teamMemberData[i].teamMember!.name,
            startedDiving: teamMemberData[i].teamMember!.startedDiving,
            userId: teamMemberData[i].teamMember!.id,
            username: teamMemberData[i].teamMember!.username,
          },
        });
      }
    });

    it('will return an empty list if the operator has no members', async () => {
      await TeamMembers.delete({ operator: { id: operator.id } });
      const { body } = await request(server).get(getUrl()).expect(200);
      expect(body).toEqual({ data: [], totalCount: 0 });
    });

    it('will return a 404 response if the operator does not exist', async () => {
      await request(server).get(getUrl('not-a-real-operator')).expect(404);
    });
  });

  describe('when adding or updating a team member', () => {
    it('will add a new team member to the operator', async () => {
      const title = 'Dive Master';
      const joined = '2025-01-24';

      const { body } = await request(server)
        .put(getUrl(OperatorSlug, otherUser.username))
        .set(...authToken)
        .send({
          title,
          joined,
        })
        .expect(200);

      expect(body).toEqual({
        title,
        joined,
        member: {
          accountTier: otherUser.accountTier,
          avatar: otherUser.avatar,
          bio: otherUser.bio,
          experienceLevel: otherUser.experienceLevel,
          location: otherUser.location,
          logBookSharing: otherUser.logBookSharing,
          memberSince: otherUser.memberSince.valueOf(),
          name: otherUser.name,
          startedDiving: otherUser.startedDiving,
          userId: otherUser.id,
          username: otherUser.username,
        },
      });

      const saved = await TeamMembers.findOneByOrFail({
        operator: { id: operator.id },
        teamMember: { id: otherUser.id },
      });
      expect(saved.title).toBe(title);
      expect(saved.joined).toEqual(joined);
    });

    it('will allow an admin to add a team member to an operator', async () => {
      const title = 'Dive Master';
      const joined = '2025-01-24';

      const { body } = await request(server)
        .put(getUrl(OperatorSlug, otherUser.username))
        .set(...adminAuthToken)
        .send({
          title,
          joined,
        })
        .expect(200);

      expect(body).toEqual({
        title,
        joined,
        member: {
          accountTier: otherUser.accountTier,
          avatar: otherUser.avatar,
          bio: otherUser.bio,
          experienceLevel: otherUser.experienceLevel,
          location: otherUser.location,
          logBookSharing: otherUser.logBookSharing,
          memberSince: otherUser.memberSince.valueOf(),
          name: otherUser.name,
          startedDiving: otherUser.startedDiving,
          userId: otherUser.id,
          username: otherUser.username,
        },
      });

      const saved = await TeamMembers.findOneByOrFail({
        operator: { id: operator.id },
        teamMember: { id: otherUser.id },
      });
      expect(saved.title).toBe(title);
      expect(saved.joined).toEqual(joined);
    });

    it('will update an existing team member', async () => {
      const title = 'Supreme Master of Diving';
      const joined = '2025-01-24';

      const { body } = await request(server)
        .put(getUrl(OperatorSlug, teamMemberData[3].teamMember!.username))
        .set(...authToken)
        .send({
          title,
          joined,
        })
        .expect(200);

      expect(body).toEqual({
        title,
        joined,
        member: {
          accountTier: teamMemberData[3].teamMember!.accountTier,
          avatar: teamMemberData[3].teamMember!.avatar,
          bio: teamMemberData[3].teamMember!.bio,
          experienceLevel: teamMemberData[3].teamMember!.experienceLevel,
          location: teamMemberData[3].teamMember!.location,
          logBookSharing: teamMemberData[3].teamMember!.logBookSharing,
          memberSince: teamMemberData[3].teamMember!.memberSince.valueOf(),
          name: teamMemberData[3].teamMember!.name,
          startedDiving: teamMemberData[3].teamMember!.startedDiving,
          userId: teamMemberData[3].teamMember!.id,
          username: teamMemberData[3].teamMember!.username,
        },
      });

      const saved = await TeamMembers.findOneByOrFail({
        operator: { id: operator.id },
        teamMember: { id: teamMemberData[3].teamMember!.id },
      });
      expect(saved.title).toBe(title);
      expect(saved.joined).toEqual(joined);
    });

    it('will allow an admin to update an existing team member', async () => {
      const title = 'Supreme Master of Diving';
      const joined = '2025-01-24';

      const { body } = await request(server)
        .put(getUrl(OperatorSlug, teamMemberData[3].teamMember!.username))
        .set(...adminAuthToken)
        .send({
          title,
          joined,
        })
        .expect(200);

      expect(body).toEqual({
        title,
        joined,
        member: {
          accountTier: teamMemberData[3].teamMember!.accountTier,
          avatar: teamMemberData[3].teamMember!.avatar,
          bio: teamMemberData[3].teamMember!.bio,
          experienceLevel: teamMemberData[3].teamMember!.experienceLevel,
          location: teamMemberData[3].teamMember!.location,
          logBookSharing: teamMemberData[3].teamMember!.logBookSharing,
          memberSince: teamMemberData[3].teamMember!.memberSince.valueOf(),
          name: teamMemberData[3].teamMember!.name,
          startedDiving: teamMemberData[3].teamMember!.startedDiving,
          userId: teamMemberData[3].teamMember!.id,
          username: teamMemberData[3].teamMember!.username,
        },
      });

      const saved = await TeamMembers.findOneByOrFail({
        operator: { id: operator.id },
        teamMember: { id: teamMemberData[3].teamMember!.id },
      });
      expect(saved.title).toBe(title);
      expect(saved.joined).toEqual(joined);
    });

    it('will return a 400 response if the request body is invalid', async () => {
      const { body } = await request(server)
        .put(getUrl(OperatorSlug, otherUser.username))
        .set(...authToken)
        .send({
          title: true,
          joined: 'yesterday',
        })
        .expect(400);

      expect(body.details).toMatchSnapshot();
    });

    it('will return a 401 response if the request is not authenticated', async () => {
      await request(server)
        .put(getUrl(OperatorSlug, otherUser.username))
        .send({
          title: 'Dive Master',
          joined: '2025-01-24',
        })
        .expect(401);
    });

    it('will return a 403 response if the user is not authorized to modify the operator', async () => {
      await request(server)
        .put(getUrl(OperatorSlug, otherUser.username))
        .set(...otherAuthToken)
        .send({
          title: 'Dive Master',
          joined: '2025-01-24',
        })
        .expect(403);
    });

    it('will return a 404 response if the operator does not exist', async () => {
      await request(server)
        .put(getUrl('not-a-real-operator', otherUser.username))
        .set(...adminAuthToken)
        .send({
          title: 'Dive Master',
          joined: '2025-01-24',
        })
        .expect(404);
    });

    it('will return a 404 response if the team member does not exist', async () => {
      await request(server)
        .put(getUrl(OperatorSlug, 'not-a-real-member'))
        .set(...adminAuthToken)
        .send({
          title: 'Dive Master',
          joined: '2025-01-24',
        })
        .expect(404);
    });
  });

  describe('when removing a single team member', () => {
    it('will remove the indicated team member', async () => {
      await request(server)
        .delete(getUrl(OperatorSlug, teamMemberData[3].teamMember!.username))
        .set(...authToken)
        .expect(204);

      await expect(
        TeamMembers.findOneBy({
          operator: { id: operator.id },
          teamMember: { id: teamMemberData[3].teamMember!.id },
        }),
      ).resolves.toBeNull();
    });

    it('will allow an admin to remove a team member', async () => {
      await request(server)
        .delete(getUrl(OperatorSlug, teamMemberData[3].teamMember!.username))
        .set(...adminAuthToken)
        .expect(204);

      await expect(
        TeamMembers.findOneBy({
          operator: { id: operator.id },
          teamMember: { id: teamMemberData[3].teamMember!.id },
        }),
      ).resolves.toBeNull();
    });

    it('will return a 401 response if the request is not authenticated', async () => {
      await request(server)
        .delete(getUrl(OperatorSlug, teamMemberData[3].teamMember!.username))
        .expect(401);
    });

    it('will return a 403 response if the user is not authorized to modify the operator', async () => {
      await request(server)
        .delete(getUrl(OperatorSlug, teamMemberData[3].teamMember!.username))
        .set(...otherAuthToken)
        .expect(403);
    });

    it('will return a 404 response if the operator does not exist', async () => {
      await request(server)
        .delete(
          getUrl('not-a-real-operator', teamMemberData[3].teamMember!.username),
        )
        .set(...adminAuthToken)
        .expect(404);
    });

    it('will return a 404 response if the team member does not exist', async () => {
      await request(server)
        .delete(getUrl(OperatorSlug, 'not-a-real-member'))
        .set(...adminAuthToken)
        .expect(404);
    });
  });

  describe('when bulk deleting team members', () => {
    let teamMemberNames: string[];

    beforeAll(() => {
      teamMemberNames = [
        teamMemberData[3].teamMember!.username,
        teamMemberData[5].teamMember!.username,
        teamMemberData[9].teamMember!.username,
        teamMemberData[5].teamMember!.username,
        'not-a-real-user',
      ];
    });

    it('will remove the indicated team members', async () => {
      const { body } = await request(server)
        .delete(getUrl())
        .set(...authToken)
        .send(teamMemberNames)
        .expect(200);

      expect(body).toEqual({
        succeeded: 3,
        skipped: 2,
      });

      const remaining = await TeamMembers.find({
        where: { operator: { id: operator.id } },
        relations: ['teamMember'],
      });
      const ids = new Set(remaining.map((member) => member.teamMember!.id));

      expect(ids.size).toBe(7);
      expect(ids).not.toContain(teamMemberData[3].teamMember!.id);
      expect(ids).not.toContain(teamMemberData[5].teamMember!.id);
      expect(ids).not.toContain(teamMemberData[9].teamMember!.id);
    });

    it('will allow an admin to remove team members', async () => {
      const { body } = await request(server)
        .delete(getUrl())
        .set(...adminAuthToken)
        .send(teamMemberNames)
        .expect(200);

      expect(body).toEqual({
        succeeded: 3,
        skipped: 2,
      });

      const remaining = await TeamMembers.find({
        where: { operator: { id: operator.id } },
        relations: ['teamMember'],
      });
      const ids = new Set(remaining.map((member) => member.teamMember!.id));

      expect(ids.size).toBe(7);
      expect(ids).not.toContain(teamMemberData[3].teamMember!.id);
      expect(ids).not.toContain(teamMemberData[5].teamMember!.id);
      expect(ids).not.toContain(teamMemberData[9].teamMember!.id);
    });

    it('will return a 400 response if the request body is invalid', async () => {
      const { body } = await request(server)
        .delete(getUrl())
        .set(...authToken)
        .send([true, 'yesterday', 33])
        .expect(400);

      expect(body.details).toMatchSnapshot();
    });

    it('will return a 400 response if the no usernames are provided in the request body', async () => {
      const { body } = await request(server)
        .delete(getUrl())
        .set(...authToken)
        .send([])
        .expect(400);

      expect(body.details).toMatchSnapshot();
    });

    it('will return a 401 response if the request is not authenticated', async () => {
      await request(server).delete(getUrl()).send(teamMemberNames).expect(401);
    });

    it('will return a 403 response if the user is not authorized to modify the operator', async () => {
      await request(server)
        .delete(getUrl())
        .set(...otherAuthToken)
        .send(teamMemberNames)
        .expect(403);
    });

    it('will return a 404 response if the operator does not exist', async () => {
      await request(server)
        .delete(getUrl('not-a-real-operator'))
        .set(...adminAuthToken)
        .send(teamMemberNames)
        .expect(404);
    });
  });
});
