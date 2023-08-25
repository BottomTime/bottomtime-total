import { Express } from 'express';
import request, { SuperAgentTest } from 'supertest';

import { createTestLogger } from '../../../test-logger';
import { createTestServer } from '../../../test-app';
import { Collection } from 'mongodb';
import {
  Collections,
  DiveSiteDocument,
  DiveSiteSchema,
  UserDocument,
  UserSchema,
} from '../../../../src/data';
import { mongoClient } from '../../../mongo-client';

import DiveSiteCreatorData from '../../../fixtures/dive-site-creators.json';
import DiveSiteData from '../../../fixtures/dive-sites.json';

const Log = createTestLogger('dive-sites-e2e');

describe('Dive Site End-to-End Tests', () => {
  let agent: SuperAgentTest;
  let app: Express;

  let Users: Collection<UserDocument>;
  let DiveSites: Collection<DiveSiteDocument>;

  let diveSiteDocuments: DiveSiteDocument[];
  let diveSiteCreatorDocuments: UserDocument[];

  beforeAll(async () => {
    app = await createTestServer({
      log: Log,
    });
    const db = mongoClient.db();
    Users = db.collection(Collections.Users);
    DiveSites = db.collection(Collections.DiveSites);

    diveSiteCreatorDocuments = DiveSiteCreatorData.map((creator) =>
      UserSchema.parse(creator),
    );
    diveSiteDocuments = DiveSiteData.map((site) => DiveSiteSchema.parse(site));
  });

  beforeEach(() => {
    agent = request.agent(app);
  });

  it('Will retrieve a dive site', async () => {
    await Promise.all([
      Users.insertMany(diveSiteCreatorDocuments),
      DiveSites.insertOne(diveSiteDocuments[0]),
    ]);

    const { body } = await agent
      .get(`/diveSites/${diveSiteDocuments[0]._id}`)
      .expect(200);
    expect(body).toMatchSnapshot();
  });
});
