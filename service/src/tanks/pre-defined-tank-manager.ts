import { Tank, TankData, TankManager } from './interfaces';

export class PreDefinedTankManager implements TankManager {
  createTank(data: TankData): Promise<Tank> {
    throw new Error('Method not implemented.');
  }
  listTanks(): Promise<Tank[]> {
    throw new Error('Method not implemented.');
  }
}
