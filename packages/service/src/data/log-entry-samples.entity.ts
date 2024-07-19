import { DepthUnit, TemperatureUnit } from '@bottomtime/api';

import { Column, Entity, Index, ManyToOne, PrimaryColumn } from 'typeorm';

import { LogEntryEntity } from './log-entry.entity';

@Entity('log_entry_samples')
@Index(['logEntry', 'timeOffset'], { unique: true })
export class LogEntrySampleEntity {
  @PrimaryColumn('uuid')
  id: string = '';

  @ManyToOne(() => LogEntryEntity, (logEntry) => logEntry.samples, {
    onDelete: 'CASCADE',
  })
  logEntry: LogEntryEntity = new LogEntryEntity();

  @Column({ type: 'float' })
  timeOffset: number = 0;

  @Column({ type: 'float', nullable: true })
  depth: number | null = null;

  @Column({ type: 'enum', enum: DepthUnit, nullable: true })
  depthUnit: DepthUnit | null = null;

  @Column({ type: 'float', nullable: true })
  temperature: number | null = null;

  @Column({ type: 'enum', enum: TemperatureUnit, nullable: true })
  temperatureUnit: TemperatureUnit | null = null;
}
