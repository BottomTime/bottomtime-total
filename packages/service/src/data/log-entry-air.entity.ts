import { PressureUnit, TankMaterial } from '@bottomtime/api';

import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';

import { LogEntryEntity } from './log-entry.entity';

@Entity('log_entry_air')
export class LogEntryAirEntity {
  @PrimaryColumn('uuid')
  id: string = '';

  @ManyToOne(() => LogEntryEntity, (logEntry) => logEntry.air)
  logEntry?: LogEntryEntity;

  @Column({ type: 'varchar', length: 100 })
  name: string = '';

  @Column({ type: 'enum', enum: TankMaterial })
  material: TankMaterial = TankMaterial.Aluminum;

  @Column({ type: 'float' })
  workingPressure: number = 0;

  @Column({ type: 'float' })
  volume: number = 0;

  @Column({ type: 'integer' })
  count: number = 1;

  @Column({ type: 'float' })
  startPressure: number = 0;

  @Column({ type: 'float' })
  endPressure: number = 0;

  @Column({ type: 'enum', enum: PressureUnit })
  pressureUnit: PressureUnit = PressureUnit.Bar;

  @Column({ type: 'float', nullable: true })
  o2Percent: number | null = null;

  @Column({ type: 'float', nullable: true })
  hePercent: number | null = null;
}
