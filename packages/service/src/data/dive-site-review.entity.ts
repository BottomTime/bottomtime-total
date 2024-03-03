import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { DiveSiteEntity } from './dive-site.entity';
import { UserEntity } from './user.entity';

@Entity()
export class DiveSiteReview {
  @PrimaryGeneratedColumn('uuid')
  id: string = '';

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  creator: UserEntity = new UserEntity();

  @ManyToOne(() => DiveSiteEntity, { onDelete: 'CASCADE' })
  site: DiveSiteEntity = new DiveSiteEntity();

  @CreateDateColumn()
  @Index()
  createdOn: Date = new Date();

  @UpdateDateColumn()
  updatedOn?: Date;

  @Column('varchar', { length: 200 })
  @Index()
  title: string = '';

  @Column('float')
  @Index()
  rating: number = 0;

  @Column('float')
  @Index()
  difficulty?: number;

  @Column('varchar', { length: 1000 })
  comments?: string;
}
