import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { DiveSiteEntity } from './dive-site.entity';
import { UserEntity } from './user.entity';

@Entity('dive_site_reviews')
export class DiveSiteReview {
  @PrimaryColumn('uuid')
  id: string = '';

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  creator: UserEntity = new UserEntity();

  @ManyToOne(() => DiveSiteEntity, { onDelete: 'CASCADE' })
  site: DiveSiteEntity = new DiveSiteEntity();

  @CreateDateColumn()
  @Index()
  createdOn: Date = new Date();

  @UpdateDateColumn({ nullable: true })
  updatedOn?: Date;

  @Column('varchar', { length: 200 })
  @Index()
  title: string = '';

  @Column('float')
  @Index()
  rating: number = 0;

  @Column('float', { nullable: true })
  @Index()
  difficulty?: number;

  @Column('varchar', { length: 1000, nullable: true })
  comments?: string;
}
