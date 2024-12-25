import { AlertDTO } from '@bottomtime/api';

import { Repository } from 'typeorm';

import { AlertEntity } from '../data';

export class Alert {
  constructor(
    private readonly Alerts: Repository<AlertEntity>,
    private readonly data: AlertEntity,
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
    return this.data.expires ?? undefined;
  }
  set expires(value: Date | undefined) {
    this.data.expires = value ?? null;
  }

  toJSON(): AlertDTO {
    return {
      id: this.id,
      icon: this.icon,
      title: this.title,
      message: this.message,
      active: this.active.valueOf(),
      expires: this.expires?.valueOf(),
    };
  }

  async save(): Promise<void> {
    await this.Alerts.save(this.data);
  }

  async delete(): Promise<void> {
    await this.Alerts.delete({ id: this.id });
  }

  async dismiss(userId: string): Promise<void> {
    const isDismissed = await this.Alerts.exists({
      relations: ['dismissals'],
      where: { id: this.id, dismissals: { id: userId } },
    });

    if (!isDismissed) {
      await this.Alerts.createQueryBuilder()
        .relation(AlertEntity, 'dismissals')
        .of(this.data)
        .add({ id: userId });
    }
  }
}
