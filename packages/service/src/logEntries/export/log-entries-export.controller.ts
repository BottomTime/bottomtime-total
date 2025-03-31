import {
  ExportLogEntriesParamsDTO,
  ExportLogEntriesParamsSchema,
} from '@bottomtime/api';

import {
  Body,
  Controller,
  Inject,
  InternalServerErrorException,
  Logger,
  Post,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';

import dayjs from 'dayjs';
import { Duplex } from 'node:stream';
import { AssertTargetUser, TargetUser, User } from 'src/users';
import { bodyValidator } from 'src/zod-validator';

import { LogEntryExportService } from './log-entry-export.service';

const Preamble = `{
  "metadata": $1,
  "data": [
`;
const Postamble = `  ],
  "totalCount": $1
}`;

@Controller('api/users/:username/logbook/export')
@UseGuards(AssertTargetUser)
export class LogEntriesExportController {
  private readonly log = new Logger(LogEntriesExportController.name);

  constructor(
    @Inject(LogEntryExportService)
    private readonly service: LogEntryExportService,
  ) {}

  @Post('json')
  exportJSON(
    @TargetUser() owner: User,
    @Body(bodyValidator(ExportLogEntriesParamsSchema))
    options: ExportLogEntriesParamsDTO,
  ): StreamableFile {
    const stream = new Duplex({ encoding: 'utf-8' });
    const metadata = {};
    let totalCount = 0;

    this.log.debug('Starting export...', options);
    stream.write(Preamble.replace('$1', JSON.stringify(metadata, null, 2)));

    this.service
      .beginExport({
        ...options,
        owner,
      })
      .subscribe({
        next: (entry) => {
          stream.write(`${JSON.stringify(entry.toJSON(), null, 2)},\n`);
          totalCount++;
        },
        complete: () => {
          this.log.debug(
            `Export complete. ${totalCount} entries exported. Closing file stream...`,
          );
          stream.end(Postamble.replace('$1', totalCount.toString()));
        },
        error: (err) => {
          // If there is a failure, log the error and destroy the stream to emit an error and clean up resources.
          this.log.error(err);
          stream.destroy(new InternalServerErrorException('Export failed'));
        },
      });

    return new StreamableFile(stream, {
      type: 'application/json',
      // disposition: `attachment; filename=${dayjs().format(
      //   'YYYY-MM-DD',
      // )}-logbook.json`,
      disposition: 'inline',
    });
  }
}
