import { DepthUnit } from '@bottomtime/api';

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  Point,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UserEntity } from './user.entity';

@Entity('dive_sites')
export class DiveSiteEntity {
  @PrimaryColumn('uuid')
  id: string = '';

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  creator: UserEntity = new UserEntity();

  @CreateDateColumn()
  createdOn: Date = new Date();

  @UpdateDateColumn({ nullable: true })
  updatedOn?: Date = new Date();

  @Column('varchar', { length: 200 })
  @Index()
  name: string = '';

  @Column('varchar', { length: 2000, nullable: true })
  description?: string;

  @Column('float', { nullable: true })
  depth?: number;

  @Column('enum', { enum: DepthUnit, nullable: true })
  depthUnit?: DepthUnit;

  @Column('varchar', { length: 200 })
  location: string = '';

  @Column('varchar', { length: 500, nullable: true })
  directions?: string;

  @Column('point')
  @Index({ spatial: true })
  gps?: Point;

  @Column('boolean', { nullable: true })
  @Index()
  freeToDive?: boolean;

  @Column('boolean', { nullable: true })
  @Index()
  shoreAccess?: boolean;

  @Column({
    type: 'tsvector',
    select: false,
    nullable: true,
    insert: false,
    update: false,
    asExpression: `setweight(to_tsvector('english', coalesce(name, '')), 'A') || setweight(to_tsvector('english', coalesce(description, '') || ' ' || location), 'B') || setweight(to_tsvector('english', coalesce(directions, '')), 'C')`,
    generatedType: 'STORED',
  })
  @Index()
  fulltext?: unknown;
}
