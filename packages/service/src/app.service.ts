import { AppMetricsDTO } from '@bottomtime/api';

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import dayjs from 'dayjs';
import { MoreThan, Repository } from 'typeorm';

import { DiveSiteEntity, LogEntryEntity, UserEntity } from './data';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,

    @InjectRepository(DiveSiteEntity)
    private readonly diveSites: Repository<DiveSiteEntity>,

    @InjectRepository(LogEntryEntity)
    private readonly logEntries: Repository<LogEntryEntity>,
  ) {}

  private async getUsersMetrics(): Promise<AppMetricsDTO['users']> {
    const [total, active, activeLastMonth] = await Promise.all([
      this.users.count(),
      this.users.countBy({
        lastLogin: MoreThan(dayjs().subtract(7, 'days').toDate()),
      }),
      this.users.countBy({
        lastLogin: MoreThan(dayjs().subtract(30, 'days').toDate()),
      }),
    ]);

    return {
      total,
      active,
      activeLastMonth,
    };
  }

  private async getSitesMetrics(): Promise<AppMetricsDTO['diveSites']> {
    const [total] = await Promise.all([this.diveSites.count()]);

    return {
      total,
    };
  }

  private async getLogEntriesMetrics(): Promise<AppMetricsDTO['logEntries']> {
    const [total, addedLastWeek, addedLastMonth] = await Promise.all([
      this.logEntries.count(),
      this.logEntries.countBy({
        createdAt: MoreThan(dayjs().subtract(14, 'days').toDate()),
      }),
      this.logEntries.countBy({
        createdAt: MoreThan(dayjs().subtract(30, 'days').toDate()),
      }),
    ]);

    return {
      total,
      addedLastWeek,
      addedLastMonth,
    };
  }

  async getMetrics(): Promise<AppMetricsDTO> {
    const [users, diveSites, logEntries] = await Promise.all([
      this.getUsersMetrics(),
      this.getSitesMetrics(),
      this.getLogEntriesMetrics(),
    ]);

    return {
      users,
      diveSites,
      logEntries,
    };
  }
}
