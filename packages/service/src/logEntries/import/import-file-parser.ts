import { NotImplementedException } from '@nestjs/common';

import { User } from 'src/users';

import { LogEntryImport } from './log-entry-import';

export type ImportFileResult =
  | {
      success: true;
      import: LogEntryImport;
    }
  | {
      success: false;
      error: Error;
    };

export interface IImportFileParser {
  parseFile(file: Express.Multer.File, owner: User): Promise<ImportFileResult>;
}

export class ImportFileParser implements IImportFileParser {
  async parseFile(
    file: Express.Multer.File,
    owner: User,
  ): Promise<ImportFileResult> {
    // TODO: Figure out what kind of file we're looking at and how to handle it.
    // Wish I had examples. >:|
    // logImport.addRecords

    return {
      success: false,
      error: new NotImplementedException('Not implemented yet'),
    };
  }
}
