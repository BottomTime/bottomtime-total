import { NoSuchKey, NotFound, S3Client } from '@aws-sdk/client-s3';
import * as Presigner from '@aws-sdk/s3-request-presigner';

import { open } from 'fs/promises';
import path from 'path';

import { StorageService } from '../../../src/storage/storage.service';

jest.mock('@aws-sdk/s3-request-presigner');

describe('Storage Service', () => {
  let client: S3Client;
  let service: StorageService;

  beforeAll(() => {
    client = new S3Client({});
    service = new StorageService(client);
  });

  it('will return file metadata', async () => {
    jest.spyOn(client, 'send').mockResolvedValue({
      $metadata: {
        httpStatusCode: 200,
        requestId: 'G3Q57CV9NKHPED8P',
        extendedRequestId:
          'd6It3gH3fsqhMdNj0DR4uSjThfsF7n5W/8j8ZMjr/Hxoku882RIciVkDbQT5t668vAg06xmX04M=',
        cfId: undefined,
        attempts: 1,
        totalRetryDelay: 0,
      },
      AcceptRanges: 'bytes',
      LastModified: new Date('2024-02-18T14:31:50.000Z'),
      ContentLength: 27,
      ETag: '"ea7c44f60c938333d5ead34460b68ba4"',
      ContentType: 'text/plain',
      ServerSideEncryption: 'AES256',
      Metadata: {},
    } as never);

    const result = await service.getFileMetadata('test/file.txt');
    expect(result).toEqual({
      key: 'test/file.txt',
      lastModified: new Date('2024-02-18T14:31:50.000Z'),
      mimeType: 'text/plain',
      size: 27,
    });
  });

  it('will return null when retrieving file metadata if file does not exist', async () => {
    const notFound = new NotFound({
      message: 'Not Found',
      $metadata: {},
    });
    jest.spyOn(client, 'send').mockRejectedValue(notFound as never);

    const result = await service.getFileMetadata('test/file.txt');
    expect(result).toBeNull();
  });

  it('will retrieve a file upon request', async () => {
    const fd = await open(
      path.resolve(__dirname, '../../fixtures/text-file.txt'),
      'r',
    );
    const stream = fd.readableWebStream();
    const response = {
      $metadata: {
        httpStatusCode: 200,
        requestId: 'G7YKMWR052STC5B1',
        extendedRequestId:
          'MtMdDVXl78hQVNQr4zTrHUj2Q8Ga0Ue+AkMdE0N9ctRmDLTA3IhxW4gjl1S8hwVqXQFfnkClh5c=',
        cfId: undefined,
        attempts: 1,
        totalRetryDelay: 0,
      },
      AcceptRanges: 'bytes',
      LastModified: new Date('2024-02-18T14:31:50.000Z'),
      ContentLength: 27,
      ETag: '"ea7c44f60c938333d5ead34460b68ba4"',
      ContentType: 'text/plain',
      ServerSideEncryption: 'AES256',
      Metadata: {},
      Body: {
        transformToWebStream: () => stream,
      },
    };
    jest.spyOn(client, 'send').mockResolvedValue(response as never);

    const result = await service.readFile('test/test.txt');

    expect(result).not.toBeNull();
    expect(result!.key).toBe('test/test.txt');
    expect(result!.lastModified).toEqual(new Date('2024-02-18T14:31:50.000Z'));
    expect(result!.mimeType).toBe('text/plain');
    expect(result!.size).toBe(27);

    const reader = result!.content.getReader();
    let finished = false;
    let text = '';
    const textDecoder = new TextDecoder();

    while (!finished) {
      const { done, value } = await reader.read();
      if (done) {
        finished = true;
      } else {
        text += textDecoder.decode(value!);
      }
    }

    expect(text).toEqual('This is a small text file.\n');
  });

  it('will return null when a file is requested that does not exist', async () => {
    const noSuchKey = new NoSuchKey({
      message: 'Not Found',
      $metadata: {},
    });
    jest.spyOn(client, 'send').mockRejectedValue(noSuchKey as never);
    const result = await service.readFile('test/file.txt');
    expect(result).toBeNull();
  });

  it('will return a signed URL for a file', async () => {
    const expectedUrl =
      'https://bottomtime-media-local.s3.us-east-1.amazonaws.com/test/test.txt?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=AKIA57WVFENVZVROAINA%2F20240220%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Date=20240220T040928Z&X-Amz-Expires=5000&X-Amz-Signature=e46ba7ae44882047d17436a0319e837ccefc082398789179cfd090d8b7b35cf6&X-Amz-SignedHeaders=host&x-id=GetObject';
    const spy = jest
      .mocked(Presigner)
      .getSignedUrl.mockResolvedValue(expectedUrl);

    const url = await service.getSignedUrl('test/file.txt', 5000);
    expect(url).toBe(expectedUrl);
    expect(spy).toHaveBeenCalledWith(client, expect.any(Object), {
      expiresIn: 5000,
    });
  });

  // TODO: Implement this test
  it('will list files in a directory', async () => {
    const response = {
      $metadata: {
        httpStatusCode: 200,
        requestId: 'M1TR8HJWR82JZ12X',
        extendedRequestId:
          'YsQscQrDvPHbpFuK3f3VOPZjcX3MyUcVtQkuHuSKxsquQAJuGWM32dQDrWRgG9nQUuDScbA3gk8=',
        cfId: undefined,
        attempts: 1,
        totalRetryDelay: 0,
      },
      Contents: [
        {
          Key: 'Danger_reef_shark_feed.MP4',
          LastModified: new Date('2018-11-27T20:55:38.000Z'),
          ETag: '"06db9e96133831ee5cb83f912761cce0-30"',
          Size: 243946715,
          StorageClass: 'STANDARD_IA',
        },
        {
          Key: 'GH010086.MP4',
          LastModified: new Date('2018-11-27T20:55:38.000Z'),
          ETag: '"beac8c7ee98f470f686c3bf8fc0f8072-31"',
          Size: 254676783,
          StorageClass: 'STANDARD_IA',
        },
        {
          Key: 'GH010087.MP4',
          LastModified: new Date('2018-11-27T20:55:38.000Z'),
          ETag: '"75ca0f8ae1716a43d547c9bd78cbea2e-7"',
          Size: 54400775,
          StorageClass: 'STANDARD_IA',
        },
        {
          Key: 'GH010088.MP4',
          LastModified: new Date('2018-11-27T20:55:38.000Z'),
          ETag: '"f34a0bb7cc37ee3d354caec2247f7592-29"',
          Size: 238595180,
          StorageClass: 'STANDARD_IA',
        },
      ],
      Delimiter: '/',
      IsTruncated: true,
      KeyCount: 4,
      MaxKeys: 200,
      Name: 'test-bucket-of-files',
      NextContinuationToken:
        '1KZWSjKFPgGtgAShvnyMY5XK4BJ3l//6c7QRKBHIl2XDCR/VoBM4BNg==',
      Prefix: '',
    };
    jest.spyOn(client, 'send').mockResolvedValue(response as never);

    const result = await service.listFiles();
    expect(result).toMatchSnapshot();
  });

  it('will list additional files in a directory with a continuation token', async () => {
    const response = {
      $metadata: {
        httpStatusCode: 200,
        requestId: 'QJPYDMQDRTZCGHQ2',
        extendedRequestId:
          'FSMp5C+W3KXRuMVNoXQujnYfV8amNFA6AXM1vDpprhvImxjdXtghV3uey7N0Km15Jut0Stu+Tig=',
        cfId: undefined,
        attempts: 1,
        totalRetryDelay: 0,
      },
      Contents: [
        {
          Key: 'GH010089.MP4',
          LastModified: new Date('2018-11-27T20:55:38.000Z'),
          ETag: '"2c804f73038e0b64309d694d08e8434b-4"',
          Size: 29831602,
          StorageClass: 'STANDARD_IA',
        },
        {
          Key: 'GH010090.MP4',
          LastModified: new Date('2018-11-27T20:56:58.000Z'),
          ETag: '"6136a23ce907adcdcfa7963ed02bb16e-4"',
          Size: 32007869,
          StorageClass: 'STANDARD_IA',
        },
        {
          Key: 'GH010091.MP4',
          LastModified: new Date('2018-11-27T21:00:02.000Z'),
          ETag: '"a32ca3fc707ef9dc0a5fbc2e038d3971-14"',
          Size: 111557152,
          StorageClass: 'STANDARD_IA',
        },
        {
          Key: 'GH010092.MP4',
          LastModified: new Date('2018-11-27T21:00:33.000Z'),
          ETag: '"7d8cfdb24a7008e169a946439b4e9bfc-9"',
          Size: 70749772,
          StorageClass: 'STANDARD_IA',
        },
      ],
      ContinuationToken:
        '1KZWSjKFPgGtgAShvnyMY5XK4BJ3l//6c7QRKBHIl2XDCR/VoBM4BNg==',
      Delimiter: '/',
      IsTruncated: true,
      KeyCount: 4,
      MaxKeys: 4,
      Name: 'test-bucket-of-files',
      NextContinuationToken:
        '1kQQslyxa7N3CO0BtdLehYTtQ+X3n6vjEvdU1tJAtQmWz9i5ImURDXg==',
      Prefix: '',
    };
    jest.spyOn(client, 'send').mockResolvedValue(response as never);

    const result = await service.listFiles({
      continuationToken:
        '1KZWSjKFPgGtgAShvnyMY5XK4BJ3l//6c7QRKBHIl2XDCR/VoBM4BNg==',
    });
    expect(result).toMatchSnapshot();
  });

  it('will delete a file', async () => {
    const response = {
      $metadata: {
        httpStatusCode: 204,
        requestId: 'GYYHKPD402ZF7Y73',
        extendedRequestId:
          'XFfOTJu/2GAwoVAa6uRZKpDO4WpwV3kZVbLaM9robCSMWTLMr/GigyKyCjCfGeq5X2nmV8WyIwA=',
        cfId: undefined,
        attempts: 1,
        totalRetryDelay: 0,
      },
    };
    jest.spyOn(client, 'send').mockResolvedValue(response as never);
    await service.deleteFile('test/test.txt');
  });
});
