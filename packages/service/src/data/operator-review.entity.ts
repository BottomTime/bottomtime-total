import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { LogEntryEntity } from './log-entry.entity';
import { OperatorEntity } from './operators.entity';
import { UserEntity } from './user.entity';

@Entity('dive_operator_reviews')
@Index(['operator', 'creator', 'createdAt'], { unique: true })
export class OperatorReviewEntity {
  @PrimaryColumn('uuid')
  id: string = '';

  @CreateDateColumn()
  createdAt: Date = new Date();

  @UpdateDateColumn()
  updatedAt: Date = new Date();

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @Index()
  creator: UserEntity = new UserEntity();

  @ManyToOne(() => OperatorEntity, (operator) => operator.reviews, {
    onDelete: 'CASCADE',
  })
  operator: OperatorEntity = new OperatorEntity();

  @ManyToOne(() => LogEntryEntity, { onDelete: 'CASCADE' })
  @Index()
  logEntry: LogEntryEntity | null = null;

  @Column({ type: 'float', nullable: false })
  @Index()
  rating: number = 0;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  comments: string | null = null;

  @Column({
    type: 'tsvector',
    select: false,
    nullable: true,
    insert: false,
    update: false,
    asExpression: `setweight(to_tsvector('english', coalesce(comments, '')), 'A')`,
    generatedType: 'STORED',
  })
  @Index()
  fulltext?: unknown;
}
