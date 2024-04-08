import fs, { FileHandle } from 'fs/promises';
import path from 'path';

import { ImageBuilder } from '../../src/image-builder';

async function loadTestImage(): Promise<Buffer> {
  let file: FileHandle | undefined;
  try {
    const file = await fs.open(
      path.resolve(__dirname, '../fixtures/test-image.jpg'),
    );
    return file.readFile();
  } finally {
    if (file) await file.close();
  }
}

describe('ImageBuilder class', () => {
  let testImage: Buffer;

  beforeEach(async () => {
    testImage = await loadTestImage();
  });

  it('will return image metadata', async () => {
    const builder = new ImageBuilder(testImage);
    const metadata = await builder.getMetadata();
    expect(metadata).toEqual({
      format: 'jpeg',
      width: 1920,
      height: 1080,
      size: 123456,
    });
  });
});
