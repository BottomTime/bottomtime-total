import { UserRole } from '@bottomtime/api';

import {
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { INestApplication } from '@nestjs/common';

import { createHash } from 'crypto';
import fs, { FileHandle } from 'fs/promises';
import path from 'path';
import request from 'supertest';
import { Repository } from 'typeorm';
import { resolve } from 'url';

import { Config } from '../../../src/config';
import { UserEntity } from '../../../src/data';
import { StorageModule } from '../../../src/storage';
import { UsersModule } from '../../../src/users';
import { UserAvatarController } from '../../../src/users/user-avatar.controller';
import { dataSource } from '../../data-source';
import {
  S3Utils,
  createAuthHeader,
  createTestApp,
  createTestUser,
} from '../../utils';

jest.mock('../../../src/config');

const AvatarSizes: ReadonlyArray<string> = ['32', '64', '128', '256'];

const AdminUserId = 'f3669787-82e5-458f-a8ad-98d3f57dda6e';
const AdminUserData: Partial<UserEntity> = {
  id: AdminUserId,
  email: 'admin@site.org',
  emailLowered: 'admin@site.org',
  emailVerified: true,
  isLockedOut: false,
  memberSince: new Date(),
  role: UserRole.Admin,
  username: 'Admin',
  usernameLowered: 'admin',
};

const RegularUserId = '5a4699d8-48c4-4410-9886-b74b8b85cac1';
const RegularUserData: Partial<UserEntity> = {
  id: RegularUserId,
  emailVerified: false,
  isLockedOut: false,
  memberSince: new Date(),
  role: UserRole.User,
  username: 'Joe.Regular',
  usernameLowered: 'joe.regular',
  email: 'RoflCopter17@gmail.com',
  emailLowered: 'roflcopter17@gmail.com',
  passwordHash: '$2b$04$EIK2SpqsdmO.nwAOPJ9wt.9o2z732N9s23pLrdPxz8kqXB1A3yhdS',
  avatar: '/users/joe.regular/avatar',
  bio: 'This is a test user.',
  experienceLevel: 'Advanced',
  location: 'Seattle, WA',
  name: 'Joe Regular',
  startedDiving: '2000-01-01',
};

const OtherUserId = '735520d7-4964-46a1-bd79-5a0832555715';
const OtherUserData: Partial<UserEntity> = {
  id: OtherUserId,
  emailVerified: false,
  isLockedOut: false,
  memberSince: new Date(),
  role: UserRole.User,
  username: 'Other.Dude',
  usernameLowered: 'other.dude',
  email: 'otherguy@gmail.org',
  emailLowered: 'otherguy@gmail.org',
};

const BucketName = 'avatar-test-bucket';

function getUrl(username?: string, size?: number): string {
  let url = `/api/users/${username || RegularUserData.username}/avatar`;
  if (size) url = `${url}/${size}x${size}`;
  return url;
}

async function loadTestImage(size: string): Promise<Buffer> {
  let file: FileHandle | undefined;
  try {
    file = await fs.open(
      path.resolve(__dirname, `../../fixtures/test-image-${size}.jpg`),
    );
    return file.readFile();
  } finally {
    if (file) await file.close();
  }
}

describe('User Avatar E2E tests', () => {
  let app: INestApplication;
  let server: unknown;
  let Users: Repository<UserEntity>;
  let regularUser: UserEntity;
  let adminUser: UserEntity;
  let otherUser: UserEntity;
  let s3Client: S3Client;
  let s3Utils: S3Utils;
  let testImage: Buffer;

  let authHeader: [string, string];
  let adminAuthHeader: [string, string];
  let otherAuthHeader: [string, string];

  beforeAll(async () => {
    testImage = await fs.readFile(
      path.resolve(__dirname, '../../fixtures/test-image.jpg'),
    );

    s3Client = new S3Client({
      forcePathStyle: true,
      endpoint: 'http://localhost:4566',
      region: 'us-east-1',
    });
    s3Utils = new S3Utils(s3Client);

    app = await createTestApp(
      {
        imports: [StorageModule, UsersModule],
        controllers: [UserAvatarController],
      },
      {
        provide: S3Client,
        use: s3Client,
      },
    );
    server = app.getHttpServer();
    Users = dataSource.getRepository(UserEntity);
    authHeader = await createAuthHeader(RegularUserId);
    adminAuthHeader = await createAuthHeader(AdminUserId);
    otherAuthHeader = await createAuthHeader(OtherUserId);

    Config.baseUrl = 'http://bottomti.me';
    Config.aws.s3.mediaBucket = BucketName;
  });

  beforeEach(async () => {
    regularUser = createTestUser(RegularUserData);
    adminUser = createTestUser(AdminUserData);
    otherUser = createTestUser(OtherUserData);
    await Users.save([regularUser, adminUser, otherUser]);

    // Check for bucket. Create it if it doesn't exist.
    await s3Utils.createBucket(BucketName);
    await s3Utils.purgeBucket(BucketName);
  });

  afterEach(async () => {
    await s3Utils.purgeBucket(BucketName);
  });

  afterAll(async () => {
    await app.close();
    await s3Utils.deleteBucket(BucketName);
  });

  describe('when using HEAD to see if the user has an avatar', () => {
    it('will return 200 if the user has an avatar', async () => {
      await request(server)
        .head(getUrl())
        .set(...authHeader)
        .expect(200);
    });

    it('will return 404 if the user does not have an avatar', async () => {
      regularUser.avatar = null;
      await Users.save(regularUser);
      await request(server)
        .head(getUrl())
        .set(...authHeader)
        .expect(404);
    });

    it('will allow anonymous users to see if the user has an avatar set', async () => {
      await request(server).head(getUrl()).expect(200);
    });

    it('will allow other users to see if the user has an avatar set', async () => {
      await request(server)
        .head(getUrl())
        .set(...otherAuthHeader)
        .expect(200);
    });

    it('will return 404 if the user does not exist', async () => {
      await request(server).head(getUrl('does.not.exist')).expect(404);
    });
  });

  describe('when listing URLs for user avatars', () => {
    const expectedUrls = {
      root: '/api/users/Joe.Regular/avatar/',
      sizes: {
        '32x32': '/api/users/Joe.Regular/avatar/32x32',
        '64x64': '/api/users/Joe.Regular/avatar/64x64',
        '128x128': '/api/users/Joe.Regular/avatar/128x128',
        '256x256': '/api/users/Joe.Regular/avatar/256x256',
      },
    };

    it('will return a list of URLs for the user avatar', async () => {
      const { body } = await request(server)
        .get(getUrl())
        .set(...authHeader)
        .expect(200);
      expect(body).toEqual(expectedUrls);
    });

    it('will return a 404 response if the user does not have an avatar', async () => {
      regularUser.avatar = null;
      await Users.save(regularUser);
      await request(server)
        .get(getUrl())
        .set(...authHeader)
        .expect(404);
    });

    it('will return a 404 response if the user does not exist', async () => {
      await request(server).get(getUrl('does.not.exist')).expect(404);
    });

    it('will allow anonymous users to list avatar URLs', async () => {
      const { body } = await request(server).get(getUrl()).expect(200);
      expect(body).toEqual(expectedUrls);
    });

    it('will allow other users to list avatar URLs', async () => {
      const { body } = await request(server)
        .get(getUrl())
        .set(...otherAuthHeader)
        .expect(200);
      expect(body).toEqual(expectedUrls);
    });
  });

  describe('when saving a new avatar', () => {
    beforeEach(async () => {
      await Users.update({ id: regularUser.id }, { avatar: null });
    });

    it('will return a 400 response if the file uploaded is missing', async () => {
      const { body } = await request(server)
        .post(getUrl())
        .set(...authHeader)
        .field({
          left: 0,
          top: 0,
          width: 100,
          height: 100,
        })
        .expect(400);

      expect(body.message).toBe('No avatar image was provided.');
    });

    it('will return a 400 response if the file uploaded is not an image', async () => {
      const { body } = await request(server)
        .post(getUrl())
        .set(...authHeader)
        .field({
          left: 0,
          top: 0,
          width: 100,
          height: 100,
        })
        .attach(
          'avatar',
          path.resolve(__dirname, '../../fixtures/text-file.txt'),
          { contentType: 'text/plain' },
        )
        .expect(400);

      expect(body.message).toBe(
        'The uploaded file has an invalid MIME type: "text/plain". Expected "image/*".',
      );
    });

    it('will return a 400 response if the file uploaded is too large', async () => {
      const { body } = await request(server)
        .post(getUrl())
        .set(...authHeader)
        .field({
          left: 0,
          top: 0,
          width: 100,
          height: 100,
        })
        .attach('avatar', Buffer.alloc(1024 * 1024 * 10.1), {
          filename: 'big.jpg',
          contentType: 'image/jpeg',
        })
        .expect(413);

      expect(body.message).toBe('File too large');
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server)
        .post(getUrl())
        .field({
          left: 0,
          top: 0,
          width: 100,
          height: 100,
        })
        .attach('avatar', testImage, {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        })
        .expect(401);
    });

    it('will return a 403 response if the user does not have permission to update the avatar', async () => {
      await request(server)
        .post(getUrl())
        .set(...otherAuthHeader)
        .field({
          left: 0,
          top: 0,
          width: 100,
          height: 100,
        })
        .attach('avatar', testImage, {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        })
        .expect(403);
    });

    it('will return a 404 response if the target user does not exist', async () => {
      await request(server)
        .post(getUrl('does.not.exist'))
        .set(...adminAuthHeader)
        .field({
          left: 0,
          top: 0,
          width: 100,
          height: 100,
        })
        .attach('avatar', testImage, {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        })
        .expect(404);
    });

    it('will allow a user to save a new avatar with no dimensions specified', async () => {
      const { body } = await request(server)
        .post(getUrl())
        .set(...authHeader)
        .attach('avatar', testImage, {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        })
        .expect(201);

      expect(body).toEqual({
        root: '/api/users/Joe.Regular/avatar/',
        sizes: {
          '32x32': '/api/users/Joe.Regular/avatar/32x32',
          '64x64': '/api/users/Joe.Regular/avatar/64x64',
          '128x128': '/api/users/Joe.Regular/avatar/128x128',
          '256x256': '/api/users/Joe.Regular/avatar/256x256',
        },
      });

      const { avatar: saved } = await Users.findOneOrFail({
        where: { id: regularUser.id },
        select: ['id', 'avatar'],
      });
      expect(saved).toBe('/api/users/Joe.Regular/avatar');

      const checksums = await Promise.all(
        AvatarSizes.map((size) =>
          s3Utils.getObjectChecksum(
            BucketName,
            `avatars/${regularUser.id}/${size}x${size}`,
          ),
        ),
      );
      expect(checksums).toMatchSnapshot();
    }, 10000);

    it('will allow a user to save a new avatar with dimensions specified', async () => {
      const { body } = await request(server)
        .post(getUrl())
        .set(...authHeader)
        .attach('avatar', testImage, {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        })
        .field({ width: 1440, height: 1440, left: 270, top: 1070 })
        .expect(201);

      expect(body).toEqual({
        root: '/api/users/Joe.Regular/avatar/',
        sizes: {
          '32x32': '/api/users/Joe.Regular/avatar/32x32',
          '64x64': '/api/users/Joe.Regular/avatar/64x64',
          '128x128': '/api/users/Joe.Regular/avatar/128x128',
          '256x256': '/api/users/Joe.Regular/avatar/256x256',
        },
      });

      const { avatar: saved } = await Users.findOneOrFail({
        where: { id: regularUser.id },
        select: ['id', 'avatar'],
      });
      expect(saved).toBe('/api/users/Joe.Regular/avatar');

      const checksums = await Promise.all(
        AvatarSizes.map((size) =>
          s3Utils.getObjectChecksum(
            BucketName,
            `avatars/${regularUser.id}/${size}x${size}`,
          ),
        ),
      );
      expect(checksums).toMatchSnapshot();
    }, 10000);

    it("will allow an admin to update another user's avatar", async () => {
      const { body } = await request(server)
        .post(getUrl())
        .set(...adminAuthHeader)
        .attach('avatar', testImage, {
          filename: 'test.jpg',
          contentType: 'image/jpeg',
        })
        .expect(201);

      expect(body).toEqual({
        root: '/api/users/Joe.Regular/avatar/',
        sizes: {
          '32x32': '/api/users/Joe.Regular/avatar/32x32',
          '64x64': '/api/users/Joe.Regular/avatar/64x64',
          '128x128': '/api/users/Joe.Regular/avatar/128x128',
          '256x256': '/api/users/Joe.Regular/avatar/256x256',
        },
      });
    }, 10000);
  });

  describe("when removing a user's avatar", () => {
    it("will remove a user's avatar and delete the images", async () => {
      const img = await loadTestImage('32x32');
      await Promise.all(
        AvatarSizes.map((size) =>
          s3Client.send(
            new PutObjectCommand({
              Bucket: BucketName,
              Key: `avatars/${regularUser.id}/${size}x${size}`,
              Body: img,
              ContentType: 'image/jpeg',
            }),
          ),
        ),
      );

      await request(server)
        .delete(getUrl())
        .set(...authHeader)
        .expect(204);

      const { avatar: saved } = await Users.findOneOrFail({
        where: { id: regularUser.id },
        select: ['id', 'avatar'],
      });
      expect(saved).toBeNull();

      AvatarSizes.forEach(async (size) => {
        await expect(
          s3Client.send(
            new GetObjectCommand({
              Bucket: BucketName,
              Key: `avatars/${regularUser.id}/${size}x${size}`,
            }),
          ),
        ).rejects.toThrow(NoSuchKey);
      });
    });

    it("will allow an admin to delete a user's avatar", async () => {
      const img = await loadTestImage('32x32');
      await Promise.all(
        AvatarSizes.map((size) =>
          s3Client.send(
            new PutObjectCommand({
              Bucket: BucketName,
              Key: `avatars/${regularUser.id}/${size}x${size}`,
              Body: img,
              ContentType: 'image/jpeg',
            }),
          ),
        ),
      );

      await request(server)
        .delete(getUrl())
        .set(...adminAuthHeader)
        .expect(204);

      const { avatar: saved } = await Users.findOneOrFail({
        where: { id: regularUser.id },
        select: ['id', 'avatar'],
      });
      expect(saved).toBeNull();

      AvatarSizes.forEach(async (size) => {
        await expect(
          s3Client.send(
            new GetObjectCommand({
              Bucket: BucketName,
              Key: `avatars/${regularUser.id}/${size}x${size}`,
            }),
          ),
        ).rejects.toThrow(NoSuchKey);
      });
    });

    it('will do nothing if the user does not have an avatar', async () => {
      await Users.update({ id: regularUser.id }, { avatar: null });
      await request(server)
        .delete(getUrl())
        .set(...adminAuthHeader)
        .expect(204);
    });

    it('will return a 401 response if the user is not authenticated', async () => {
      await request(server).delete(getUrl()).expect(401);
    });

    it('will return a 403 response if the user does not have permission to update the avatar', async () => {
      await request(server)
        .delete(getUrl())
        .set(...otherAuthHeader)
        .expect(403);
    });

    it('will return a 404 response if the target user does not exist', async () => {
      await request(server)
        .delete(getUrl('does.not.exist'))
        .set(...adminAuthHeader)
        .expect(404);
    });
  });

  describe('when downloading an avatar', () => {
    AvatarSizes.forEach((size) => {
      it(`will return the avatar when requested at ${size}x${size}`, async () => {
        const img = await loadTestImage(`${size}x${size}`);
        await s3Client.send(
          new PutObjectCommand({
            Bucket: BucketName,
            Key: `avatars/${regularUser.id}/${size}x${size}`,
            Body: img,
            ContentType: 'image/jpeg',
          }),
        );

        const { body } = await request(server)
          .get(getUrl(regularUser.username, parseInt(size)))
          .set(...authHeader)
          .expect(200);

        const buffer = Buffer.from(body);
        const md5 = createHash('md5').update(buffer).digest('hex');
        expect(md5).toMatchSnapshot();
      });
    });

    it('will return a 404 response if the size is not recognized', async () => {
      await request(server)
        .get(resolve(getUrl(), './blah'))
        .set(...authHeader)
        .expect(404);

      await request(server)
        .get(getUrl(regularUser.username, 1024))
        .set(...authHeader)
        .expect(404);
    });

    it('will return a 404 response if the user does not have an avatar', async () => {
      await Users.update({ id: regularUser.id }, { avatar: null });
      await request(server)
        .get(getUrl(regularUser.username, 64))
        .set(...authHeader)
        .expect(404);
    });

    it('will return a 404 response if the user does not exist', async () => {
      await request(server).get(getUrl('does.not.exist', 32)).expect(404);
    });

    it('will return a 404 response if the requested file cannot be retrieved from storage', async () => {
      await request(server)
        .get(getUrl(regularUser.username, 128))
        .set(...authHeader)
        .expect(404);
    });
  });
});
