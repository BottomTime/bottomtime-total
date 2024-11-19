import { Column, Entity, Index, ManyToOne, PrimaryColumn } from 'typeorm';

import { LogEntryImportEntity } from './log-entry-import.entity';

@Entity('log_entry_import_records')
export class LogEntryImportRecordEntity {
  @PrimaryColumn('uuid')
  id: string = '';

  @ManyToOne(() => LogEntryImportEntity, { onDelete: 'CASCADE' })
  @Index()
  import?: LogEntryImportEntity;

  @Column('jsonb')
  data: string = '';
}
