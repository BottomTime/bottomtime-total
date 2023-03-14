export interface TankData {
  readonly id: string;
  name: string;
  material: string;
  volume: number;
  workingPressure: number;
}

export interface Tank extends TankData {
  readonly preDefined: boolean;
  readonly owner: string | undefined;

  delete(): Promise<void>;
  save(): Promise<void>;
}

export interface TankManager {
  createTank(data: TankData): Promise<Tank>;
  listTanks(): Promise<Tank[]>;
}
