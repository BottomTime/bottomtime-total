import { CreateOrUpdateTankParamsDTO } from '@bottomtime/api';

import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';

import { TankEntity, UserEntity } from '../data';
import { Tank } from './tank';
import { TankQueryBuilder } from './tank-query-builder';

export type CreateTankOptions = CreateOrUpdateTankParamsDTO & {
  userId?: string | null;
};
export type UpdateTankOptions = Partial<Omit<Tank, 'id' | 'userId'>>;
export type ListTanksResponse = {
  tanks: Tank[];
  totalCount: number;
};
export type ListTanksOptions =
  | { userId: undefined }
  | {
      userId: string;
      includeSystem?: boolean;
    };

const UserTankLimit = 10;

@Injectable()
export class TanksService {
  private readonly log = new Logger(TanksService.name);

  constructor(
    @InjectRepository(TankEntity)
    private readonly Tanks: Repository<TankEntity>,

    @InjectRepository(UserEntity)
    private readonly Users: Repository<UserEntity>,
  ) {}

  async listTanks(options?: ListTanksOptions): Promise<ListTanksResponse> {
    const queryBuilder = new TankQueryBuilder(this.Tanks);

    if (options?.userId) {
      queryBuilder.forUser(options.userId, options.includeSystem);
    } else {
      queryBuilder.forSystem();
    }

    const query = queryBuilder.build();
    this.log.debug('Attempting to retrieve list of tanks...');
    this.log.verbose('Listing tanks using query', query.getSql());

    const [tanks, totalCount] = await query.getManyAndCount();

    return {
      tanks: tanks.map((tank) => new Tank(this.Tanks, tank)),
      totalCount,
    };
  }

  async getTank(tankId: string): Promise<Tank | undefined> {
    const query = new TankQueryBuilder(this.Tanks).forTank(tankId).build();
    this.log.debug(`Attempting to retrieve tank with ID: ${tankId}`);
    this.log.verbose('Retrieving tank using query', query.getSql());

    const tank = await query.getOne();

    return tank ? new Tank(this.Tanks, tank) : undefined;
  }

  async createTank(options: CreateTankOptions): Promise<Tank> {
    // Users are limited to a maximum of 10 custom tanks. (For now.)
    // TODO: Consider making this configurable? Do I need this limit?
    if (options.userId) {
      const count = await this.Tanks.count({
        relations: ['user'],
        where: { user: { id: options.userId } },
      });

      if (count >= UserTankLimit) {
        throw new BadRequestException(
          `User has reached the maximum number of custom tanks: ${UserTankLimit}.`,
        );
      }
    }

    this.log.debug(`Attempting to create a new tank: ${options.name}`);

    const tankData = new TankEntity();
    tankData.id = uuid();
    tankData.material = options.material;
    tankData.name = options.name;
    tankData.volume = options.volume;
    tankData.workingPressure = options.workingPressure;

    if (options.userId) {
      tankData.user = await this.Users.findOneByOrFail({ id: options.userId });
    }

    await this.Tanks.save(tankData);

    return new Tank(this.Tanks, tankData);
  }
}
