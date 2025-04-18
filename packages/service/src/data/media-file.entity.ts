import {
  Column,
  Entity,
  Index,
  ManyToOne,
  Point,
  PrimaryColumn,
} from 'typeorm';

import { LogEntryEntity } from './log-entry.entity';
import { OperatorEntity } from './operators.entity';
import { MediaType } from './types';

@Entity('media_files')
export class MediaFileEntity {
  @PrimaryColumn('uuid')
  id: string = '';

  @ManyToOne(() => LogEntryEntity, (entry) => entry.media, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  logEntry?: LogEntryEntity;

  @ManyToOne(() => OperatorEntity, (operator) => operator.media, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  diveOperator?: OperatorEntity;

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

  @Column({
    type: 'geography',
    nullable: true,
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  @Index({ spatial: true })
  gps: Point | null = null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  caption: string | null = null;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  description: string | null = null;
}
