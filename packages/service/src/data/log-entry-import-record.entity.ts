import { Column, Entity, Index, ManyToOne, PrimaryColumn } from 'typeorm';

import { LogEntryImportEntity } from './log-entry-import.entity';

@Entity('log_entry_import_records')
@Index(['import', 'timestamp'], { unique: true })
export class LogEntryImportRecordEntity {
  @PrimaryColumn('uuid')
  id: string = '';

  @ManyToOne(() => LogEntryImportEntity, { onDelete: 'CASCADE' })
  @Index()
  import?: LogEntryImportEntity;

  @Column('timestamp', { nullable: false, default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date = new Date();

  @Column('jsonb')
  data: string = '';
}
