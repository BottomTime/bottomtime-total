import { Observable } from 'rxjs';

import { LogEntryEntity } from '../../data';
import { User } from '../../users';

export const LogsImporter = Symbol('LogsImporter');

export type ImportOptions = {
  data: Observable<string>;
  device?: string;
  deviceId?: string;
  owner: User;
};

export interface IImporter {
  import(options: ImportOptions): Observable<LogEntryEntity>;
}
