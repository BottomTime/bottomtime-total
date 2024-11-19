import { Repository, SelectQueryBuilder } from 'typeorm';

import { LogEntryImportEntity } from '../../data';
import { User } from '../../users';

export class LogEntryImportQueryBuilder {
  private query: SelectQueryBuilder<LogEntryImportEntity>;
  private showFinalized = false;

  constructor(imports: Repository<LogEntryImportEntity>) {
    this.query = imports
      .createQueryBuilder('imports')
      .innerJoin('imports.owner', 'owners')
      .select([
        'imports.id',
        'imports.date',
        'imports.finalized',
        'imports.device',
        'imports.deviceId',
        'imports.bookmark',
        'owners.id',
        'owners.username',
        'owners.usernameLowered',
      ])
      .orderBy('imports.finalized', 'DESC', 'NULLS FIRST')
      .addOrderBy('imports.date', 'DESC');
  }

  build(): SelectQueryBuilder<LogEntryImportEntity> {
    if (!this.showFinalized) {
      return this.query.andWhere('imports.finalized IS NULL');
    }
    return this.query;
  }

  withFinalized(showFinalized?: boolean): this {
    this.showFinalized = showFinalized ?? false;
    return this;
  }

  withOwner(owner: User): this {
    const username = owner.username.trim().toLowerCase();
    this.query = this.query.andWhere('owners.usernameLowered = :username', {
      username,
    });
    return this;
  }

  withPagination(skip?: number, limit?: number): this {
    this.query = this.query.skip(skip ?? 0).take(limit ?? 100);
    return this;
  }
}
