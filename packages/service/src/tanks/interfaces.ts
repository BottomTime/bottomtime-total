import { TankMaterial } from '../constants';

export interface TankData {
  name: string;
  material: TankMaterial;
  volume: number;
  workingPressure: number;
}

export interface Tank extends TankData {
  readonly id: string;
  readonly preDefined: boolean;
  readonly owner: string | undefined;

  delete(): Promise<void>;
  save(): Promise<void>;

  toJSON(): Record<string, unknown>;
}

export interface TankManager {
  createTank(options: TankData): Promise<Tank>;
  getTank(id: string): Promise<Tank | undefined>;
  listTanks(): Promise<Tank[]>;
}
