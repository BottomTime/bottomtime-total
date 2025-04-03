import {
  ExportLogEntriesParamsDTO,
  ExportLogEntriesParamsSchema,
} from '@bottomtime/api';

import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  InternalServerErrorException,
  Logger,
  Query,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';

import dayjs from 'dayjs';
import { PassThrough } from 'node:stream';
import {
  AssertAccountOwner,
  AssertAuth,
  AssertTargetUser,
  TargetUser,
  User,
} from 'src/users';
import { bodyValidator } from 'src/zod-validator';

import { LogEntryExportService } from './log-entry-export.service';

const Preamble = `{
  "metadata": $1,
  "data": [
`;
const Postamble = `  ],
  "totalCount": $1
}
`;

@Controller('api/users/:username/logbook/export')
@UseGuards(AssertTargetUser, AssertAuth, AssertAccountOwner)
export class LogEntryExportController {
  private readonly log = new Logger(LogEntryExportController.name);

  constructor(
    @Inject(LogEntryExportService)
    private readonly service: LogEntryExportService,
  ) {}

  @Get('json')
  @HttpCode(HttpStatus.OK)
  exportJSON(
    @TargetUser() owner: User,
    @Query(bodyValidator(ExportLogEntriesParamsSchema))
    options: ExportLogEntriesParamsDTO,
  ): StreamableFile {
    const stream = new PassThrough({ encoding: 'utf-8' });
    const metadata = {
      exported: dayjs().toISOString(),
      logbookOwner: owner.profile.toSuccinctJSON(),
    };
    let totalCount = 0;

    this.log.log(
      `Starting export of log entries for user "${owner.username}"...`,
      options,
    );
    stream.write(Preamble.replace('$1', JSON.stringify(metadata, null, 2)));

    this.service
      .beginExport({
        ...options,
        owner,
      })
      .subscribe({
        next: (entry) => {
          if (totalCount === 0) {
            stream.write(JSON.stringify(entry.toJSON(), null, 2));
          } else {
            stream.write(`,\n${JSON.stringify(entry.toJSON(), null, 2)}`);
          }
          totalCount++;
        },
        complete: () => {
          stream.end(Postamble.replace('$1', totalCount.toString()));
          this.log.debug(
            `Export completed for user "${owner.username}". Stream has been closed. ${totalCount} entries exported.`,
          );
        },
        error: (err) => {
          // If there is a failure, log the error and destroy the stream to emit an error and clean up resources.
          this.log.error(err);
          stream.destroy(new InternalServerErrorException('Export failed'));
        },
      });

    return new StreamableFile(stream, {
      type: 'application/json',
      disposition: `attachment; filename=${dayjs().format(
        'YYYY-MM-DD',
      )}-logbook.json`,
    });
  }
}
