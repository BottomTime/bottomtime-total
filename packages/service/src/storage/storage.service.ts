import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  NoSuchKey,
  NotFound,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable, Logger } from '@nestjs/common';

import { Readable } from 'stream';
import { ReadableStream } from 'stream/web';

import { Config } from '../config';
import { File, FileMetadata, ListFilesOptions, ListFilesResult } from './types';

export const S3ClientKey = Symbol('S3Client');

@Injectable()
export class StorageService {
  private readonly log = new Logger(StorageService.name);

  constructor(@Inject(S3ClientKey) private readonly client: S3Client) {}

  // Requires s3:getObject
  async getFileMetadata(key: string): Promise<FileMetadata | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: Config.aws.s3.mediaBucket,
        Key: key,
      });

      this.log.debug(`Attempting to get metadata for "${key}"...`);
      const response = await this.client.send(command);
      return {
        key,
        lastModified: response.LastModified,
        mimeType: response.ContentType,
        size: response.ContentLength,
      };
    } catch (error) {
      if (error instanceof NotFound) {
        return null;
      }

      throw error;
    }
  }

  // Requires s3:deleteObject
  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: Config.aws.s3.mediaBucket,
      Key: key,
    });

    this.log.debug(`Attempting to delete file with key "${key}"...`);
    await this.client.send(command);
  }

  async getSignedUrl(key: string, expiration?: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: Config.aws.s3.mediaBucket,
      Key: key,
    });

    this.log.debug(`Attempting to get signed URL for "${key}"...`);
    const url = await getSignedUrl(this.client, command, {
      expiresIn: expiration ?? 3600,
    });

    return url;
  }

  // Requires s3:listBucket
  async listFiles(options?: ListFilesOptions): Promise<ListFilesResult> {
    if (typeof options?.maxResults === 'number' && options?.maxResults < 1) {
      throw new Error('maxResults must be greater than 0');
    }

    const command = new ListObjectsV2Command({
      Bucket: Config.aws.s3.mediaBucket,
      ContinuationToken: options?.continuationToken,
      Delimiter: '/',
      MaxKeys: options?.maxResults ?? 200,
      Prefix: options?.prefix,
    });

    this.log.debug(
      `Attempting to list files in bucket "${Config.aws.s3.mediaBucket}"...`,
    );
    const response = await this.client.send(command);

    return {
      files:
        response.Contents?.filter((file) => !!file.Key).map((file) => ({
          key: file.Key!,
          lastModified: file.LastModified,
          size: file.Size,
        })) ?? [],
      count: response.KeyCount ?? 0,
      continuationToken: response.IsTruncated
        ? response.NextContinuationToken
        : undefined,
    };
  }

  // Requires s3:getObject
  async readFile(key: string): Promise<File | null> {
    const command = new GetObjectCommand({
      Bucket: Config.aws.s3.mediaBucket,
      Key: key,
    });

    try {
      this.log.debug(`Attempting to read file with key "${key}"...`);
      const response = await this.client.send(command);
      return response.Body
        ? {
            key,
            content: response.Body.transformToWebStream() as ReadableStream,
            lastModified: response.LastModified,
            mimeType: response.ContentType,
            size: response.ContentLength,
          }
        : null;
    } catch (error) {
      if (error instanceof NoSuchKey) {
        return null;
      }

      throw error;
    }
  }

  async writeFile(
    key: string,
    content: Readable | Buffer,
    mimeType: string = 'application/octet-stream',
  ): Promise<FileMetadata> {
    const command = new PutObjectCommand({
      Body: content,
      Bucket: Config.aws.s3.mediaBucket,
      Key: key,
      ServerSideEncryption: 'AES256',
      StorageClass: 'STANDARD',
      ContentType: mimeType,
    });

    this.log.debug(`Attempting to write file with key "${key}"...`);
    await this.client.send(command);

    return {
      key,
      lastModified: new Date(),
      mimeType,
    };
  }
}
