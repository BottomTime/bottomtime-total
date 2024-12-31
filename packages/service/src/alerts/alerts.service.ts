import {
  ApiList,
  CreateOrUpdateAlertParamsDTO,
  ListAlertsParamsDTO,
} from '@bottomtime/api';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { v7 as uuid } from 'uuid';

import { AlertEntity } from '../data';
import { Alert } from './alert';

export type ListAlertsOptions = ListAlertsParamsDTO & { userId?: string };

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(AlertEntity)
    private readonly Alerts: Repository<AlertEntity>,
  ) {}

  async listAlerts(options: ListAlertsOptions): Promise<ApiList<Alert>> {
    let query = this.Alerts.createQueryBuilder('alert')
      .select([
        'alert.id',
        'alert.icon',
        'alert.title',
        'alert.message',
        'alert.active',
        'alert.expires',
      ])
      .orderBy('alert.active', 'DESC')
      .offset(options.skip ?? 0)
      .limit(options.limit ?? 10);

    if (options.userId && !options.showDismissed) {
      query = query
        .leftJoin('alert.dismissals', 'dismissal')
        .where('dismissal.id IS NULL');
    }

    const [results, totalCount] = await query.getManyAndCount();
    return {
      data: results.map((alert) => new Alert(this.Alerts, alert)),
      totalCount,
    };
  }

  async getAlert(alertId: string): Promise<Alert | undefined> {
    const alert = await this.Alerts.findOneBy({ id: alertId });
    return alert ? new Alert(this.Alerts, alert) : undefined;
  }

  async createAlert(options: CreateOrUpdateAlertParamsDTO): Promise<Alert> {
    const data: AlertEntity = {
      id: uuid(),
      icon: options.icon,
      title: options.title,
      message: options.message,
      active: new Date(options.active ?? Date.now()),
      expires: options.expires ? new Date(options.expires) : null,
    };

    const alert = new Alert(this.Alerts, data);
    await alert.save();
    return alert;
  }
}
