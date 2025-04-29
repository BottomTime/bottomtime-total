import { LogEntryImportEntity, LogEntryImportRecordEntity } from 'src/data';
import { Importer } from 'src/logEntries/import/importer';
import { LogEntryImportFactory } from 'src/logEntries/import/log-entry-import-factory';
import { dataSource } from 'tests/data-source';

import { createLogEntryFactory } from './create-log-entry-factory';
import { createUserFactory } from './create-user-factory';

export function createLogEntryImportFactory(
  importer?: Importer,
): LogEntryImportFactory {
  return new LogEntryImportFactory(
    dataSource.getRepository(LogEntryImportEntity),
    dataSource.getRepository(LogEntryImportRecordEntity),
    createUserFactory(),
    importer ?? new Importer(dataSource, createLogEntryFactory()),
  );
}
