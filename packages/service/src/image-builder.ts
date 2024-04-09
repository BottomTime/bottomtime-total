import Jimp from 'jimp';

export type ImageMetadata = {
  format: string;
  width: number;
  height: number;
};

type JimpInterface = Awaited<ReturnType<typeof Jimp.read>>;

export class ImageBuilder {
  private image: JimpInterface;

  private constructor(image: JimpInterface) {
    this.image = image;
  }

  getMetadata(): ImageMetadata {
    return {
      format: this.image.getMIME(),
      width: this.image.getWidth(),
      height: this.image.getHeight(),
    };
  }

  crop(
    left: number,
    top: number,
    width: number,
    height: number,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      this.image.crop(left, top, width, height, (err, value) => {
        if (err) {
          reject(err);
        } else {
          this.image = value;
          resolve();
        }
      });
    });
  }

  resize(width: number, height?: number): Promise<void> {
    return new Promise((resolve, reject) => {
      // TODO: Yeesh! This operation is slow.  Gotta find a faster library.
      this.image.resize(
        width,
        height || width,
        Jimp.RESIZE_NEAREST_NEIGHBOR,
        (err, value) => {
          if (err) {
            reject(err);
          } else {
            this.image = value;
            resolve();
          }
        },
      );
    });
  }

  toBuffer(): Promise<Buffer> {
    return this.image.getBufferAsync(this.image.getMIME());
  }

  static async fromBuffer(buffer: Buffer): Promise<ImageBuilder> {
    const image = await Jimp.read(buffer);
    return new ImageBuilder(image);
  }

  clone(): ImageBuilder {
    return new ImageBuilder(this.image.clone());
  }
}
