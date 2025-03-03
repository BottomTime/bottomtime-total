import { HttpServer, INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import request from 'supertest';
import { Repository } from 'typeorm';

import { AgenciesService } from '../../../src/certifications';
import { AgenciesController } from '../../../src/certifications/agencies.controller';
import { AgencyEntity } from '../../../src/data';
import { dataSource } from '../../data-source';
import { TestAgencies } from '../../fixtures/agencies';
import { createTestApp } from '../../utils';

function getUrl(agencyId?: string): string {
  const url = '/api/agencies';
  return agencyId ? `${url}/${agencyId}` : url;
}

describe('Agencies E2E tests', () => {
  let Agencies: Repository<AgencyEntity>;
  let app: INestApplication;
  let server: HttpServer;

  beforeAll(async () => {
    Agencies = dataSource.getRepository(AgencyEntity);
    app = await createTestApp({
      imports: [TypeOrmModule.forFeature([AgencyEntity])],
      providers: [AgenciesService],
      controllers: [AgenciesController],
    });
    await app.init();
    server = app.getHttpServer();
  });

  beforeEach(async () => {
    await Agencies.save(TestAgencies);
  });

  afterAll(async () => {
    await app.close();
  });

  it('will retrieve the list of agencies', async () => {
    const { body } = await request(server).get(getUrl()).expect(200);
    expect(body).toMatchSnapshot();
  });

  it('will retrieve a single agency by its id', async () => {
    const { body } = await request(server)
      .get(getUrl(TestAgencies[1].id))
      .expect(200);
    expect(body).toMatchSnapshot();
  });

  it('will return a 404 response if the agency id does not exist', async () => {
    await request(server)
      .get(getUrl('f5d2198f-d173-4b49-b180-ea39b57e39ca'))
      .expect(404);
  });
});
