import { DepthUnit } from '@bottomtime/api';

import {
  Column,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';

import { DiveSiteEntity } from './dive-site.entity';
import { UserEntity } from './user.entity';

@Entity('log_entries')
export class LogEntryEntity {
  // Identifiers
  @PrimaryColumn('uuid')
  id: string = '';

  @Column({ type: 'integer', nullable: true })
  @Index({ sparse: true })
  logNumber: number | null = null;

  // Owner
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  creator: UserEntity = new UserEntity();

  // Timing
  @Column({ type: 'timestamp', nullable: false })
  @Index()
  timestamp: Date = new Date();

  @Column({ type: 'varchar', length: 20, nullable: false })
  entryTime: string = '';

  @Column({ type: 'text', nullable: false })
  timezone: string = '';

  @Column({ type: 'integer', nullable: true })
  bottomTime: number | null = null;

  @Column({ type: 'integer', nullable: true })
  duration: number | null = null;

  // Location
  @ManyToOne(() => DiveSiteEntity, (site) => site.logEntries, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  site: DiveSiteEntity | null = null;

  @Column({ type: 'float', nullable: true })
  maxDepth: number | null = null;

  @Column({ type: 'enum', enum: DepthUnit, nullable: true })
  maxDepthUnit: DepthUnit | null = null;

  // Miscellaneous data
  @Column({ type: 'text', nullable: true })
  notes: string | null = null;
}
