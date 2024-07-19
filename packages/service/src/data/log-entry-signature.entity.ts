import { BuddyType } from '@bottomtime/api';

import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

import { LogEntryEntity } from './log-entry.entity';
import { UserEntity } from './user.entity';

@Entity('log_entry_signatures')
export class LogEntrySignatureEntity {
  @PrimaryColumn('uuid')
  id: string = '';

  @CreateDateColumn()
  signed: Date = new Date();

  @ManyToOne(() => LogEntryEntity, (logEntry) => logEntry.signatures, {
    onDelete: 'CASCADE',
  })
  logEntry: LogEntryEntity = new LogEntryEntity();

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  buddy: UserEntity = new UserEntity();

  @Column({ type: 'enum', enum: BuddyType })
  type: BuddyType = BuddyType.Buddy;

  @Column({ type: 'varchar', length: 100, nullable: true })
  certificationNumber: string | null = null;
}
