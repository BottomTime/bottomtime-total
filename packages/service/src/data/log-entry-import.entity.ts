import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';

import { LogEntryEntity } from './log-entry.entity';
import { UserEntity } from './user.entity';

@Entity('log_entry_imports')
export class LogEntryImportEntity {
  @PrimaryColumn('uuid')
  id: string = '';

  @CreateDateColumn({ type: 'timestamp' })
  @Index()
  date: Date = new Date();

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  owner: UserEntity = new UserEntity();

  @Column('varchar', { length: 200, nullable: true })
  device: string | null = null;

  @Column('varchar', { length: 200, nullable: true })
  deviceId: string | null = null;

  @Column('varchar', { length: 200, nullable: true })
  bookmark: string | null = null;

  @Column('varchar', { length: 100, nullable: true })
  resumeToken: string | null = null;

  @OneToMany(() => LogEntryEntity, (entry) => entry.import, {
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  entries?: LogEntryEntity[];
}
