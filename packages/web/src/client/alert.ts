import { AlertDTO, CreateOrUpdateAlertParamsSchema } from '@bottomtime/api';

import { AxiosInstance } from 'axios';

export class Alert {
  constructor(
    private readonly client: AxiosInstance,
    private readonly data: AlertDTO,
  ) {}

  get id(): string {
    return this.data.id;
  }

  get icon(): string {
    return this.data.icon;
  }
  set icon(value: string) {
    this.data.icon = value;
  }

  get title(): string {
    return this.data.title;
  }
  set title(value: string) {
    this.data.title = value;
  }

  get message(): string {
    return this.data.message;
  }
  set message(value: string) {
    this.data.message = value;
  }

  get active(): Date {
    return this.data.active;
  }
  set active(value: Date) {
    this.data.active = value;
  }

  get expires(): Date | undefined {
    return this.data.expires;
  }
  set expires(value: Date | undefined) {
    this.data.expires = value;
  }

  toJSON(): AlertDTO {
    return { ...this.data };
  }

  async save(): Promise<void> {
    await this.client.put(
      `/api/alerts/${this.data.id}`,
      CreateOrUpdateAlertParamsSchema.parse(this.data),
    );
  }

  async delete(): Promise<void> {
    await this.client.delete(`/api/alerts/${this.data.id}`);
  }
}
