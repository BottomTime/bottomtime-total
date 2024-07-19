import {
  Column,
  Entity,
  Index,
  ManyToOne,
  Point,
  PrimaryColumn,
} from 'typeorm';

import { LogEntryEntity } from './log-entry.entity';
import { MediaType } from './types';

@Entity('log_entry_media')
export class LogEntryMediaEntity {
  @PrimaryColumn('uuid')
  id: string = '';

  @ManyToOne(() => LogEntryEntity, (logEntry) => logEntry.media, {
    onDelete: 'CASCADE',
  })
  logEntry: LogEntryEntity = new LogEntryEntity();

  @Column({ type: 'enum', enum: MediaType })
  type: MediaType = MediaType.Image;

  @Column({ type: 'varchar', length: 512 })
  filePath: string = '';

  @Column({ type: 'varchar', length: 512, nullable: true })
  thumbnailPath: string | null = null;

  @Column({ type: 'integer' })
  width: number = 0;

  @Column({ type: 'integer' })
  height: number = 0;

  @Column({ type: 'integer' })
  fileSize: number = 0;

  @Column({ type: 'float', nullable: true })
  length: number | null = null;

  @Column({ type: 'geography', nullable: true })
  @Index({ spatial: true })
  gps: Point | null = null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  caption: string | null = null;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  description: string | null = null;
}
