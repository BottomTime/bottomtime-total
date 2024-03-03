import {
  Column,
  CreateDateColumn,
  Entity,
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
  createdOn: Date = new Date();

  @UpdateDateColumn()
  updatedOn?: Date;

  @Column('varchar', { length: 200 })
  title: string = '';

  @Column('float')
  rating: number = 0;

  @Column('float')
  difficulty?: number;

  @Column('varchar', { length: 1000 })
  comments?: string;
}
