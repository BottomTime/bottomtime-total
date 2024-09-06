import { BadRequestException } from '@nestjs/common';

import { createHash } from 'crypto';
import fs, { FileHandle } from 'fs/promises';
import path from 'path';

import { ImageBuilder } from '../../src/image-builder';

async function loadTestImage(): Promise<Buffer> {
  let file: FileHandle | undefined;
  try {
    file = await fs.open(path.resolve(__dirname, '../fixtures/test-image.jpg'));
    return file.readFile();
  } finally {
    if (file) await file.close();
  }
}

describe('ImageBuilder class', () => {
  let testImage: Buffer;
  let builder: ImageBuilder;

  beforeEach(async () => {
    testImage = await loadTestImage();
    builder = new ImageBuilder(testImage);
  });

  it('will return image metadata', async () => {
    const metadata = await builder.getMetadata();
    expect(metadata).toEqual({
      format: 'image/jpeg',
      height: 4000,
      width: 1800,
      size: 544775,
    });
  });

  it('will crop a section of the image', async () => {
    builder = await builder.crop(260, 1150, 1440, 1440);
    const result = await builder.toBuffer();

    const md5 = createHash('md5').update(result).digest('hex');
    expect(md5).toMatchSnapshot();
  });

  it('will throw an exception if crop bounding area is invalid', async () => {
    await expect(builder.crop(-1, -10, 80, 80)).rejects.toThrow(
      BadRequestException,
    );
    await expect(builder.crop(0, 0, 3000, 8000)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('will resize the image', async () => {
    builder = await builder.resize(225, 500);
    const result = await builder.toBuffer();

    const md5 = createHash('md5').update(result).digest('hex');
    expect(md5).toMatchSnapshot();
  });

  it('will throw an exception if image size is invalid', async () => {
    await expect(builder.resize(-6, -6)).rejects.toThrow(BadRequestException);
  });
});
