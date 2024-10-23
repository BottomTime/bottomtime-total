import { OperatorDTO } from '@bottomtime/api';

import { OperatorEntity } from '../data';

export class OperatorSocials {
  constructor(private readonly data: OperatorEntity) {}

  get facebook(): string | undefined {
    return this.data.facebook ?? undefined;
  }
  set facebook(value: string | undefined) {
    this.data.facebook = value ?? null;
  }

  get instagram(): string | undefined {
    return this.data.instagram ?? undefined;
  }
  set instagram(value: string | undefined) {
    this.data.instagram = value ?? null;
  }

  get tiktok(): string | undefined {
    return this.data.tiktok ?? undefined;
  }
  set tiktok(value: string | undefined) {
    this.data.tiktok = value ?? null;
  }

  get twitter(): string | undefined {
    return this.data.twitter ?? undefined;
  }
  set twitter(value: string | undefined) {
    this.data.twitter = value ?? null;
  }

  get youtube(): string | undefined {
    return this.data.youtube ?? undefined;
  }
  set youtube(value: string | undefined) {
    this.data.youtube = value ?? null;
  }

  toJSON(): OperatorDTO['socials'] {
    return {
      facebook: this.facebook,
      instagram: this.instagram,
      tiktok: this.tiktok,
      twitter: this.twitter,
      youtube: this.youtube,
    };
  }
}
