import { Collection, MongoClient } from 'mongodb';
import Logger from 'bunyan';
import { v4 as uuid } from 'uuid';

import { Collections, TankDocument } from '../data';
import { PreDefinedTank } from './pre-defined-tank';
import { Tank, TankData, TankManager } from './interfaces';

export class PreDefinedTankManager implements TankManager {
  private readonly tanks: Collection<TankDocument>;

  constructor(
    private readonly mongoClient: MongoClient,
    private readonly log: Logger,
  ) {
    this.tanks = mongoClient.db().collection(Collections.Tanks);
  }

  async createTank(options: TankData): Promise<Tank> {
    const tank = new PreDefinedTank(this.mongoClient, this.log, {
      _id: uuid(),
      ...options,
    });
    await tank.save();
    return tank;
  }

  async getTank(id: string): Promise<Tank | undefined> {
    const data = await this.tanks.findOne({ _id: id });

    if (data) {
      return new PreDefinedTank(this.mongoClient, this.log, data);
    }

    return undefined;
  }

  async listTanks(): Promise<Tank[]> {
    const tanks: PreDefinedTank[] = [];

    await this.tanks.find({}, { sort: { name: 1 } }).forEach((tank) => {
      tanks.push(new PreDefinedTank(this.mongoClient, this.log, tank));
    });

    return tanks;
  }
}
