import { Observable } from 'rxjs';

import { User } from '../../users';
import { LogEntry } from '../log-entry';

export const LogsImporter = Symbol('LogsImporter');

export type ImportOptions = {
  data: Observable<unknown>;
  device?: string;
  deviceId?: string;
  owner: User;
};

export interface IImporter {
  import(options: ImportOptions): Observable<LogEntry>;
}
