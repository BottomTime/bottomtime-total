import {
  Column,
  Entity,
  Index,
  ManyToOne,
  Point,
  PrimaryColumn,
} from 'typeorm';

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

  @Column({ type: 'integer' })
  timeOffset: number = 0;

  @Column({ type: 'float', nullable: true })
  depth: number | null = null;

  @Column({ type: 'float', nullable: true })
  temperature: number | null = null;

  @Column('geography', {
    nullable: true,
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  gps: Point | null = null;
}
