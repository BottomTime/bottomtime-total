import sharp, { Sharp } from 'sharp';

export type ImageMetadata = {
  format: string;
  width: number;
  height: number;
  size: number;
};

export class ImageBuilder {
  private image: Sharp;

  constructor(data: Buffer) {
    this.image = sharp(data);
  }

  async getMetadata(): Promise<ImageMetadata> {
    const metadata = await this.image.metadata();
    return {
      format: metadata.format || '',
      width: metadata.width || 0,
      height: metadata.height || 0,
      size: metadata.size || 0,
    };
  }

  crop(top: number, left: number, width: number, height: number): ImageBuilder {
    this.image = this.image.extract({ top, left, width, height });
    return this;
  }

  resize(width: number, height?: number): ImageBuilder {
    this.image = this.image.resize(height ? { width, height } : width);
    return this;
  }

  toBuffer(): Promise<Buffer> {
    return this.image.toBuffer();
  }
}
