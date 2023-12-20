import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Collections } from '../data';
import { Model, FilterQuery } from 'mongoose';
import { TankData, TankDocument } from '../schemas';
import { TankDTO } from '@bottomtime/api';
import { Maybe } from '../maybe';
import { v4 as uuid } from 'uuid';

export type Tank = Omit<TankDTO, 'isSystem'> & { userId?: Maybe<string> };
export type CreateTankOptions = Omit<Tank, 'id'>;
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

  private static toTankEntity(tank: TankDocument): Tank {
    return {
      id: tank._id,
      material: tank.material,
      name: tank.name,
      volume: tank.volume,
      workingPressure: tank.workingPressure,
      userId: tank.user,
    };
  }

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
      tanks: tanks.map((tank) => TanksService.toTankEntity(tank)),
      totalCount: tanks.length,
    };
  }

  async getTank(tankId: string): Promise<Tank | undefined> {
    const tank = await this.Tanks.findById(tankId);
    return tank ? TanksService.toTankEntity(tank) : undefined;
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

    const tank = new this.Tanks({
      _id: uuid(),
      material: options.material,
      name: options.name,
      volume: options.volume,
      workingPressure: options.workingPressure,
      user: options.userId,
    });

    await tank.save();

    return TanksService.toTankEntity(tank);
  }

  async updateTank(tankId: string, update: UpdateTankOptions): Promise<Tank> {
    const updated = await this.Tanks.findOneAndUpdate(
      { _id: tankId },
      {
        $set: {
          name: update.name,
          material: update.material,
          volume: update.volume,
          workingPressure: update.workingPressure,
        },
      },
    );

    if (!updated) {
      throw new NotFoundException(`No tank found with ID ${tankId}.`);
    }

    updated.name = update.name ?? updated.name;
    updated.material = update.material ?? updated.material;
    updated.volume = update.volume ?? updated.volume;
    updated.workingPressure = update.workingPressure ?? updated.workingPressure;

    return TanksService.toTankEntity(updated);
  }

  async deleteTank(tankId: string): Promise<boolean> {
    const { deletedCount } = await this.Tanks.deleteOne({ _id: tankId });
    return deletedCount > 0;
  }
}
