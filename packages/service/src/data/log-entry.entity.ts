import { DepthUnit } from '@bottomtime/api';

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { DiveSiteEntity } from './dive-site.entity';
import { LogEntryAirEntity } from './log-entry-air.entity';
import { UserEntity } from './user.entity';

@Entity('log_entries')
export class LogEntryEntity {
  // Identifiers
  @PrimaryColumn('uuid')
  id: string = '';

  @CreateDateColumn({ type: 'timestamp' })
  @Index()
  createdAt: Date = new Date();

  @UpdateDateColumn({ type: 'timestamp', nullable: true })
  updatedAt: Date | null = null;

  @Column({ type: 'integer', nullable: true })
  @Index({ sparse: true })
  logNumber: number | null = null;

  // Owner
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  owner: UserEntity = new UserEntity();

  // Timing
  @Column({ type: 'timestamp', nullable: false })
  @Index()
  timestamp: Date = new Date();

  @Column({ type: 'varchar', length: 20, nullable: false })
  entryTime: string = '';

  @Column({ type: 'text', nullable: false })
  timezone: string = '';

  @Column({ type: 'float', nullable: true })
  bottomTime: number | null = null;

  @Column({ type: 'float', nullable: false })
  duration: number = 0;

  // Location
  @ManyToOne(() => DiveSiteEntity, (site) => site.logEntries, {
    nullable: true,
  })
  site: DiveSiteEntity | null = null;

  // Dive characteristics
  @OneToMany(() => LogEntryAirEntity, (air) => air.logEntry, {
    onDelete: 'CASCADE',
  })
  air?: LogEntryAirEntity[];

  @Column({ type: 'float', nullable: true })
  maxDepth: number | null = null;

  @Column({ type: 'enum', enum: DepthUnit, nullable: true })
  maxDepthUnit: DepthUnit | null = null;

  // Miscellaneous data
  @Column({ type: 'text', nullable: true })
  notes: string | null = null;
}
