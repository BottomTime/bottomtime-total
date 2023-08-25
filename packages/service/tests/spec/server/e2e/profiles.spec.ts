import { Collection } from 'mongodb';
import { Express } from 'express';
import request, { SuperAgentTest } from 'supertest';

import { Collections, UserDocument } from '../../../../src/data';
import { createAuthHeader } from '../../../utils/jwt';
import { createTestLogger } from '../../../test-logger';
import { createTestServer } from '../../../test-app';
import {
  fakePassword,
  fakeProfile,
  fakeUser,
} from '../../../fixtures/fake-user';
import { mongoClient } from '../../../mongo-client';
import { ProfileVisibility, SortOrder } from '../../../../src/constants';
import { UsersSortBy } from '../../../../src/users';

const Log = createTestLogger('profiles-e2e');

describe('Profiles End-To-End Tests', () => {
  let agent: SuperAgentTest;
  let app: Express;
  let Users: Collection<UserDocument>;

  beforeAll(async () => {
    app = await createTestServer({
      log: Log,
    });
    Users = mongoClient.db().collection(Collections.Users);
  });

  beforeEach(() => {
    agent = request.agent(app);
  });

  it("Will retrieve and update a user's profile", async () => {
    const password = fakePassword();
    const user = fakeUser({}, password);
    const authHeader = await createAuthHeader(user._id);
    const extraFields = {
      memberSince: user.memberSince.toISOString(),
      userId: user._id,
      username: user.username,
    } as const;
    await Users.insertOne(user);

    const { body: profileData } = await agent
      .get(`/profiles/${user.username}`)
      .set(...authHeader)
      .expect(200);

    expect(profileData).toEqual({
      ...user.profile,
      ...extraFields,
    });

    const updatedProfile = fakeProfile();
    await agent
      .put(`/profiles/${user.username}`)
      .set(...authHeader)
      .send(updatedProfile)
      .expect(200);

    const { body: updatedProfileData } = await agent
      .get(`/profiles/${user.username}`)
      .set(...authHeader)
      .expect(200);
    expect(updatedProfileData).toEqual({
      ...updatedProfile,
      ...extraFields,
    });

    const location = 'Atlantis';
    await agent
      .patch(`/profiles/${user.username}`)
      .set(...authHeader)
      .send({
        location,
      })
      .expect(200);

    const result = await Users.findOne({ _id: user._id });
    expect(result?.profile).toEqual({
      ...updatedProfile,
      location,
    });
  });

  it('Will return a 404 if a profile is not found', async () => {
    const user = fakeUser();
    const authHeader = await createAuthHeader(user._id);
    await Users.insertOne(user);
    await agent
      .get('/profiles/nosuchuser23')
      .set(...authHeader)
      .expect(404);
  });

  it('Will prevent users from viewing private profiles', async () => {
    const password = fakePassword();
    const currentUser = fakeUser({}, password);
    const privateUser = fakeUser({
      profile: { profileVisibility: ProfileVisibility.Private },
    });
    const friendsOnlyUser = fakeUser({
      profile: { profileVisibility: ProfileVisibility.FriendsOnly },
    });
    const authHeader = await createAuthHeader(currentUser._id);
    await Users.insertMany([currentUser, privateUser, friendsOnlyUser]);

    await agent
      .get(`/profiles/${privateUser.username}`)
      .set(...authHeader)
      .expect(404);
    await agent
      .get(`/profiles/${friendsOnlyUser.username}`)
      .set(...authHeader)
      .expect(404);
  });

  it("Will prevent users from modifying each other's profiles", async () => {
    const password = fakePassword();
    const currentUser = fakeUser({}, password);
    const privateUser = fakeUser();
    const publicUser = fakeUser({
      profile: { profileVisibility: ProfileVisibility.Public },
    });
    const profileData = fakeProfile();
    const privteProfileRoute = `/profiles/${privateUser.username}`;
    const publicProfileRoute = `/profiles/${publicUser.username}`;
    const authHeader = await createAuthHeader(currentUser._id);
    await Users.insertMany([currentUser, privateUser]);

    // Anonymous user...
    await agent.post(privteProfileRoute).send(profileData).expect(404);
    await agent.patch(privteProfileRoute).send(profileData).expect(404);
    await agent.post(publicProfileRoute).send(profileData).expect(404);
    await agent.patch(publicProfileRoute).send(profileData).expect(404);

    // Authenticated user
    await agent
      .post(privteProfileRoute)
      .set(...authHeader)
      .send(profileData)
      .expect(404);
    await agent
      .post(privteProfileRoute)
      .set(...authHeader)
      .send(profileData)
      .expect(404);
    await agent
      .post(privteProfileRoute)
      .set(...authHeader)
      .send(profileData)
      .expect(404);
    await agent
      .post(privteProfileRoute)
      .set(...authHeader)
      .send(profileData)
      .expect(404);
  });

  it('Will allow profile searches', async () => {
    const data = new Array<UserDocument>(50);
    for (let i = 0; i < data.length; i++) {
      data[i] = fakeUser();
    }
    await Users.insertMany(data);

    const { body: results } = await agent
      .get('/profiles')
      .query({
        sortBy: UsersSortBy.Username,
        sortOrder: SortOrder.Ascending,
        limit: 100,
      })
      .expect(200);

    expect(results.length).toBeGreaterThan(0);
    const ids = data.map((user) => user._id);
    for (const user of results) {
      expect(ids).toContain(user.userId);
    }
  });
});
