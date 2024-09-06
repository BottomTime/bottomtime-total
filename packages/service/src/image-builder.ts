import { BadRequestException } from '@nestjs/common';

import exif, { Exif } from 'exif-reader';
import sharp, { Sharp } from 'sharp';

const BoundingError = new BadRequestException(
  'Invalid bounding rectangle provided for cropping.',
);

export type ImageMetadata = {
  exif?: Exif;
  format: string;
  height: number;
  width: number;
  size: number;
};

export class ImageBuilder {
  private image: Sharp;

  constructor(image: Buffer) {
    this.image = sharp(image);
  }

  async getMetadata(): Promise<ImageMetadata> {
    const metadata = await this.image.metadata();
    return {
      exif: metadata.exif ? exif(metadata.exif) : undefined,
      format: metadata.format ? `image/${metadata.format}` : '',
      height: metadata.height ?? 0,
      width: metadata.width ?? 0,
      size: metadata.size ?? 0,
    };
  }

  async crop(
    left: number,
    top: number,
    width: number,
    height: number,
  ): Promise<this> {
    if (left < 0 || top < 0) throw BoundingError;

    const { width: maxWidth, height: maxHeight } = await this.image.metadata();
    if (
      maxWidth &&
      maxHeight &&
      (left + width > maxWidth || top + height > maxHeight)
    ) {
      throw BoundingError;
    }

    this.image = this.image.extract({ left, top, width, height });
    return this;
  }

  async resize(width: number, height?: number): Promise<this> {
    if (width < 1 || (typeof height === 'number' && height < 1)) {
      throw new BadRequestException(
        'Invalid resize dimensions provided. Width and height must be greater than 0.',
      );
    }

    this.image.resize({
      width,
      height,
      fit: 'cover',
      position: 'centre',
      kernel: 'lanczos3',
    });

    return this;
  }

  async toBuffer(): Promise<Buffer> {
    return await this.image.keepMetadata().toBuffer();
  }

  async clone(): Promise<ImageBuilder> {
    return new ImageBuilder(await this.toBuffer());
  }
}
