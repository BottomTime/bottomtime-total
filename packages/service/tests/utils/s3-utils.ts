import {
  BucketAlreadyExists,
  BucketAlreadyOwnedByYou,
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  S3Client,
} from '@aws-sdk/client-s3';

import { createHash } from 'crypto';

export class S3Utils {
  constructor(private readonly client: S3Client) {}

  async createBucket(bucket: string): Promise<void> {
    try {
      await this.client.send(new CreateBucketCommand({ Bucket: bucket }));
    } catch (error) {
      if (
        error instanceof BucketAlreadyExists ||
        error instanceof BucketAlreadyOwnedByYou
      ) {
        // Bucket already exists. Proceed.
        return;
      }

      throw error;
    }
  }

  async purgeBucket(bucket: string): Promise<void> {
    const { Contents } = await this.client.send(
      new ListObjectsV2Command({ Bucket: bucket }),
    );

    if (Contents?.length) {
      await Promise.all([
        ...Contents.map((obj) =>
          this.client.send(
            new DeleteObjectCommand({
              Bucket: bucket,
              Key: obj.Key,
            }),
          ),
        ),
      ]);
    }
  }

  async deleteBucket(bucket: string): Promise<void> {
    await this.client.send(new DeleteBucketCommand({ Bucket: bucket }));
  }

  async getObjectChecksum(bucket: string, key: string): Promise<string | null> {
    const { Body } = await this.client.send(
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
    if (!Body) return null;

    const md5 = createHash('md5')
      .update(await Body.transformToByteArray())
      .digest('hex');
    return md5;
  }
}
