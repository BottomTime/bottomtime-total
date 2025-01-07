import { DepthUnit, WaterType } from '@bottomtime/api';

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  Point,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { DiveSiteReviewEntity } from './dive-site-review.entity';
import { LogEntryEntity } from './log-entry.entity';
import { OperatorDiveSiteEntity } from './operator-dive-site.entity';
import { OperatorEntity } from './operators.entity';
import { UserEntity } from './user.entity';

@Entity('dive_sites')
export class DiveSiteEntity {
  @PrimaryColumn('uuid')
  id: string = '';

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  creator: UserEntity = new UserEntity();

  @OneToMany(() => DiveSiteReviewEntity, (review) => review.site)
  reviews?: DiveSiteReviewEntity;

  @CreateDateColumn()
  createdOn: Date = new Date();

  @UpdateDateColumn({ nullable: true })
  updatedOn: Date | null = null;

  @Column('varchar', { length: 200 })
  @Index()
  name: string = '';

  @Column('varchar', { length: 2000, nullable: true })
  description: string | null = null;

  @Column('float', { nullable: true })
  depth: number | null = null;

  @Column('enum', { enum: DepthUnit, nullable: true })
  depthUnit: DepthUnit | null = null;

  @Column('varchar', { length: 200 })
  location: string = '';

  @Column('varchar', { length: 500, nullable: true })
  directions: string | null = null;

  @Column('geography', {
    nullable: true,
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  @Index({ spatial: true })
  gps: Point | null = null;

  @Column('boolean', { nullable: true })
  @Index()
  freeToDive: boolean | null = null;

  @Column('boolean', { nullable: true })
  @Index()
  shoreAccess: boolean | null = null;

  @Column('enum', { enum: WaterType, nullable: true })
  waterType: WaterType | null = null;

  @Column({
    type: 'tsvector',
    select: false,
    nullable: false,
    insert: false,
    update: false,
    asExpression: `setweight(to_tsvector('english', coalesce(name, '')), 'A') || setweight(to_tsvector('english', coalesce(description, '') || ' ' || location), 'B') || setweight(to_tsvector('english', coalesce(directions, '')), 'C')`,
    generatedType: 'STORED',
  })
  @Index()
  fulltext?: unknown;

  @Column('float', { nullable: true })
  @Index()
  averageRating: number | null = null;

  @OneToMany(() => LogEntryEntity, (logEntry) => logEntry.site, {
    onDelete: 'CASCADE',
  })
  logEntries?: LogEntryEntity[];

  @Column('float', { nullable: true })
  averageDifficulty: number | null = null;

  @OneToMany(() => OperatorDiveSiteEntity, (relation) => relation.site, {
    onDelete: 'CASCADE',
  })
  operators?: OperatorEntity[];
}
