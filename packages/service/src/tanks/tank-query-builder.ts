import { Repository, SelectQueryBuilder } from 'typeorm';

import { TankEntity, UserEntity } from '../data';

export class TankQueryBuilder {
  private query: SelectQueryBuilder<TankEntity>;

  constructor(tanks: Repository<TankEntity>) {
    this.query = tanks
      .createQueryBuilder()
      .from(TankEntity, 'tanks')
      .leftJoinAndMapOne(
        'tanks.user',
        UserEntity,
        'owner',
        'tanks.user = owner.id',
      )
      .select([
        'tanks.id',
        'tanks.name',
        'tanks.material',
        'tanks.volume',
        'tanks.workingPressure',
        'owner.id',
        'owner.avatar',
        'owner.location',
        'owner.logBookSharing',
        'owner.memberSince',
        'owner.name',
        'owner.username',
      ])
      .orderBy(`tanks.name`, 'ASC');
  }

  build(): SelectQueryBuilder<TankEntity> {
    return this.query;
  }

  forSystem(): this {
    this.query = this.query.where('tanks.user IS NULL');
    return this;
  }

  forTank(tankId: string): this {
    this.query = this.query.andWhere('tanks.id = :tankId', {
      tankId,
    });
    return this;
  }

  forUser(userId: string, includeSystemTanks: boolean = false): this {
    if (includeSystemTanks) {
      this.query = this.query.andWhere(
        'owner.id = :userId OR owner.id IS NULL',
        {
          userId,
        },
      );
    } else {
      this.query = this.query.andWhere('owner.id = :userId', {
        userId,
      });
    }
    return this;
  }
}
