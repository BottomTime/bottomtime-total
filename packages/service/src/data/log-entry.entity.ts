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
  logNumber?: number;

  // Owner
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  creator: UserEntity = new UserEntity();

  // Timing
  @Column({ type: 'timestamp', nullable: false })
  @Index()
  timestamp: Date = new Date();

  @Column({ type: 'timestamp', nullable: false })
  entryTime: string = '';

  @Column({ type: 'text', nullable: false })
  timezone: string = '';

  @Column({ type: 'integer', nullable: true })
  bottomTime?: number;

  @Column({ type: 'integer', nullable: true })
  duration?: number;

  // Location
  @OneToMany(() => DiveSiteEntity, (site) => site.id, { nullable: true })
  site?: string;

  @Column({ type: 'float', nullable: true })
  maxDepth?: number;

  @Column({ type: 'enum', enum: DepthUnit, nullable: true })
  maxDepthUnit?: DepthUnit;

  // Miscellaneous data
  @Column({ type: 'text', nullable: true })
  notes?: string;
}
