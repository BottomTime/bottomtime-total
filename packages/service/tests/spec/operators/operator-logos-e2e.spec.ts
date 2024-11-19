import { AccountTier, UserRole } from '@bottomtime/api';

import { S3Client } from '@aws-sdk/client-s3';
import { INestApplication } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { readFile } from 'fs/promises';
import { Server } from 'http';
import { resolve } from 'path';
import request from 'supertest';
import { Repository } from 'typeorm';

import { Config } from '../../../src/config';
import { OperatorEntity, UserEntity } from '../../../src/data';
import { OperatorLogoController } from '../../../src/operators/operator-logo.controller';
import { OperatorsService } from '../../../src/operators/operators.service';
import { StorageModule } from '../../../src/storage';
import { dataSource } from '../../data-source';
import {
  S3Utils,
  createAuthHeader,
  createTestApp,
  createTestOperator,
  createTestUser,
} from '../../utils';

jest.mock('../../../src/config');

type LogoSize = 32 | 64 | 128 | 256;

const LogoSizes = [32, 64, 128, 256];
const BucketName = 'shop-logo-test-bucket';
const OwnerId = 'ce1bb007-a105-477b-9549-1e63203c1326';
const OtherUserId = '46770383-86f6-48f6-a4bc-9c74bf31724f';
const AdminId = '7c8f1d77-0ce8-4cea-9bf1-1a932661a394';

const OwnerData: Partial<UserEntity> = {
  accountTier: AccountTier.ShopOwner,
  id: OwnerId,
  email: 'mruser@email.org',
  emailLowered: 'mruser@email.org',
  emailVerified: true,
  name: 'Mr. User',
  role: UserRole.User,
  username: 'MrUser',
  usernameLowered: 'mruser',
};

const OperatorData: Partial<OperatorEntity> = {
  id: 'ff873653-bc46-4508-8e5c-12460ba27db5',
  slug: 'test-operator',
  name: 'Test Operator',
};

function getUrl(size?: LogoSize, operatorKey?: string): string {
  let url = `/api/operators/${operatorKey || OperatorData.slug}/logo/`;
  if (size) url = `${url}${size}x${size}`;
  return url;
}

describe('Operator logos E2E tests', () => {
  let app: INestApplication;
  let server: Server;
  let testImage: Buffer;
  let s3Client: S3Client;
  let s3Utils: S3Utils;
  let Users: Repository<UserEntity>;
  let Operators: Repository<OperatorEntity>;

  let owner: UserEntity;
  let otherUser: UserEntity;
  let admin: UserEntity;
  let operator: OperatorEntity;
  let ownerAuthHeader: [string, string];
  let otherUserAuthHeader: [string, string];
  let adminAuthHeader: [string, string];

  beforeAll(async () => {
    Users = dataSource.getRepository(UserEntity);
    Operators = dataSource.getRepository(OperatorEntity);
    s3Client = new S3Client({
      endpoint: 'http://localhost:4566',
      forcePathStyle: true,
      region: 'us-east-1',
    });
    s3Utils = new S3Utils(s3Client);

    [testImage, app, ownerAuthHeader, otherUserAuthHeader, adminAuthHeader] =
      await Promise.all([
        readFile(resolve(__dirname, '../../fixtures/test-image.jpg')),
        createTestApp(
          {
            imports: [
              TypeOrmModule.forFeature([OperatorEntity]),
              StorageModule,
            ],
            providers: [OperatorsService],
            controllers: [OperatorLogoController],
          },
          {
            provide: S3Client,
            use: s3Client,
          },
        ),
        createAuthHeader(OwnerId),
        createAuthHeader(OtherUserId),
        createAuthHeader(AdminId),
      ]);
    server = app.getHttpAdapter().getInstance();

    Config.baseUrl = 'http://bottomti.me';
    Config.aws.s3.mediaBucket = BucketName;

    await s3Utils.createBucket(BucketName);
    await s3Utils.purgeBucket(BucketName);
  });

  beforeEach(async () => {
    owner = createTestUser(OwnerData);
    otherUser = createTestUser({ id: OtherUserId });
    admin = createTestUser({ id: AdminId, role: UserRole.Admin });
    operator = createTestOperator(owner, OperatorData);
    operator.logo = null;
    await Users.save([owner, otherUser, admin]);
    await Operators.save(operator);
  });

  afterEach(async () => {
    await s3Utils.purgeBucket(BucketName);
  });

  afterAll(async () => {
    await app.close();
    await s3Utils.deleteBucket(BucketName);
  });

  describe("when using HEAD to check for the existence of an operator's logo", () => {
    it('will return 200 if logo is present', async () => {
      await Operators.update({ id: operator.id }, { logo: getUrl() });
      await request(server).head(getUrl()).expect(200);
    });

    it('will return 404 if the logo is not present', async () => {
      await request(server).head(getUrl()).expect(404);
    });

    it('will return 404 if the operator does not exist', async () => {
      await request(server).head(getUrl(undefined, 'non-existent')).expect(404);
    });
  });

  describe('when listing logo URLs', () => {
    it('will return the list of available logo sizes', async () => {
      await Operators.update({ id: operator.id }, { logo: getUrl() });
      const { body } = await request(server).get(getUrl()).expect(200);
      expect(body).toMatchSnapshot();
    });

    it('will return a 404 response if the operator does not have a logo set', async () => {
      await request(server).get(getUrl()).expect(404);
    });

    it('will return a 404 response if the operator does not exist', async () => {
      await request(server).get(getUrl(undefined, 'non-existent')).expect(404);
    });
  });

  describe('when uploading a new logo', () => {
    it('will upload a new logo and generate various sizes (no boundaries set)', async () => {
      const { body } = await request(server)
        .post(getUrl())
        .set(...ownerAuthHeader)
        .attach('logo', testImage, {
          filename: 'logo.png',
          contentType: 'image/jpeg',
        })
        .expect(201);

      expect(body).toMatchSnapshot();

      const { logo } = await Operators.findOneByOrFail({ id: operator.id });
      expect(logo).toBe(getUrl());

      const checksums = await Promise.all(
        LogoSizes.map((size) =>
          s3Utils.getObjectChecksum(
            BucketName,
            `shopLogos/${operator.id}/${size}x${size}`,
          ),
        ),
      );
      expect(checksums).toMatchSnapshot();
    });

    it('will upload a new logo and generate various sizes (with boundaries set)', async () => {
      const { body } = await request(server)
        .post(getUrl())
        .set(...ownerAuthHeader)
        .attach('logo', testImage, {
          filename: 'logo.png',
          contentType: 'image/jpeg',
        })
        .field({ width: 1440, height: 1440, left: 270, top: 1070 })
        .expect(201);

      expect(body).toMatchSnapshot();

      const { logo } = await Operators.findOneByOrFail({ id: operator.id });
      expect(logo).toBe(getUrl());

      const checksums = await Promise.all(
        LogoSizes.map((size) =>
          s3Utils.getObjectChecksum(
            BucketName,
            `shopLogos/${operator.id}/${size}x${size}`,
          ),
        ),
      );
      expect(checksums).toMatchSnapshot();
    });

    it('will allow an admin to upload a new logo', async () => {
      const { body } = await request(server)
        .post(getUrl())
        .set(...adminAuthHeader)
        .attach('logo', testImage, {
          filename: 'logo.png',
          contentType: 'image/jpeg',
        })
        .expect(201);

      expect(body).toMatchSnapshot();
    });

    it('will return a 400 response if the logo is not attached', async () => {
      await request(server)
        .post(getUrl())
        .set(...ownerAuthHeader)
        .expect(400);
    });

    it('will return a 400 response if the logo is not an image', async () => {
      await request(server)
        .post(getUrl())
        .set(...ownerAuthHeader)
        .attach('avatar', resolve(__dirname, '../../fixtures/text-file.txt'), {
          contentType: 'text/plain',
        })
        .expect(400);
    });

    it('will return a 413 response if the logo is too large', async () => {
      await request(server)
        .post(getUrl())
        .set(...ownerAuthHeader)
        .attach('logo', Buffer.alloc(1024 * 1024 * 10.1), {
          filename: 'big.jpg',
          contentType: 'image/jpeg',
        })
        .expect(413);
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server)
        .post(getUrl())
        .attach('logo', testImage, {
          filename: 'logo.png',
          contentType: 'image/jpeg',
        })
        .expect(401);
    });

    it('will return a 403 response if the user is not authorized to modify the operator', async () => {
      await request(server)
        .post(getUrl())
        .set(...otherUserAuthHeader)
        .attach('logo', testImage, {
          filename: 'logo.png',
          contentType: 'image/jpeg',
        })
        .expect(403);
    });

    it('will return a 404 response if the operator does not exist', async () => {
      await request(server)
        .post(getUrl(undefined, 'non-existent'))
        .set(...ownerAuthHeader)
        .attach('logo', testImage, {
          filename: 'logo.png',
          contentType: 'image/jpeg',
        })
        .expect(404);
    });
  });
});
