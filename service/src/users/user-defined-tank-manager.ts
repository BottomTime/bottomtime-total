import Logger from 'bunyan';
import { Collection, MongoClient } from 'mongodb';
import { v4 as uuid } from 'uuid';

import { Collections, UserDocument } from '../data';
import { Tank, TankData, TankManager } from '../tanks';
import { UserDefinedTank } from './user-defined-tank';

export class UserDefinedTankManager implements TankManager {
  private readonly users: Collection<UserDocument>;

  constructor(
    private readonly mongoClient: MongoClient,
    private readonly log: Logger,
    private readonly userData: UserDocument,
  ) {
    this.users = mongoClient.db().collection(Collections.Users);
  }

  async createTank(data: TankData): Promise<Tank> {
    const tank = new UserDefinedTank(
      this.mongoClient,
      this.log,
      this.userData,
      {
        _id: uuid(),
        ...data,
      },
    );
    await tank.save();
    return tank;
  }

  async listTanks(): Promise<Tank[]> {
    return (
      this.userData.tanks?.map(
        (data) =>
          new UserDefinedTank(this.mongoClient, this.log, this.userData, data),
      ) ?? []
    );
  }
}
