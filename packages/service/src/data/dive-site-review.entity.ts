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
import { LogEntryEntity } from './log-entry.entity';
import { UserEntity } from './user.entity';

@Entity('dive_site_reviews')
export class DiveSiteReviewEntity {
  @PrimaryColumn('uuid')
  id: string = '';

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  creator: UserEntity = new UserEntity();

  @ManyToOne(() => DiveSiteEntity, (site) => site.reviews, {
    onDelete: 'CASCADE',
  })
  site: DiveSiteEntity = new DiveSiteEntity();

  @ManyToOne(() => LogEntryEntity, { onDelete: 'SET NULL' })
  @Index()
  logEntry: LogEntryEntity | null = null;

  @CreateDateColumn({ nullable: false })
  @Index()
  createdOn?: Date;

  @UpdateDateColumn({ nullable: true })
  updatedOn: Date | null = null;

  @Column('varchar', { length: 200 })
  title: string = '';

  @Column('float')
  @Index()
  rating: number = 0;

  @Column('float', { nullable: true })
  @Index()
  difficulty: number | null = null;

  @Column('varchar', { length: 1000, nullable: true })
  comments: string | null = null;

  @Column({
    type: 'tsvector',
    select: false,
    nullable: true,
    insert: false,
    update: false,
    asExpression: `setweight(to_tsvector('english', coalesce(title, '')), 'A') || setweight(to_tsvector('english', coalesce(comments, '')), 'B')`,
    generatedType: 'STORED',
  })
  @Index()
  fulltext?: unknown;
}
