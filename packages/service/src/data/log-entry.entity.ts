import {
  DepthUnit,
  ExposureSuit,
  TemperatureUnit,
  TrimCorrectness,
  WeightCorrectness,
  WeightUnit,
} from '@bottomtime/api';

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
import { LogEntryMediaEntity } from './log-entry-media.entity';
import { LogEntrySampleEntity } from './log-entry-samples.entity';
import { LogEntrySignatureEntity } from './log-entry-signature.entity';
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
  averageDepth: number | null = null;

  @Column({ type: 'float', nullable: true })
  maxDepth: number | null = null;

  @Column({ type: 'enum', enum: DepthUnit, nullable: true })
  depthUnit: DepthUnit | null = null;

  // Equipment
  @Column({ type: 'float', nullable: true })
  weight: number | null = null;

  @Column({ type: 'enum', enum: WeightUnit, nullable: true })
  weightUnit: WeightUnit | null = null;

  @Column({ type: 'enum', enum: WeightCorrectness, nullable: true })
  weightCorrectness: WeightCorrectness | null = null;

  @Column({ type: 'enum', enum: TrimCorrectness, nullable: true })
  trimCorrectness: TrimCorrectness | null = null;

  @Column({ type: 'enum', enum: ExposureSuit, nullable: true })
  exposureSuit: ExposureSuit | null = null;

  @Column({ type: 'boolean', nullable: true })
  hood: boolean | null = null;

  @Column({ type: 'boolean', nullable: true })
  gloves: boolean | null = null;

  @Column({ type: 'boolean', nullable: true })
  boots: boolean | null = null;

  @Column({ type: 'boolean', nullable: true })
  camera: boolean | null = null;

  @Column({ type: 'boolean', nullable: true })
  torch: boolean | null = null;

  @Column({ type: 'boolean', nullable: true })
  scooter: boolean | null = null;

  // Conditions
  @Column({ type: 'float', nullable: true })
  airTemperature: number | null = null;

  @Column({ type: 'float', nullable: true })
  surfaceTemperature: number | null = null;

  @Column({ type: 'float', nullable: true })
  bottomTemperature: number | null = null;

  @Column({ type: 'enum', enum: TemperatureUnit, nullable: true })
  temperatureUnit: TemperatureUnit | null = null;

  @Column({ type: 'float', nullable: true })
  chop: number | null = null;

  @Column({ type: 'float', nullable: true })
  current: number | null = null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  weather: string | null = null;

  @Column({ type: 'float', nullable: true })
  visibility: number | null = null;

  // Miscellaneous data
  @Column({ type: 'text', nullable: true })
  notes: string | null = null;

  @Column({
    type: 'jsonb',
    array: false,
    default: () => "'[]'",
    nullable: false,
  })
  tags: string[] = [];

  // Signatures
  @OneToMany(() => LogEntrySignatureEntity, (signature) => signature.logEntry, {
    onDelete: 'CASCADE',
  })
  signatures?: LogEntrySignatureEntity[];

  // Media
  @OneToMany(() => LogEntryMediaEntity, (media) => media.logEntry, {
    onDelete: 'CASCADE',
  })
  media?: LogEntryMediaEntity[];

  // Samples from dive computer
  @OneToMany(() => LogEntrySampleEntity, (sample) => sample.logEntry, {
    onDelete: 'CASCADE',
  })
  samples?: LogEntrySampleEntity[];
}
