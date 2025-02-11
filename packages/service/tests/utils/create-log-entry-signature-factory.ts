import { LogEntrySignatureEntity } from '../../src/data';
import { LogEntrySignatureFactory } from '../../src/logEntries';
import { dataSource } from '../data-source';
import { createAgencyFactory } from './create-agency-factory';
import { createUserFactory } from './create-user-factory';

export function createLogEntrySignatureFactory(): LogEntrySignatureFactory {
  return new LogEntrySignatureFactory(
    dataSource.getRepository(LogEntrySignatureEntity),
    createUserFactory(),
    createAgencyFactory(),
  );
}
