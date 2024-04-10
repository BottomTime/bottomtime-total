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
    builder = await ImageBuilder.fromBuffer(testImage);
  });

  it('will return image metadata', async () => {
    const metadata = await builder.getMetadata();
    expect(metadata).toEqual({
      format: 'image/jpeg',
      width: 1800,
      height: 4000,
    });
  });

  it('will crop a section of the image', async () => {
    await builder.crop(260, 1150, 1440, 1440);
    const result = await builder.toBuffer();

    const md5 = createHash('md5').update(result).digest('hex');
    expect(md5).toMatchSnapshot();
  });

  it('will throw an exception if crop bounding area is invalid', async () => {
    await expect(builder.crop(-1, -10, 3000, 8000)).rejects.toThrow();
  });

  it('will resize the image', async () => {
    await builder.resize(225, 500);
    const result = await builder.toBuffer();

    const md5 = createHash('md5').update(result).digest('hex');
    expect(md5).toMatchSnapshot();
  });

  it('will throw an exception if image size is invalid', async () => {
    await expect(builder.resize(-6, -6)).rejects.toThrow();
  });
});
