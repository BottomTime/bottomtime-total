import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';

import { LogEntryImportRecordEntity } from './log-entry-import-record.entity';
import { UserEntity } from './user.entity';

@Entity('log_entry_imports')
export class LogEntryImportEntity {
  @PrimaryColumn('uuid')
  id: string = '';

  @CreateDateColumn({ type: 'timestamp' })
  @Index()
  date: Date = new Date();

  @Column('timestamp', { nullable: true })
  finalized: Date | null = null;

  @Column('varchar', { length: 500, nullable: true })
  error: string | null = null;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  owner: UserEntity = new UserEntity();

  @Column('varchar', { length: 200, nullable: true })
  device: string | null = null;

  @Column('varchar', { length: 200, nullable: true })
  @Index()
  deviceId: string | null = null;

  @Column('varchar', { length: 200, nullable: true })
  bookmark: string | null = null;

  @OneToMany(() => LogEntryImportRecordEntity, (record) => record.import, {
    onDelete: 'CASCADE',
  })
  records?: LogEntryImportRecordEntity[];
}
