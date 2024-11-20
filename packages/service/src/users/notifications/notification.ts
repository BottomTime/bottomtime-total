import { NotificationDTO } from '@bottomtime/api';

import { Repository } from 'typeorm';

import { NotificationEntity } from '../../data';

export class Notification {
  constructor(
    private readonly Notifications: Repository<NotificationEntity>,
    private readonly data: NotificationEntity,
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

  get dismissed(): boolean {
    return this.data.dismissed;
  }

  async save(): Promise<void> {
    await this.Notifications.save(this.data);
  }

  async delete(): Promise<void> {
    await this.Notifications.delete({ id: this.data.id });
  }

  async markDismissed(dismissed: boolean = true): Promise<void> {
    if (this.data.dismissed === dismissed) return;

    this.data.dismissed = dismissed;
    await this.save();
  }

  toJSON(): NotificationDTO {
    return {
      id: this.id,
      dismissed: this.dismissed,
      icon: this.icon,
      message: this.message,
      title: this.title,
      active: this.active,
      expires: this.expires ?? undefined,
    };
  }
}
