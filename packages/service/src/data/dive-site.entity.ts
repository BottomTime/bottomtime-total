import { DepthUnit } from '@bottomtime/api';

import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  Point,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { UserEntity } from './user.entity';

@Entity()
export class DiveSiteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string = '';

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  creator: UserEntity = new UserEntity();

  @CreateDateColumn()
  createdOn: Date = new Date();

  @UpdateDateColumn()
  updatedOn: Date = new Date();

  @Column('varchar', { length: 200 })
  @Index()
  name: string = '';

  @Column('varchar', { length: 2000 })
  description?: string;

  @Column('float')
  depth?: number;

  @Column('enum', { enum: DepthUnit })
  depthUnit?: DepthUnit;

  @Column('varchar', { length: 200 })
  location: string = '';

  @Column('varchar', { length: 500 })
  directions?: string;

  @Column('geometry')
  @Index({ spatial: true })
  gps?: Point;

  @Column('boolean')
  @Index()
  freeToDive?: boolean;

  @Column('boolean')
  @Index()
  shoreAccess?: boolean;
}
