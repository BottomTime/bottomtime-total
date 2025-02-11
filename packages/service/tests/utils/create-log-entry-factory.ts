import {
  LogEntryAirEntity,
  LogEntryEntity,
  LogEntrySampleEntity,
} from '../../src/data';
import { LogEntryFactory } from '../../src/logEntries';
import { dataSource } from '../data-source';
import { createDiveSiteFactory } from './create-dive-site-factory';
import { createOperatorFactory } from './create-operator-factory';

export function createLogEntryFactory(): LogEntryFactory {
  return new LogEntryFactory(
    dataSource.getRepository(LogEntryEntity),
    dataSource.getRepository(LogEntryAirEntity),
    dataSource.getRepository(LogEntrySampleEntity),
    createDiveSiteFactory(),
    createOperatorFactory(),
  );
}
