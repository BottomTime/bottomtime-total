import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Collections } from '../data';
import { Model, FilterQuery } from 'mongoose';
import { TankData } from '../schemas';
import { v4 as uuid } from 'uuid';
import { Tank } from './tank';
import { CreateOrUpdateTankParamsDTO } from '@bottomtime/api';
import { Maybe } from '../maybe';

export type CreateTankOptions = CreateOrUpdateTankParamsDTO & {
  userId?: Maybe<string>;
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
  constructor(
    @InjectModel(Collections.Tanks) private readonly Tanks: Model<TankData>,
  ) {}

  async listTanks(options?: ListTanksOptions): Promise<ListTanksResponse> {
    let query: FilterQuery<TankData>;

    if (options?.userId) {
      if (options?.includeSystem) {
        query = {
          $or: [
            { user: null },
            { user: { $type: 'undefined' } },
            { user: options.userId },
          ],
        };
      } else {
        query = { user: options.userId };
      }
    } else {
      query = {
        $or: [{ user: null }, { user: { $type: 'undefined' } }],
      };
    }

    const tanks = await this.Tanks.find(query).sort({ name: 1 }).exec();

    return {
      tanks: tanks.map((tank) => new Tank(tank)),
      totalCount: tanks.length,
    };
  }

  async getTank(tankId: string): Promise<Tank | undefined> {
    const tank = await this.Tanks.findById(tankId);
    return tank ? new Tank(tank) : undefined;
  }

  async createTank(options: CreateTankOptions): Promise<Tank> {
    // Users are limited to a maximum of 10 custom tanks. (For now.)
    // TODO: Consider making this configurable? Do I need this limit?
    if (options.userId) {
      const count = await this.Tanks.countDocuments({ user: options.userId });
      if (count >= UserTankLimit) {
        throw new BadRequestException(
          `User has reached the maximum number of custom tanks: ${UserTankLimit}.`,
        );
      }
    }

    const tankData = new this.Tanks({
      _id: uuid(),
      material: options.material,
      name: options.name,
      volume: options.volume,
      workingPressure: options.workingPressure,
      user: options.userId,
    });
    const tank = new Tank(tankData);
    await tank.save();

    return tank;
  }
}
